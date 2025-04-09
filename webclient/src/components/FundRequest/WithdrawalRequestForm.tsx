"use client";

import { useState, useEffect } from "react";
import { parseEther, formatEther } from "viem";
import {
    useWriteContract,
    useWaitForTransactionReceipt,
    useAccount,
    useReadContract,
    usePublicClient,
} from "wagmi";
import { FUND_ALLOCATION_ADDRESS } from "@/lib/constants";
import { fundAllocationABI } from "@/contracts/abis";
import Link from "next/link";
import { isFundraiserCreator } from "@/lib/validators";

// Updated to use the proper contract address and ABI
const contractConfig = {
    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
    abi: fundAllocationABI,
};

interface WithdrawalRequestFormProps {
    fundraiserId: number;
    onSuccess?: () => void;
    initialSelectedFundraiser?: string;
    skipFundraiserSelect?: boolean;
}

export default function WithdrawalRequestForm({
    fundraiserId,
    onSuccess,
    initialSelectedFundraiser,
    skipFundraiserSelect = false,
}: WithdrawalRequestFormProps) {
    const [selectedFundraiser, setSelectedFundraiser] = useState<string>(
        initialSelectedFundraiser || ""
    );
    const [description, setDescription] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [requiresProof, setRequiresProof] = useState<boolean>(true);
    const [fundraisers, setFundraisers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [remainingAmount, setRemainingAmount] = useState<string>("0");
    const [selectedFundraiserDetails, setSelectedFundraiserDetails] =
        useState<any>(null);

    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();
    const { writeContract, data: txHash } = useWriteContract();
    const { isLoading: isTxPending, isSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    // Fetch fundraisers where the current user is the creator
    useEffect(() => {
        const fetchFundraisers = async () => {
            if (!publicClient || !address) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                // Get the total number of fundraisers
                const count = await publicClient.readContract({
                    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                    abi: fundAllocationABI,
                    functionName: "getFundraiserCount",
                });

                console.log(`Total fundraiser count: ${Number(count)}`);

                const userFundraisers = [];

                // Loop through all fundraisers to find those created by the current user
                for (let i = 0; i < Number(count); i++) {
                    try {
                        const fundraiser = (await publicClient.readContract({
                            address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                            abi: fundAllocationABI,
                            functionName: "fundraisers",
                            args: [i],
                        })) as any[];

                        const creatorAddress = fundraiser[1]; // Index 1 is the creator address
                        const isOwner = isFundraiserCreator(
                            creatorAddress,
                            address
                        );

                        console.log(
                            `Fundraiser ${i} creator: ${creatorAddress}, Current user: ${address}, Is owner: ${isOwner}`
                        );

                        if (isOwner) {
                            const name = fundraiser[2] || `Fundraiser #${i}`; // Index 2 is the name/title
                            const description =
                                fundraiser[3] || "No description"; // Index 3 is the description
                            const targetAmount = fundraiser[4]; // Index 4 is the target amount
                            const raisedAmount = fundraiser[5]; // Index 5 is the raised amount
                            const active = fundraiser[6]; // Index 6 is the active status
                            const milestoneCount = Number(fundraiser[8]) || 0; // Index 8 is milestone count

                            userFundraisers.push({
                                id: i,
                                name,
                                description,
                                targetAmount,
                                raisedAmount,
                                active,
                                milestoneCount,
                            });
                        }
                    } catch (error) {
                        console.error(`Error fetching fundraiser ${i}:`, error);
                    }
                }

                setFundraisers(userFundraisers);
                console.log(
                    `Found ${userFundraisers.length} fundraisers for user ${address}`
                );
            } catch (error) {
                console.error("Error fetching fundraisers:", error);
                setError("Failed to load fundraisers. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchFundraisers();
    }, [publicClient, address]);

    // Update selected fundraiser when initialSelectedFundraiser changes
    useEffect(() => {
        if (initialSelectedFundraiser) {
            setSelectedFundraiser(initialSelectedFundraiser);
            console.log(
                `Fundraiser selection updated from props: ${initialSelectedFundraiser}`
            );
        }
    }, [initialSelectedFundraiser]);

    // Fetch selected fundraiser details and calculate remaining amount
    useEffect(() => {
        const fetchFundraiserDetails = async () => {
            if (
                !publicClient ||
                !selectedFundraiser ||
                selectedFundraiser === ""
            )
                return;

            try {
                const fundraiserId = parseInt(selectedFundraiser);

                // First check if fundraiser exists
                try {
                    // Get fundraiser details
                    const fundraiser = await publicClient.readContract({
                        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                        abi: fundAllocationABI,
                        functionName: "fundraisers",
                        args: [fundraiserId],
                    });

                    // If we get here, fundraiser exists, now get milestone amount
                    const totalMilestoneAmount =
                        await publicClient.readContract({
                            address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                            abi: fundAllocationABI,
                            functionName: "getTotalMilestoneAmount",
                            args: [fundraiserId],
                        });

                    // Calculate remaining amount
                    const targetAmount = (fundraiser as any[])[4]; // targetAmount is at index 4
                    const remainingAvailable =
                        targetAmount - BigInt(totalMilestoneAmount as any);

                    setSelectedFundraiserDetails({
                        targetAmount,
                        totalMilestoneAmount,
                        remainingAvailable,
                    });

                    setRemainingAmount(formatEther(remainingAvailable));
                    console.log(
                        `Remaining available amount: ${formatEther(
                            remainingAvailable
                        )} ETH`
                    );
                } catch (e) {
                    console.error("Error fetching fundraiser:", e);
                    setError(
                        "This fundraiser does not exist or is not accessible."
                    );
                }
            } catch (error) {
                console.error("Error fetching fundraiser details:", error);
                setError(
                    "Failed to load fundraiser details. Please try again."
                );
            }
        };

        fetchFundraiserDetails();
    }, [publicClient, selectedFundraiser]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!selectedFundraiser) {
            setError("Please select a fundraiser");
            return;
        }

        if (!description) {
            setError("Please enter a description");
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            setError("Please enter a valid amount");
            return;
        }

        if (!isConnected) {
            setError("Please connect your wallet to continue");
            return;
        }

        // Validate amount against remaining available
        const requestedAmount = parseFloat(amount);
        const remainingAvailable = parseFloat(remainingAmount);

        if (requestedAmount > remainingAvailable) {
            setError(
                `Amount exceeds the remaining available target (${remainingAvailable} ETH). Please enter a smaller amount.`
            );
            return;
        }

        try {
            setIsSubmitting(true);
            console.log(
                `Creating milestone for fundraiser ${selectedFundraiser} with description "${description}", amount ${amount} ETH, and requiresProof: ${requiresProof}`
            );

            // Convert the amount to Wei (parseEther handles this)
            const amountInWei = parseEther(amount);

            // Call the contract function to add a milestone with the requiresProof parameter
            await writeContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "addMilestone",
                args: [
                    BigInt(selectedFundraiser),
                    description,
                    amountInWei,
                    requiresProof,
                ],
            });
        } catch (error) {
            console.error("Error creating fund request:", error);
            setError(
                `Failed to create fund request: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
            setIsSubmitting(false);
        }
    };

    // Handle transaction success
    useEffect(() => {
        if (isSuccess) {
            setSuccess(`Fund request created successfully!`);
            setDescription("");
            setAmount("");
            setIsSubmitting(false);

            // Refresh the fundraisers list
            setTimeout(() => {
                window.location.href = "/fund-requests";
            }, 2000);
        }
    }, [isSuccess]);

    // If not connected, show a message
    if (!isConnected) {
        return (
            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
                <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Connect Your Wallet
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Please connect your wallet to create a fund request.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    Create Fund Request
                </h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                    <p>
                        Create a new fund request for your fundraiser. Once
                        created, it will need approval from validators before
                        funds can be released.
                    </p>
                    <p className="mt-2">
                        For the first fund request (initial funding), no proof
                        is required. For subsequent requests, you'll need to
                        submit proof of milestone completion.
                    </p>
                </div>

                {/* Display loading, error, and success messages */}
                {isLoading && (
                    <div className="mt-4">
                        <div className="animate-pulse flex space-x-4">
                            <div className="flex-1 space-y-4 py-1">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md">
                        {success}
                    </div>
                )}

                {/* No fundraisers message */}
                {!isLoading && fundraisers.length === 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-md">
                        <p>
                            You don't have any fundraisers yet. Create a
                            fundraiser first to request funds.
                        </p>
                        <a
                            href="/create"
                            className="mt-3 inline-block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                            Create a Fundraiser
                        </a>
                    </div>
                )}

                {/* Form */}
                {!isLoading && fundraisers.length > 0 && (
                    <form
                        onSubmit={handleSubmit}
                        className="mt-5">
                        <div className="grid grid-cols-1 gap-6">
                            {/* Show fundraiser selector only if not skipped */}
                            {!skipFundraiserSelect && (
                                <div>
                                    <label
                                        htmlFor="fundraiser"
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Fundraiser
                                    </label>
                                    <select
                                        id="fundraiser"
                                        name="fundraiser"
                                        value={selectedFundraiser}
                                        onChange={(e) =>
                                            setSelectedFundraiser(
                                                e.target.value
                                            )
                                        }
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                        required>
                                        <option value="">
                                            Select a fundraiser
                                        </option>
                                        {fundraisers.map((fundraiser) => (
                                            <option
                                                key={fundraiser.id}
                                                value={fundraiser.id}>
                                                {fundraiser.name} (
                                                {fundraiser.milestoneCount} fund
                                                requests)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {selectedFundraiser && (
                                <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded-md">
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        <strong>
                                            Remaining available amount:
                                        </strong>{" "}
                                        {remainingAmount} ETH
                                    </p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                        Your milestone amount cannot exceed this
                                        value
                                    </p>
                                </div>
                            )}

                            <div>
                                <label
                                    htmlFor="description"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Description
                                </label>
                                <div className="mt-1">
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={3}
                                        value={description}
                                        onChange={(e) =>
                                            setDescription(e.target.value)
                                        }
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                        placeholder="Describe what this fund request is for"
                                        required></textarea>
                                </div>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    Explain the milestone this funding will help
                                    you achieve.
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="amount"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Amount (ETH)
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <input
                                        type="text"
                                        name="amount"
                                        id="amount"
                                        value={amount}
                                        onChange={(e) =>
                                            setAmount(e.target.value)
                                        }
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pr-12 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                        placeholder="0.00"
                                        pattern="[0-9]*[.]?[0-9]*"
                                        max={remainingAmount}
                                        required
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                                            ETH
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="requiresProof"
                                            name="requiresProof"
                                            type="checkbox"
                                            checked={requiresProof}
                                            onChange={(e) =>
                                                setRequiresProof(
                                                    e.target.checked
                                                )
                                            }
                                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label
                                            htmlFor="requiresProof"
                                            className="font-medium text-gray-700 dark:text-gray-300">
                                            Requires Proof
                                        </label>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            Check this if proof should be
                                            required before fund release
                                            approval
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting || isTxPending}
                                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                                    isSubmitting || isTxPending
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                }`}>
                                {isSubmitting || isTxPending ? (
                                    <>
                                        <svg
                                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24">
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating...
                                    </>
                                ) : (
                                    "Create Fund Request"
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
