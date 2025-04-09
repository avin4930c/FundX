"use client";

import { useState, useEffect } from "react";
import { formatEther } from "viem";
import {
    useAccount,
    useContractRead,
    useContractReads,
    usePublicClient,
    useWriteContract,
    useWaitForTransactionReceipt,
} from "wagmi";
import { FUND_ALLOCATION_ADDRESS } from "@/lib/constants";
import { fundAllocationABI } from "@/contracts/abis";
import { VALIDATOR_ADDRESSES, isValidatorAddress } from "@/lib/validators";

// Milestone type
type Milestone = {
    fundraiserId: number;
    fundraiserName: string;
    index: number;
    description: string;
    amount: string;
    proof: string;
    proofSubmitted: boolean;
    approved: boolean;
    fundsReleased: boolean;
    requiresProof: boolean;
    yesVotes: number;
    noVotes: number;
    isOwner: boolean;
    creatorAddress: string;
    isFirstMilestone: boolean;
};

interface PendingMilestonesListProps {
    filterOwnOnly?: boolean;
    filterValidatorOnly?: boolean;
}

const PendingMilestonesList = ({
    filterOwnOnly = false,
    filterValidatorOnly = false,
}: PendingMilestonesListProps) => {
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isTxLoading, setIsTxLoading] = useState(false);
    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();

    // Get fundraiser count
    const { data: fundraiserCount } = useContractRead({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: "getFundraiserCount",
    });

    // Contract write functions
    const { writeContract, data: txHash } = useWriteContract();

    // Wait for transaction receipt
    const { isLoading: isWaitLoading, isSuccess } =
        useWaitForTransactionReceipt({
            hash: txHash,
        });

    const [isValidator, setIsValidator] = useState(false);

    // Check if user is validator - for demo purposes, we're using a hardcoded check
    useEffect(() => {
        const checkIsValidator = async () => {
            if (!address) return;

            console.log("Validator addresses:", VALIDATOR_ADDRESSES);
            console.log("Current address:", address);

            // Use the helper function
            const isUserValidator = isValidatorAddress(address);

            console.log(
                `Checking if ${address} is validator: ${isUserValidator}`
            );
            setIsValidator(isUserValidator);
        };

        checkIsValidator();
    }, [address]);

    // Force refresh when validator status changes
    useEffect(() => {
        console.log("Validator status changed:", isValidator);
        // Force refresh the milestone list when validator status changes
        if (isValidator !== undefined) {
            setRefreshTrigger((prev) => prev + 1);
        }
    }, [isValidator]);

    // Debug: Add a separate counter to track when we've attempted to load milestones
    const [loadAttempts, setLoadAttempts] = useState(0);

    // Load pending milestones with enhanced debugging
    useEffect(() => {
        const loadMilestones = async () => {
            console.log(`▶️ ATTEMPT #${loadAttempts + 1} TO LOAD MILESTONES`);
            setIsLoading(true);
            setMilestones([]);
            setError(null);
            setLoadAttempts((prev) => prev + 1);

            try {
                if (!publicClient) {
                    console.error("❌ Public client not available");
                    return;
                }

                if (!address) {
                    console.error("❌ No connected address");
                    return;
                }

                console.log(
                    "🔍 ================ LOADING MILESTONES ================"
                );
                console.log(`👤 Connected account: ${address}`);
                console.log(
                    `🛡️ Is validator: ${isValidator ? "YES ✓" : "NO ✗"}`
                );
                console.log(`📝 Validator addresses:`, VALIDATOR_ADDRESSES);

                // First get the fundraiser count
                const count = await publicClient.readContract({
                    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                    abi: fundAllocationABI,
                    functionName: "getFundraiserCount",
                });

                const totalCount = Number(count);
                console.log(`📊 Total fundraiser count: ${totalCount}`);

                if (totalCount === 0) {
                    console.log("❗ No fundraisers found");
                    setIsLoading(false);
                    return;
                }

                const pendingMilestones = [];

                // Loop through all fundraisers
                for (let i = 0; i < totalCount; i++) {
                    console.log(
                        `🔄 Processing fundraiser ${i}/${totalCount - 1}`
                    );

                    try {
                        // Get fundraiser details
                        const fundraiser = (await publicClient.readContract({
                            address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                            abi: fundAllocationABI,
                            functionName: "fundraisers",
                            args: [i],
                        })) as any[];

                        console.log(`📝 Fundraiser ${i} raw data:`, fundraiser);

                        // Check if this is owned by the current user or if user is a validator
                        const creatorAddress = fundraiser[1]; // [1] is the creator address
                        const isOwner =
                            address?.toLowerCase() ===
                            creatorAddress?.toLowerCase();

                        // Check if user is a validator for this fundraiser
                        const isValidatorForFundraiser =
                            await publicClient.readContract({
                                address:
                                    FUND_ALLOCATION_ADDRESS as `0x${string}`,
                                abi: fundAllocationABI,
                                functionName: "isValidator",
                                args: [i, address],
                            });

                        console.log(
                            `👤 Fundraiser ${i} creator: ${creatorAddress}`
                        );
                        console.log(`👤 Current user address: ${address}`);
                        console.log(
                            `🔐 User is owner: ${isOwner ? "YES ✓" : "NO ✗"}`
                        );
                        console.log(
                            `🛡️ User is validator for this fundraiser: ${
                                isValidatorForFundraiser ? "YES ✓" : "NO ✗"
                            }`
                        );

                        // If we're filtering and user is not relevant to this fundraiser, skip
                        if (
                            (filterOwnOnly && !isOwner) ||
                            (filterValidatorOnly && !isValidatorForFundraiser)
                        ) {
                            console.log(
                                `Skipping fundraiser ${i} due to filter settings`
                            );
                            continue;
                        }

                        const name = fundraiser[2] || `Fundraiser #${i}`; // [2] is the name/title
                        const milestoneCount = Number(fundraiser[8]) || 0; // [8] is the milestone count

                        console.log(
                            `📌 Fundraiser #${i} (${name}): Has ${milestoneCount} milestones`
                        );

                        if (milestoneCount === 0) {
                            console.log(
                                `ℹ️ Fundraiser ${i} has no milestones, skipping`
                            );
                            continue;
                        }

                        // Loop through each milestone for this fundraiser
                        for (let j = 0; j < milestoneCount; j++) {
                            console.log(`🔄 Processing milestone ${i}-${j}`);

                            try {
                                const milestone =
                                    (await publicClient.readContract({
                                        address:
                                            FUND_ALLOCATION_ADDRESS as `0x${string}`,
                                        abi: fundAllocationABI,
                                        functionName: "getMilestone",
                                        args: [i, j],
                                    })) as any[];

                                console.log(
                                    `📝 Milestone ${i}-${j} raw data:`,
                                    milestone
                                );

                                // Check if the milestone is not released yet
                                // Get all the milestone properties
                                const description =
                                    milestone[0] || "No description";
                                const amount = milestone[1] || BigInt(0);
                                const proof = milestone[2] || "";
                                const proofSubmitted = milestone[3] || false;
                                const approved = milestone[4] || false;
                                const fundsReleased = milestone[5] || false;
                                const requiresProof = milestone[6] || false;
                                const yesVotes = Number(milestone[7] || 0);
                                const noVotes = Number(milestone[8] || 0);
                                const isFirstMilestone = j === 0;

                                console.log(`📊 Milestone details:`);
                                console.log(`- Description: ${description}`);
                                console.log(
                                    `- Amount: ${formatEther(amount)} ETH`
                                );
                                console.log(`- Proof text: ${proof}`);
                                console.log(
                                    `- Proof submitted: ${
                                        proofSubmitted ? "YES ✓" : "NO ✗"
                                    }`
                                );
                                console.log(
                                    `- Requires proof: ${
                                        requiresProof ? "YES ✓" : "NO ✗"
                                    }`
                                );
                                console.log(
                                    `- Is approved: ${
                                        approved ? "YES ✓" : "NO ✗"
                                    }`
                                );
                                console.log(
                                    `- Funds released: ${
                                        fundsReleased ? "YES ✓" : "NO ✗"
                                    }`
                                );
                                console.log(`- Yes votes: ${yesVotes}`);
                                console.log(`- No votes: ${noVotes}`);
                                console.log(
                                    `- Is first milestone: ${
                                        isFirstMilestone ? "YES ✓" : "NO ✗"
                                    }`
                                );

                                // Check if user has already voted on this milestone
                                const hasVoted =
                                    await publicClient.readContract({
                                        address:
                                            FUND_ALLOCATION_ADDRESS as `0x${string}`,
                                        abi: fundAllocationABI,
                                        functionName: "hasVoted",
                                        args: [i, j, address],
                                    });

                                console.log(
                                    `User has voted on this milestone: ${
                                        hasVoted ? "YES ✓" : "NO ✗"
                                    }`
                                );

                                // Now decide whether to include this milestone
                                // For creators, include all their incomplete milestones
                                // For validators, include all unapproved milestones
                                // Skip milestones with funds already released
                                if (
                                    !fundsReleased &&
                                    ((isOwner && filterOwnOnly) ||
                                        (isValidatorForFundraiser &&
                                            filterValidatorOnly) ||
                                        (!filterOwnOnly &&
                                            !filterValidatorOnly))
                                ) {
                                    console.log(
                                        `Adding milestone ${i}-${j} to the list`
                                    );
                                    pendingMilestones.push({
                                        fundraiserId: i,
                                        fundraiserName: name,
                                        index: j,
                                        description,
                                        amount: formatEther(amount),
                                        proof,
                                        proofSubmitted,
                                        approved,
                                        fundsReleased,
                                        requiresProof,
                                        yesVotes,
                                        noVotes,
                                        isOwner,
                                        creatorAddress,
                                        isFirstMilestone,
                                    });
                                } else {
                                    console.log(
                                        `Skipping milestone ${i}-${j} (funds released: ${fundsReleased}, isOwner: ${isOwner}, filterOwnOnly: ${filterOwnOnly}, isValidatorForFundraiser: ${isValidatorForFundraiser}, filterValidatorOnly: ${filterValidatorOnly})`
                                    );
                                }
                            } catch (error) {
                                console.error(
                                    `❌ Error processing milestone ${i}-${j}:`,
                                    error
                                );
                            }
                        }
                    } catch (error) {
                        console.error(
                            `❌ Error processing fundraiser ${i}:`,
                            error
                        );
                    }
                }

                console.log(
                    `✅ Total pending milestones found: ${pendingMilestones.length}`
                );
                setMilestones(pendingMilestones);
                setIsLoading(false);
            } catch (error) {
                console.error("❌ Failed to load milestones:", error);
                setError("Failed to load milestones. Please try again.");
                setIsLoading(false);
            }
        };

        if (address && publicClient) {
            loadMilestones();
        } else {
            setIsLoading(false);
        }
    }, [
        refreshTrigger,
        address,
        publicClient,
        isValidator,
        filterOwnOnly,
        filterValidatorOnly,
    ]);

    // Handle voting on milestones
    const handleVote = async (
        fundraiserId: number,
        milestoneIndex: number,
        approve: boolean
    ) => {
        try {
            setIsTxLoading(true);
            console.log(
                `Voting ${
                    approve ? "YES" : "NO"
                } on milestone ${fundraiserId}-${milestoneIndex}`
            );

            // Call the validateMilestone function - this just needs fundraiserId and approve status
            // The contract uses the current milestone index internally
            await writeContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "validateMilestone",
                args: [BigInt(fundraiserId), approve],
            });
        } catch (error) {
            console.error("Error voting on milestone:", error);
            setError(
                `Failed to vote: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
            setIsTxLoading(false);
        }
    };

    // Handle submitting proof for a milestone
    const handleSubmitProof = async (fundraiserId: number, index: number) => {
        try {
            const proofInput = prompt("Enter proof of milestone completion:");
            if (!proofInput) return;

            setIsTxLoading(true);
            console.log(
                `Submitting proof for milestone ${fundraiserId}-${index}: "${proofInput}"`
            );

            // Call the submitMilestoneProof function - note contract only needs fundraiser ID and proof text
            // The contract uses the current milestone index internally
            await writeContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "submitMilestoneProof",
                args: [BigInt(fundraiserId), proofInput],
            });
        } catch (error) {
            console.error("Error submitting proof:", error);
            setError(
                `Failed to submit proof: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
            setIsTxLoading(false);
        }
    };

    // Handle releasing funds for a milestone
    const handleReleaseFunds = async (fundraiserId: number, index: number) => {
        try {
            setIsTxLoading(true);
            console.log(
                `Releasing funds for milestone ${fundraiserId}-${index}`
            );

            // Call the releaseMilestoneFunds function - note contract only needs fundraiser ID
            // The contract uses the current milestone index internally
            await writeContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "releaseMilestoneFunds",
                args: [BigInt(fundraiserId)],
            });
        } catch (error) {
            console.error("Error releasing funds:", error);
            setError(
                `Failed to release funds: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
            setIsTxLoading(false);
        }
    };

    // Handle transaction success - refresh when transaction completes
    useEffect(() => {
        if (isSuccess) {
            console.log("Transaction successful, refreshing milestones...");
            setRefreshTrigger((prev) => prev + 1);
        }
    }, [isSuccess]);

    // Manual refresh function
    const handleRefresh = () => {
        console.log("Manual refresh triggered");
        setRefreshTrigger((prev) => prev + 1);
        setIsLoading(true);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10 text-red-500 dark:text-red-400">
                <p>{error}</p>
                <div className="mt-4">
                    <button
                        onClick={handleRefresh}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        Retry Loading
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Loading state */}
            {isLoading && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && !isLoading && (
                <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-md text-red-700 dark:text-red-300">
                    {error}
                </div>
            )}

            {/* No milestones message */}
            {!isLoading && !error && milestones.length === 0 && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        No pending fund requests found
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {filterOwnOnly
                            ? "You don't have any pending fund requests. Create a request to get started."
                            : filterValidatorOnly
                            ? "There are no pending fund requests that need validation."
                            : "There are no pending fund requests at this time."}
                    </p>
                </div>
            )}

            {/* List of milestones */}
            {!isLoading &&
                !error &&
                milestones.length > 0 &&
                milestones.map((milestone) => (
                    <div
                        key={`${milestone.fundraiserId}-${milestone.index}`}
                        className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                        {/* Milestone header */}
                        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                                    {milestone.fundraiserName}: Milestone{" "}
                                    {milestone.index + 1}
                                </h3>
                                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                                    {milestone.description}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {milestone.amount} ETH
                                </p>
                                <p
                                    className={`text-sm ${
                                        milestone.approved
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-yellow-600 dark:text-yellow-400"
                                    }`}>
                                    {milestone.approved
                                        ? "Approved"
                                        : "Awaiting Approval"}
                                </p>
                            </div>
                        </div>

                        {/* Milestone details */}
                        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:px-6">
                            {/* For first milestone or non-proof milestones, proofSubmitted doesn't matter */}
                            {!milestone.requiresProof ||
                            milestone.isFirstMilestone ? (
                                <div className="text-sm bg-green-50 dark:bg-green-900/30 p-3 rounded mb-4">
                                    {milestone.isFirstMilestone ? (
                                        <p className="text-green-700 dark:text-green-300">
                                            This is the initial funding
                                            milestone. No proof is required.
                                        </p>
                                    ) : (
                                        <p className="text-green-700 dark:text-green-300">
                                            This milestone doesn't require proof
                                            of completion.
                                        </p>
                                    )}
                                </div>
                            ) : milestone.proofSubmitted ? (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Proof of Completion
                                    </h4>
                                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-gray-700 dark:text-gray-300 text-sm">
                                        {milestone.proof}
                                    </div>
                                </div>
                            ) : milestone.isOwner ? (
                                <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded mb-4">
                                    <p className="text-yellow-700 dark:text-yellow-300">
                                        You need to submit proof of milestone
                                        completion before validators can approve
                                        the fund release.
                                    </p>
                                    <button
                                        onClick={() =>
                                            handleSubmitProof(
                                                milestone.fundraiserId,
                                                milestone.index
                                            )
                                        }
                                        className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500">
                                        Submit Proof
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded mb-4">
                                    <p className="text-yellow-700 dark:text-yellow-300">
                                        Waiting for the creator to submit proof
                                        of milestone completion.
                                    </p>
                                </div>
                            )}

                            {/* Show voting results if it makes sense to do so */}
                            {milestone.requiresProof &&
                                !milestone.isFirstMilestone &&
                                milestone.proofSubmitted && (
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Validator Votes
                                        </h4>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-green-100 text-green-800 rounded-full dark:bg-green-900 dark:text-green-300">
                                                    {milestone.yesVotes}
                                                </span>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    Approved
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-red-100 text-red-800 rounded-full dark:bg-red-900 dark:text-red-300">
                                                    {milestone.noVotes}
                                                </span>
                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                    Rejected
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            {/* Admin action buttons */}
                            <div className="mt-6 flex flex-wrap gap-3">
                                {/* If the user is the owner and milestone is approved, show release funds button */}
                                {milestone.isOwner &&
                                    milestone.approved &&
                                    !milestone.fundsReleased && (
                                        <button
                                            onClick={() =>
                                                handleReleaseFunds(
                                                    milestone.fundraiserId,
                                                    milestone.index
                                                )
                                            }
                                            disabled={
                                                isTxLoading || isWaitLoading
                                            }
                                            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                                                isTxLoading || isWaitLoading
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : ""
                                            }`}>
                                            {isTxLoading || isWaitLoading ? (
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
                                                    Processing...
                                                </>
                                            ) : (
                                                "Release Funds"
                                            )}
                                        </button>
                                    )}

                                {/* Only allow validator voting when: 
                                    1. They are a validator for this fundraiser
                                    2. The milestone is not approved or released yet 
                                    3. For milestones that require proof, the proof has been submitted 
                                */}
                                {isValidator &&
                                    !milestone.isOwner &&
                                    !milestone.approved &&
                                    !milestone.fundsReleased &&
                                    (milestone.proofSubmitted ||
                                        !milestone.requiresProof ||
                                        milestone.isFirstMilestone) && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() =>
                                                    handleVote(
                                                        milestone.fundraiserId,
                                                        milestone.index,
                                                        true
                                                    )
                                                }
                                                disabled={
                                                    isTxLoading || isWaitLoading
                                                }
                                                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                                                    isTxLoading || isWaitLoading
                                                        ? "opacity-50 cursor-not-allowed"
                                                        : ""
                                                }`}>
                                                {isTxLoading ||
                                                isWaitLoading ? (
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
                                                        Processing...
                                                    </>
                                                ) : (
                                                    "Approve"
                                                )}
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleVote(
                                                        milestone.fundraiserId,
                                                        milestone.index,
                                                        false
                                                    )
                                                }
                                                disabled={
                                                    isTxLoading || isWaitLoading
                                                }
                                                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                                                    isTxLoading || isWaitLoading
                                                        ? "opacity-50 cursor-not-allowed"
                                                        : ""
                                                }`}>
                                                {isTxLoading ||
                                                isWaitLoading ? (
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
                                                        Processing...
                                                    </>
                                                ) : (
                                                    "Reject"
                                                )}
                                            </button>
                                        </div>
                                    )}

                                {/* Refresh button */}
                                <button
                                    onClick={handleRefresh}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                    <svg
                                        className="w-4 h-4 mr-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                    </svg>
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
        </div>
    );
};

export default PendingMilestonesList;
