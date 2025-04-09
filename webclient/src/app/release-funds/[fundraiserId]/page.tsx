"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    useAccount,
    usePublicClient,
    useWriteContract,
    useWaitForTransactionReceipt,
} from "wagmi";
import { FUND_ALLOCATION_ADDRESS } from "@/lib/constants";
import { fundAllocationABI } from "@/contracts/abis";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import Link from "next/link";
import { formatEther } from "viem";

export default function ReleaseFundsPage() {
    const { fundraiserId } = useParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [milestone, setMilestone] = useState<any>(null);
    const [fundraiserName, setFundraiserName] = useState<string>("");

    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();
    const { writeContract, data: txHash } = useWriteContract();
    const { isLoading: isTxPending, isSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    // Fetch milestone data
    useEffect(() => {
        const fetchMilestoneData = async () => {
            if (!publicClient || !isConnected || !fundraiserId) return;

            try {
                setIsLoading(true);
                setError(null);

                // First get fundraiser details to check if user is creator
                const fundraiser = (await publicClient.readContract({
                    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                    abi: fundAllocationABI,
                    functionName: "getFundraiserDetails",
                    args: [BigInt(fundraiserId as string)],
                })) as any;

                if (fundraiser[0].toLowerCase() !== address?.toLowerCase()) {
                    setError("Only the fundraiser creator can release funds");
                    setIsLoading(false);
                    return;
                }

                setFundraiserName(
                    fundraiser[1] || `Fundraiser #${fundraiserId}`
                );

                // Get current milestone index
                const currentMilestoneIndex = fundraiser[7]; // index 7 is currentMilestoneIndex

                // Get milestone details
                const milestoneData = (await publicClient.readContract({
                    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                    abi: fundAllocationABI,
                    functionName: "getMilestone",
                    args: [
                        BigInt(fundraiserId as string),
                        currentMilestoneIndex,
                    ],
                })) as any;

                setMilestone({
                    description: milestoneData[0],
                    amount: milestoneData[1],
                    proof: milestoneData[2],
                    proofSubmitted: milestoneData[3],
                    approved: milestoneData[4],
                    fundsReleased: milestoneData[5],
                    requiresProof: milestoneData[6],
                    index: Number(currentMilestoneIndex),
                });

                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching milestone:", error);
                setError("Failed to load milestone data. Please try again.");
                setIsLoading(false);
            }
        };

        fetchMilestoneData();
    }, [publicClient, isConnected, fundraiserId, address]);

    // Release funds
    const handleReleaseFunds = async () => {
        if (!isConnected) {
            setError("Please connect your wallet to continue");
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            await writeContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "releaseMilestoneFunds",
                args: [BigInt(fundraiserId as string)],
            });
        } catch (error) {
            console.error("Error releasing funds:", error);
            setError(
                `Failed to release funds: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
            setIsSubmitting(false);
        }
    };

    // Handle success
    useEffect(() => {
        if (isSuccess) {
            setSuccess("Funds released successfully!");
            setIsSubmitting(false);

            // Redirect to fund requests page after 2 seconds
            setTimeout(() => {
                router.push("/fund-requests");
            }, 2000);
        }
    }, [isSuccess, router]);

    if (!isConnected) {
        return (
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header
                        pageTitle="Release Funds"
                        showBackButton={true}
                    />
                    <main className="flex-1 overflow-y-auto p-4 md:p-6">
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
                                <div className="text-center">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Connect Your Wallet
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        Please connect your wallet to release
                                        funds.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    pageTitle="Release Funds"
                    showBackButton={true}
                />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                                    Release Funds for {fundraiserName}
                                </h3>

                                {isLoading ? (
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
                                ) : error ? (
                                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
                                        {error}
                                    </div>
                                ) : success ? (
                                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md">
                                        {success}
                                    </div>
                                ) : milestone ? (
                                    <>
                                        {milestone.fundsReleased ? (
                                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md">
                                                <p>
                                                    Funds have already been
                                                    released for this milestone.
                                                </p>
                                                <div className="mt-3">
                                                    <Link
                                                        href="/fund-requests"
                                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                                                        Return to Fund Requests
                                                    </Link>
                                                </div>
                                            </div>
                                        ) : !milestone.approved ? (
                                            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-md">
                                                <p>
                                                    This milestone has not been
                                                    approved yet. Funds can only
                                                    be released after milestone
                                                    approval.
                                                </p>
                                                <div className="mt-3">
                                                    <Link
                                                        href="/fund-requests"
                                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                                                        Return to Fund Requests
                                                    </Link>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-5">
                                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-6">
                                                    <h4 className="text-md font-medium text-blue-700 dark:text-blue-300">
                                                        Milestone #
                                                        {milestone.index + 1}
                                                    </h4>
                                                    <p className="text-blue-600 dark:text-blue-400 mt-1">
                                                        {milestone.description}
                                                    </p>
                                                    <div className="mt-2 flex justify-between items-center">
                                                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                                            Amount:
                                                        </span>
                                                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                                            {formatEther(
                                                                milestone.amount
                                                            )}{" "}
                                                            ETH
                                                        </span>
                                                    </div>
                                                    {milestone.requiresProof &&
                                                        milestone.proofSubmitted && (
                                                            <div className="mt-2">
                                                                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                                                    Proof
                                                                    submitted:
                                                                </div>
                                                                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                                                    {
                                                                        milestone.proof
                                                                    }
                                                                </p>
                                                            </div>
                                                        )}
                                                </div>

                                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md mb-6">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-md font-medium text-green-700 dark:text-green-300">
                                                            Milestone Approved
                                                        </h4>
                                                        <svg
                                                            className="h-6 w-6 text-green-600"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M5 13l4 4L19 7"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                                        This milestone has been
                                                        approved by validators.
                                                        You can now release the
                                                        funds.
                                                    </p>
                                                </div>

                                                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-md mb-6">
                                                    <h4 className="text-md font-medium text-orange-700 dark:text-orange-300">
                                                        Important Information
                                                    </h4>
                                                    <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                                                        By releasing funds, the
                                                        amount of{" "}
                                                        {formatEther(
                                                            milestone.amount
                                                        )}{" "}
                                                        ETH will be transferred
                                                        to your wallet. This
                                                        action cannot be undone.
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={handleReleaseFunds}
                                                    disabled={
                                                        isSubmitting ||
                                                        isTxPending
                                                    }
                                                    className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                                                        isSubmitting ||
                                                        isTxPending
                                                            ? "opacity-50 cursor-not-allowed"
                                                            : ""
                                                    }`}>
                                                    {isSubmitting ||
                                                    isTxPending ? (
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
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-md">
                                        <p>
                                            No active milestone found for this
                                            fundraiser.
                                        </p>
                                        <div className="mt-3">
                                            <Link
                                                href="/fund-requests"
                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                                                Return to Fund Requests
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
