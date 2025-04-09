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

export default function SubmitProofPage() {
    const { fundraiserId } = useParams();
    const router = useRouter();
    const [proof, setProof] = useState("");
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
                    setError("Only the fundraiser creator can submit proof");
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

    // Submit proof
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isConnected) {
            setError("Please connect your wallet to continue");
            return;
        }

        if (!proof.trim()) {
            setError("Please enter proof details");
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            await writeContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "submitMilestoneProof",
                args: [BigInt(fundraiserId as string), proof],
            });
        } catch (error) {
            console.error("Error submitting proof:", error);
            setError(
                `Failed to submit proof: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
            setIsSubmitting(false);
        }
    };

    // Handle success
    useEffect(() => {
        if (isSuccess) {
            setSuccess("Proof submitted successfully!");
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
                        pageTitle="Submit Proof"
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
                                        Please connect your wallet to submit
                                        proof.
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
                    pageTitle="Submit Proof"
                    showBackButton={true}
                />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                                    Submit Proof for {fundraiserName}
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
                                        {milestone.proofSubmitted ? (
                                            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-md">
                                                <p>
                                                    Proof has already been
                                                    submitted for this
                                                    milestone.
                                                </p>
                                                <p className="mt-2">
                                                    <strong>
                                                        Submitted Proof:
                                                    </strong>{" "}
                                                    {milestone.proof}
                                                </p>
                                                <div className="mt-3">
                                                    <Link
                                                        href="/fund-requests"
                                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                                                        Return to Fund Requests
                                                    </Link>
                                                </div>
                                            </div>
                                        ) : !milestone.requiresProof ? (
                                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md">
                                                <p>
                                                    This milestone does not
                                                    require proof submission.
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
                                            <form
                                                onSubmit={handleSubmit}
                                                className="mt-5">
                                                <div>
                                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-4">
                                                        <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                                            Milestone #
                                                            {milestone.index +
                                                                1}
                                                        </h4>
                                                        <p className="text-blue-600 dark:text-blue-400 mt-1">
                                                            {
                                                                milestone.description
                                                            }
                                                        </p>
                                                    </div>

                                                    <label
                                                        htmlFor="proof"
                                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Proof Details
                                                    </label>
                                                    <div className="mt-1">
                                                        <textarea
                                                            id="proof"
                                                            name="proof"
                                                            rows={6}
                                                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                                            placeholder="Provide detailed evidence or proof of milestone completion. This might include links to deliverables, images, descriptions of work completed, or any other relevant information."
                                                            value={proof}
                                                            onChange={(e) =>
                                                                setProof(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            required
                                                        />
                                                    </div>
                                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                                        Proof should be detailed
                                                        and verifiable by
                                                        validators. Provide
                                                        links or detailed
                                                        explanations.
                                                    </p>
                                                </div>

                                                <div className="mt-5">
                                                    <button
                                                        type="submit"
                                                        disabled={
                                                            isSubmitting ||
                                                            isTxPending
                                                        }
                                                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
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
                                                                Submitting...
                                                            </>
                                                        ) : (
                                                            "Submit Proof"
                                                        )}
                                                    </button>
                                                </div>
                                            </form>
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
