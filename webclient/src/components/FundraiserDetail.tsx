"use client";

import { useState } from "react";
import {
    useReadContract,
    useWriteContract,
    useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import { fundAllocationABI } from "@/contracts/abis";
import { formatEther } from "ethers";
import { MilestoneList } from "./Dashboard/MilestoneList";

interface FundraiserDetailProps {
    id: bigint;
}

export default function FundraiserDetail({ id }: FundraiserDetailProps) {
    const [amount, setAmount] = useState("");
    const [hash, setHash] = useState<`0x${string}` | undefined>();
    const [error, setError] = useState<string | null>(null);

    const { data: fundraiser, isLoading } = useReadContract({
        abi: fundAllocationABI,
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
        functionName: "getFundraiser",
        args: [id],
    });

    const { writeContract } = useWriteContract();
    const { isLoading: isConfirming } = useWaitForTransactionReceipt({
        hash,
    });

    const handleDonate = async () => {
        if (!amount) {
            setError("Please enter an amount to donate");
            return;
        }

        try {
            const result = await writeContract({
                abi: fundAllocationABI,
                address: process.env
                    .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
                functionName: "donate",
                args: [id],
                value: parseEther(amount),
            });

            if (typeof result === "string") {
                setHash(result as `0x${string}`);
                setAmount("");
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to process donation"
            );
        }
    };

    if (isLoading) return <div>Loading fundraiser details...</div>;
    if (!fundraiser) return <div>Fundraiser not found</div>;

    // Destructure the fundraiser data from the returned array
    const [
        creator,
        name,
        description,
        goal,
        raised,
        endDate,
        status,
        milestoneCount,
    ] = fundraiser;

    const formattedGoal = formatEther(goal);
    const formattedRaised = formatEther(raised);
    const endDateString = new Date(Number(endDate) * 1000).toLocaleDateString();
    const progress = raised > 0n ? (Number(raised) * 100) / Number(goal) : 0;

    return (
        <div className="max-w-4xl mx-auto p-6">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">{name}</h1>
                <p className="text-gray-600 mb-4">By: {creator}</p>
                <p className="mb-4">{description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="border p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Goal</p>
                        <p className="text-xl font-bold">{formattedGoal} ETH</p>
                    </div>
                    <div className="border p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Raised</p>
                        <p className="text-xl font-bold">
                            {formattedRaised} ETH
                        </p>
                    </div>
                    <div className="border p-4 rounded-lg">
                        <p className="text-sm text-gray-500">End Date</p>
                        <p className="text-xl font-bold">{endDateString}</p>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{
                                width: `${progress > 100 ? 100 : progress}%`,
                            }}></div>
                    </div>
                    <p className="text-right text-sm mt-1">
                        {progress.toFixed(2)}% Funded
                    </p>
                </div>

                {status === 0 && (
                    <div className="flex items-end gap-2">
                        <div className="flex-grow">
                            <label className="block mb-1 font-medium">
                                Donation Amount (ETH)
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="0.01"
                                step="0.01"
                                className="w-full p-2 border rounded"
                                placeholder="0.00"
                            />
                        </div>
                        <button
                            onClick={handleDonate}
                            disabled={isConfirming}
                            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                            {isConfirming ? "Processing..." : "Donate"}
                        </button>
                    </div>
                )}

                {status !== 0 && (
                    <div className="p-4 bg-yellow-100 rounded-lg">
                        <p className="font-medium text-yellow-800">
                            {status === 1
                                ? "This fundraiser has reached its goal"
                                : status === 2
                                ? "This fundraiser has ended"
                                : "This fundraiser is no longer accepting donations"}
                        </p>
                    </div>
                )}
            </div>

            <MilestoneList
                fundraiserId={id}
                milestoneCount={Number(milestoneCount)}
            />
        </div>
    );
}
