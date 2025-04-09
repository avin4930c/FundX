"use client";

import { useEffect, useState } from "react";
import {
    useAccount,
    usePublicClient,
    useWriteContract,
    useWaitForTransactionReceipt,
} from "wagmi";
import { fundAllocationABI } from "@/contracts/abis";
import { FUND_ALLOCATION_ADDRESS } from "@/lib/constants";
import { formatEther } from "viem";
import { VALIDATOR_ADDRESSES, isValidatorAddress } from "@/lib/validators";

interface MilestoneListProps {
    fundraiserId: bigint;
    milestoneCount: number;
}

// Milestone type definition
type Milestone = {
    index: number;
    description: string;
    amount: string;
    proofSubmitted: boolean;
    proof: string;
    approved: boolean;
    fundsReleased: boolean;
    yesVotes: number;
    noVotes: number;
};

export function MilestoneList({
    fundraiserId,
    milestoneCount,
}: MilestoneListProps) {
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [proofInput, setProofInput] = useState("");
    const [selectedMilestoneIndex, setSelectedMilestoneIndex] = useState<
        number | null
    >(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();

    const { writeContract, data: txHash } = useWriteContract();

    const { isLoading: isWaitLoading, isSuccess } =
        useWaitForTransactionReceipt({
            hash: txHash,
        });

    // Check if current user is a validator (using the helper)
    const [isValidator, setIsValidator] = useState(false);

    useEffect(() => {
        const checkIsValidator = async () => {
            if (!address) return;

            console.log(
                "MilestoneList - Validator addresses:",
                VALIDATOR_ADDRESSES
            );
            console.log("MilestoneList - Current address:", address);

            // Use the helper function
            const isUserValidator = isValidatorAddress(address);

            console.log(
                `MilestoneList - Checking if ${address} is validator: ${isUserValidator}`
            );
            setIsValidator(isUserValidator);
        };

        checkIsValidator();
    }, [address]);

    // Load all milestones for the given fundraiser
    useEffect(() => {
        const loadMilestones = async () => {
            setLoading(true);
            setError(null);

            try {
                if (!publicClient) {
                    console.error("Public client not available");
                    return;
                }

                console.log(
                    `Loading milestones for fundraiser ${fundraiserId}...`
                );

                const loadedMilestones: Milestone[] = [];

                // Loop through all milestones for this fundraiser
                for (let i = 0; i < milestoneCount; i++) {
                    try {
                        const milestone = (await publicClient.readContract({
                            address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                            abi: fundAllocationABI,
                            functionName: "getMilestone",
                            args: [fundraiserId, BigInt(i)],
                        })) as any[];

                        console.log(
                            `Milestone ${Number(fundraiserId)}-${i} data:`,
                            milestone
                        );

                        // Extract data from milestone array according to contract structure
                        // milestone[0] = description
                        // milestone[1] = amount
                        // milestone[2] = hasProof
                        // milestone[3] = proof
                        // milestone[4] = isApproved
                        // milestone[5] = fundsReleased
                        // milestone[6] = yesVotes
                        // milestone[7] = noVotes
                        loadedMilestones.push({
                            index: i,
                            description: milestone[0] || `Milestone ${i + 1}`,
                            amount: formatEther(milestone[1] || BigInt(0)),
                            proofSubmitted: milestone[2] || false,
                            proof: milestone[3] || "",
                            approved: milestone[4] || false,
                            fundsReleased: milestone[5] || false,
                            yesVotes: Number(milestone[6] || 0),
                            noVotes: Number(milestone[7] || 0),
                        });
                    } catch (milestoneError) {
                        console.error(
                            `Error loading milestone ${Number(
                                fundraiserId
                            )}-${i}:`,
                            milestoneError
                        );
                        // Add placeholder with error state
                        loadedMilestones.push({
                            index: i,
                            description: `Error loading milestone ${i}`,
                            amount: "0",
                            proofSubmitted: false,
                            proof: "",
                            approved: false,
                            fundsReleased: false,
                            yesVotes: 0,
                            noVotes: 0,
                        });
                    }
                }

                console.log(
                    `Loaded ${loadedMilestones.length} milestones for fundraiser ${fundraiserId}`
                );
                setMilestones(loadedMilestones);
            } catch (err) {
                console.error("Error loading milestones:", err);
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load milestones"
                );
            } finally {
                setLoading(false);
            }
        };

        loadMilestones();
    }, [publicClient, fundraiserId, milestoneCount, refreshTrigger]);

    // Handle successful transaction completion
    useEffect(() => {
        if (isSuccess) {
            console.log("Transaction successful, refreshing milestones...");
            setRefreshTrigger((prev) => prev + 1);
            setProofInput("");
            setSelectedMilestoneIndex(null);
        }
    }, [isSuccess]);

    const handleVote = async (milestoneIndex: number, approve: boolean) => {
        try {
            if (!isConnected) {
                alert("Please connect your wallet first");
                return;
            }

            console.log(
                `Voting ${
                    approve ? "YES" : "NO"
                } on milestone ${milestoneIndex} for fundraiser ${fundraiserId}`
            );

            await writeContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "voteMilestone",
                args: [fundraiserId, approve],
            });

            console.log(
                `Vote transaction submitted for fundraiser ${fundraiserId}, vote=${approve}`
            );
        } catch (err) {
            console.error("Error voting on milestone:", err);
            alert(
                `Failed to vote: ${
                    err instanceof Error ? err.message : String(err)
                }`
            );
        }
    };

    const handleSubmitProof = async (milestoneIndex: number) => {
        if (!proofInput.trim()) {
            alert("Please enter proof before submitting");
            return;
        }

        try {
            if (!isConnected) {
                alert("Please connect your wallet first");
                return;
            }

            console.log(
                `Submitting proof for milestone ${milestoneIndex} of fundraiser ${fundraiserId}: ${proofInput}`
            );

            await writeContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "submitMilestoneProof",
                args: [fundraiserId, BigInt(milestoneIndex), proofInput],
            });
        } catch (err) {
            console.error("Error submitting proof:", err);
            alert(
                `Failed to submit proof: ${
                    err instanceof Error ? err.message : String(err)
                }`
            );
        }
    };

    const handleReleaseFunds = async (milestoneIndex: number) => {
        try {
            if (!isConnected) {
                alert("Please connect your wallet first");
                return;
            }

            console.log(
                `Releasing funds for milestone ${milestoneIndex} of fundraiser ${fundraiserId}`
            );

            await writeContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "releaseMilestoneFunds",
                args: [fundraiserId, BigInt(milestoneIndex)],
            });
        } catch (err) {
            console.error("Error releasing funds:", err);
            alert(
                `Failed to release funds: ${
                    err instanceof Error ? err.message : String(err)
                }`
            );
        }
    };

    // Manual refresh function
    const handleRefresh = () => {
        console.log("Manual refresh triggered");
        setRefreshTrigger((prev) => prev + 1);
        setLoading(true);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 py-4">
                <p>{error}</p>
                <button
                    onClick={handleRefresh}
                    className="mt-2 text-blue-500 hover:text-blue-700 underline">
                    Try again
                </button>
            </div>
        );
    }

    if (!milestones.length) {
        return (
            <div className="text-gray-500">
                No milestones found for this fundraiser
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                    Fund Requests ({milestones.length})
                </h3>
                <button
                    onClick={handleRefresh}
                    className="text-blue-500 hover:text-blue-700 text-sm flex items-center">
                    <svg
                        className="w-4 h-4 mr-1"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    Refresh
                </button>
            </div>

            <div className="space-y-4">
                {milestones.map((milestone) => (
                    <div
                        key={milestone.index}
                        className={`border p-4 rounded-lg ${
                            milestone.fundsReleased
                                ? "border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-800"
                                : milestone.approved
                                ? "border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800"
                                : milestone.proofSubmitted
                                ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800"
                                : "border-gray-300 dark:border-gray-700"
                        }`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-medium text-lg">
                                    {milestone.index === 0
                                        ? "Initial Funding Request"
                                        : `Fund Request #${milestone.index}`}
                                </h4>
                                <p className="text-gray-600 dark:text-gray-300 mt-1">
                                    {milestone.description}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 text-xs rounded-full font-medium">
                                    {milestone.amount} ETH
                                </span>

                                <div className="mt-2 text-sm">
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Status:
                                        <span
                                            className={`ml-1 font-medium ${
                                                milestone.fundsReleased
                                                    ? "text-green-600 dark:text-green-400"
                                                    : milestone.approved
                                                    ? "text-blue-600 dark:text-blue-400"
                                                    : milestone.proofSubmitted
                                                    ? "text-yellow-600 dark:text-yellow-400"
                                                    : "text-gray-600 dark:text-gray-400"
                                            }`}>
                                            {milestone.fundsReleased
                                                ? "Funds Released"
                                                : milestone.approved
                                                ? "Approved"
                                                : milestone.proofSubmitted
                                                ? "Awaiting Approval"
                                                : "Awaiting Proof"}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {milestone.proof && (
                            <div className="mt-3">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Proof:
                                </div>
                                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                    {milestone.proof}
                                </div>
                            </div>
                        )}

                        {/* Special message for first milestone */}
                        {milestone.index === 0 && !milestone.proofSubmitted && (
                            <div className="mt-3 bg-blue-50 dark:bg-blue-900/30 p-2 rounded text-sm text-blue-800 dark:text-blue-200">
                                <span className="font-medium">Note:</span>{" "}
                                Initial funding requests don't require proof
                                submission.
                            </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                            {/* Voting statistics */}
                            {(milestone.yesVotes > 0 ||
                                milestone.noVotes > 0) && (
                                <div className="w-full flex gap-4 text-sm">
                                    <span className="text-green-600 dark:text-green-400">
                                        ✓ {milestone.yesVotes} approval
                                        {milestone.yesVotes !== 1 ? "s" : ""}
                                    </span>
                                    <span className="text-red-600 dark:text-red-400">
                                        ✗ {milestone.noVotes} rejection
                                        {milestone.noVotes !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            )}

                            {/* Submit proof (only for non-first milestones that don't have proof yet) */}
                            {!milestone.proofSubmitted &&
                                milestone.index !== 0 && (
                                    <div className="mt-2 w-full">
                                        {selectedMilestoneIndex ===
                                        milestone.index ? (
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <input
                                                    type="text"
                                                    value={proofInput}
                                                    onChange={(e) =>
                                                        setProofInput(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Enter proof URL or text"
                                                    className="border p-2 rounded flex-grow"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() =>
                                                            handleSubmitProof(
                                                                milestone.index
                                                            )
                                                        }
                                                        disabled={
                                                            isWaitLoading ||
                                                            !proofInput.trim()
                                                        }
                                                        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                                                        {isWaitLoading
                                                            ? "Submitting..."
                                                            : "Submit"}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMilestoneIndex(
                                                                null
                                                            );
                                                            setProofInput("");
                                                        }}
                                                        className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() =>
                                                    setSelectedMilestoneIndex(
                                                        milestone.index
                                                    )
                                                }
                                                className="bg-blue-500 text-white px-4 py-2 rounded">
                                                Submit Proof
                                            </button>
                                        )}
                                    </div>
                                )}

                            {/* Validator controls - vote on milestones with proof or initial milestones */}
                            {isValidator &&
                                (milestone.proofSubmitted ||
                                    milestone.index === 0) &&
                                !milestone.approved &&
                                !milestone.fundsReleased && (
                                    <div className="mt-2 space-x-2">
                                        <button
                                            onClick={() =>
                                                handleVote(
                                                    milestone.index,
                                                    true
                                                )
                                            }
                                            disabled={isWaitLoading}
                                            className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                                            {isWaitLoading
                                                ? "Approving..."
                                                : "Approve"}
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleVote(
                                                    milestone.index,
                                                    false
                                                )
                                            }
                                            disabled={isWaitLoading}
                                            className="bg-red-500 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                                            {isWaitLoading
                                                ? "Rejecting..."
                                                : "Reject"}
                                        </button>
                                    </div>
                                )}

                            {/* Release funds button (only when approved and not yet released) */}
                            {milestone.approved && !milestone.fundsReleased && (
                                <button
                                    onClick={() =>
                                        handleReleaseFunds(milestone.index)
                                    }
                                    disabled={isWaitLoading}
                                    className="mt-2 bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isWaitLoading
                                        ? "Processing..."
                                        : "Release Funds"}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
