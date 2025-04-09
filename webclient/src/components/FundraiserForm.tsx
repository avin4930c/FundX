"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    useWriteContract,
    useWaitForTransactionReceipt,
    usePublicClient,
} from "wagmi";
import { fundAllocationABI } from "@/contracts/abis";

export default function FundraiserForm() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [goal, setGoal] = useState("");
    const [endDate, setEndDate] = useState("");
    const [milestones, setMilestones] = useState<
        { description: string; amount: string }[]
    >([{ description: "", amount: "" }]);
    const [error, setError] = useState<string | null>(null);
    const [hash, setHash] = useState<`0x${string}` | undefined>();
    const publicClient = usePublicClient();

    const { writeContract } = useWriteContract();

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        });

    const handleAddMilestone = () => {
        setMilestones([...milestones, { description: "", amount: "" }]);
    };

    const handleMilestoneChange = (
        index: number,
        field: "description" | "amount",
        value: string
    ) => {
        const newMilestones = [...milestones];
        newMilestones[index] = {
            ...newMilestones[index],
            [field]: value,
        };
        setMilestones(newMilestones);
    };

    const handleRemoveMilestone = (index: number) => {
        if (milestones.length === 1) return;
        setMilestones(milestones.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            // Basic validation
            if (!name || !description || !goal || !endDate) {
                setError("Please fill out all required fields");
                return;
            }

            if (milestones.some((m) => !m.description || !m.amount)) {
                setError("Please fill out all milestone fields");
                return;
            }

            const goalWei = BigInt(parseFloat(goal) * 1e18);

            // Convert date string to timestamp (seconds since epoch)
            const endDateTimestamp = Math.floor(
                new Date(endDate).getTime() / 1000
            );

            // Check if date is valid
            if (isNaN(endDateTimestamp)) {
                setError("Please enter a valid end date");
                return;
            }

            const result = await writeContract({
                abi: fundAllocationABI,
                address: process.env
                    .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
                functionName: "createFundraiser",
                args: [name, description, goalWei],
            });

            console.log("Fundraiser created with transaction:", result);

            if (typeof result === "string") {
                setHash(result as `0x${string}`);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to create fundraiser"
            );
        }
    };

    // After confirmation, add milestones
    useEffect(() => {
        const addMilestones = async () => {
            if (isConfirmed && milestones.length > 0) {
                try {
                    // Check if public client is available
                    if (!publicClient) {
                        console.error("Public client not available");
                        return;
                    }

                    // Get the current fundraiser count which should give us the ID of the newly created fundraiser
                    const count = await publicClient.readContract({
                        address: process.env
                            .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
                        abi: fundAllocationABI,
                        functionName: "getFundraiserCount",
                    });

                    // The new fundraiser ID is count-1 since IDs are zero-based
                    const newFundraiserId = BigInt(Number(count) - 1);
                    console.log(
                        "New fundraiser ID:",
                        newFundraiserId.toString()
                    );

                    // Add each milestone
                    for (let i = 0; i < milestones.length; i++) {
                        const milestone = milestones[i];
                        const milestoneAmount = BigInt(
                            parseFloat(milestone.amount) * 1e18
                        );

                        // Clean the description to remove problematic characters
                        const cleanDescription = milestone.description.replace(
                            /[,\.\/\\]/g,
                            " "
                        );
                        console.log(
                            `Adding milestone with cleaned description: ${cleanDescription}`
                        );

                        await writeContract({
                            abi: fundAllocationABI,
                            address: process.env
                                .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
                            functionName: "addMilestone",
                            args: [
                                newFundraiserId,
                                cleanDescription,
                                milestoneAmount,
                            ],
                        });

                        console.log(
                            `Added milestone ${i + 1}/${milestones.length}`
                        );
                    }

                    console.log("All milestones added successfully");

                    // Redirect to the main page after all milestones are added
                    router.push("/");
                } catch (milestoneError) {
                    console.error("Error adding milestones:", milestoneError);
                    setError(
                        "Fundraiser created but there was an error adding milestones"
                    );
                }
            }
        };

        addMilestones();
    }, [isConfirmed, milestones, writeContract, router, publicClient]);

    // Add error handling for missing wallet connection
    const isWalletConnected = !!publicClient;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Create New Fundraiser</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="space-y-6">
                <div>
                    <label className="block mb-2 font-medium">
                        Fundraiser Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>

                <div>
                    <label className="block mb-2 font-medium">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 border rounded"
                        rows={4}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-2 font-medium">
                            Funding Goal (ETH)
                        </label>
                        <input
                            type="number"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            step="0.01"
                            min="0"
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    <div>
                        <label className="block mb-2 font-medium">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between mb-2">
                        <h3 className="font-medium">Milestones</h3>
                        <button
                            type="button"
                            onClick={handleAddMilestone}
                            className="bg-blue-500 text-white px-2 py-1 rounded text-sm">
                            + Add Milestone
                        </button>
                    </div>

                    {milestones.map((milestone, index) => (
                        <div
                            key={index}
                            className="grid grid-cols-1 md:grid-cols-8 gap-2 mb-2 items-end border p-3 rounded">
                            <div className="md:col-span-5">
                                <label className="block mb-1 text-sm">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={milestone.description}
                                    onChange={(e) =>
                                        handleMilestoneChange(
                                            index,
                                            "description",
                                            e.target.value
                                        )
                                    }
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block mb-1 text-sm">
                                    Amount (ETH)
                                </label>
                                <input
                                    type="number"
                                    value={milestone.amount}
                                    onChange={(e) =>
                                        handleMilestoneChange(
                                            index,
                                            "amount",
                                            e.target.value
                                        )
                                    }
                                    step="0.01"
                                    min="0"
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div className="md:col-span-1">
                                <button
                                    type="button"
                                    onClick={() => handleRemoveMilestone(index)}
                                    disabled={milestones.length === 1}
                                    className="bg-red-500 text-white w-full p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                                    -
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    type="submit"
                    disabled={isConfirming}
                    className="bg-blue-600 text-white py-2 px-4 rounded w-full disabled:opacity-50 disabled:cursor-not-allowed">
                    {isConfirming ? "Creating..." : "Create Fundraiser"}
                </button>
            </form>
        </div>
    );
}
