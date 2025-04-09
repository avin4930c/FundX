"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount, usePublicClient } from "wagmi";
import { FUND_ALLOCATION_ADDRESS } from "@/lib/constants";
import { fundAllocationABI } from "@/contracts/abis";
import Header from "@/components/Layout/Header";
import Sidebar from "@/components/Layout/Sidebar";
import Link from "next/link";
import { formatEther } from "viem";

interface Milestone {
    id: number;
    description: string;
    amount: bigint;
    proof: string;
    proofSubmitted: boolean;
    approved: boolean;
    fundsReleased: boolean;
    requiresProof: boolean;
    yesVotes: number;
    noVotes: number;
}

interface Fundraiser {
    id: number;
    name: string;
    description: string;
    targetAmount: bigint;
    raisedAmount: bigint;
    active: boolean;
    milestoneCount: number;
    currentMilestoneIndex: number;
    creator: string;
}

export default function ViewMilestonesPage() {
    const { fundraiserId } = useParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fundraiser, setFundraiser] = useState<Fundraiser | null>(null);
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [isCreator, setIsCreator] = useState(false);

    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();

    // Fetch fundraiser and milestones data
    useEffect(() => {
        const fetchFundraiserData = async () => {
            if (!publicClient || !fundraiserId) return;

            try {
                setIsLoading(true);
                setError(null);

                // First get fundraiser details
                const fundraiserData = (await publicClient.readContract({
                    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                    abi: fundAllocationABI,
                    functionName: "getFundraiserDetails",
                    args: [BigInt(fundraiserId as string)],
                })) as any;

                const fundraiserInfo: Fundraiser = {
                    id: Number(fundraiserId),
                    name: fundraiserData[1],
                    description: fundraiserData[2],
                    targetAmount: fundraiserData[3],
                    raisedAmount: fundraiserData[4],
                    active: fundraiserData[5],
                    milestoneCount: Number(fundraiserData[6]),
                    currentMilestoneIndex: Number(fundraiserData[7]),
                    creator: fundraiserData[0],
                };

                setFundraiser(fundraiserInfo);

                // Check if current user is fundraiser creator
                if (
                    address &&
                    fundraiserInfo.creator.toLowerCase() ===
                        address.toLowerCase()
                ) {
                    setIsCreator(true);
                }

                // Get all milestones
                const milestonesArray: Milestone[] = [];
                for (let i = 0; i < fundraiserInfo.milestoneCount; i++) {
                    try {
                        const milestoneData = (await publicClient.readContract({
                            address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                            abi: fundAllocationABI,
                            functionName: "getMilestone",
                            args: [BigInt(fundraiserId as string), BigInt(i)],
                        })) as any;

                        milestonesArray.push({
                            id: i,
                            description: milestoneData[0],
                            amount: milestoneData[1],
                            proof: milestoneData[2],
                            proofSubmitted: milestoneData[3],
                            approved: milestoneData[4],
                            fundsReleased: milestoneData[5],
                            requiresProof: milestoneData[6],
                            yesVotes: Number(milestoneData[7]),
                            noVotes: Number(milestoneData[8]),
                        });
                    } catch (error) {
                        console.error(`Error fetching milestone ${i}:`, error);
                    }
                }

                setMilestones(milestonesArray);
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching fundraiser data:", error);
                setError("Failed to load fundraiser data. Please try again.");
                setIsLoading(false);
            }
        };

        fetchFundraiserData();
    }, [publicClient, fundraiserId, address]);

    // Get milestone status text and color
    const getMilestoneStatus = (
        milestone: Milestone,
        isCurrentMilestone: boolean
    ) => {
        if (milestone.fundsReleased) {
            return {
                text: "Completed",
                color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
            };
        }

        if (milestone.approved) {
            return {
                text: "Approved (Ready for Funds Release)",
                color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
            };
        }

        if (isCurrentMilestone) {
            if (milestone.requiresProof && !milestone.proofSubmitted) {
                return {
                    text: "Awaiting Proof",
                    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
                };
            }

            return {
                text: "Pending Approval",
                color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
            };
        }

        return {
            text: "Upcoming",
            color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        };
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    pageTitle="Fund Request Details"
                    showBackButton={true}
                />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="max-w-4xl mx-auto">
                        {isLoading ? (
                            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
                                <div className="animate-pulse flex space-x-4">
                                    <div className="flex-1 space-y-6 py-1">
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                        <div className="space-y-3">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
                                <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
                                    {error}
                                </div>
                                <div className="mt-4">
                                    <Link
                                        href="/fund-requests"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                                        Return to Fund Requests
                                    </Link>
                                </div>
                            </div>
                        ) : fundraiser ? (
                            <>
                                {/* Fundraiser Overview */}
                                <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden mb-6">
                                    <div className="px-4 py-5 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                                {fundraiser.name}
                                            </h3>
                                            <span
                                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    fundraiser.active
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                                }`}>
                                                {fundraiser.active
                                                    ? "Active"
                                                    : "Completed"}
                                            </span>
                                        </div>
                                        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                                            {fundraiser.description}
                                        </p>
                                    </div>
                                    <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:px-6">
                                        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    Target Amount
                                                </dt>
                                                <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                                                    {formatEther(
                                                        fundraiser.targetAmount
                                                    )}{" "}
                                                    ETH
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    Raised Amount
                                                </dt>
                                                <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                                                    {formatEther(
                                                        fundraiser.raisedAmount
                                                    )}{" "}
                                                    ETH
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                    Progress
                                                </dt>
                                                <dd className="mt-1">
                                                    <div className="relative pt-1">
                                                        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                                                            <div
                                                                style={{
                                                                    width: `${Math.min(
                                                                        (Number(
                                                                            fundraiser.raisedAmount
                                                                        ) *
                                                                            100) /
                                                                            Number(
                                                                                fundraiser.targetAmount
                                                                            ),
                                                                        100
                                                                    )}%`,
                                                                }}
                                                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                                                        </div>
                                                    </div>
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>

                                {/* Milestones List */}
                                <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden">
                                    <div className="px-4 py-5 sm:px-6">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                            Milestones
                                        </h3>
                                        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                                            Timeline of funding milestone
                                            requests
                                        </p>
                                    </div>
                                    <div className="border-t border-gray-200 dark:border-gray-700">
                                        {milestones.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                                <p>
                                                    No milestones found for this
                                                    fundraiser.
                                                </p>
                                            </div>
                                        ) : (
                                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {milestones.map((milestone) => {
                                                    const isCurrentMilestone =
                                                        milestone.id ===
                                                        fundraiser.currentMilestoneIndex;
                                                    const status =
                                                        getMilestoneStatus(
                                                            milestone,
                                                            isCurrentMilestone
                                                        );

                                                    return (
                                                        <li
                                                            key={milestone.id}
                                                            className={`px-4 py-5 sm:px-6 ${
                                                                isCurrentMilestone
                                                                    ? "bg-blue-50 dark:bg-blue-900/10"
                                                                    : ""
                                                            }`}>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-3">
                                                                    <div
                                                                        className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                                                                            milestone.fundsReleased
                                                                                ? "bg-green-100 dark:bg-green-900/30"
                                                                                : "bg-gray-100 dark:bg-gray-700"
                                                                        }`}>
                                                                        <span className="text-sm font-medium">
                                                                            {milestone.id +
                                                                                1}
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-md font-medium text-gray-900 dark:text-white">
                                                                            Milestone
                                                                            #
                                                                            {milestone.id +
                                                                                1}
                                                                        </h4>
                                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                                            {
                                                                                milestone.description
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                        {formatEther(
                                                                            milestone.amount
                                                                        )}{" "}
                                                                        ETH
                                                                    </div>
                                                                    <span
                                                                        className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                                                        {
                                                                            status.text
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Additional milestone details */}
                                                            <div className="mt-4 text-sm">
                                                                {milestone.proofSubmitted && (
                                                                    <div className="mt-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                                                                        <h5 className="font-medium text-gray-700 dark:text-gray-300">
                                                                            Proof
                                                                            Submitted
                                                                        </h5>
                                                                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                                                                            {
                                                                                milestone.proof
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                {milestone.yesVotes >
                                                                    0 ||
                                                                milestone.noVotes >
                                                                    0 ? (
                                                                    <div className="mt-3 flex space-x-4 text-sm">
                                                                        <span className="text-green-600 dark:text-green-400">
                                                                            {
                                                                                milestone.yesVotes
                                                                            }{" "}
                                                                            Yes
                                                                            votes
                                                                        </span>
                                                                        <span className="text-red-600 dark:text-red-400">
                                                                            {
                                                                                milestone.noVotes
                                                                            }{" "}
                                                                            No
                                                                            votes
                                                                        </span>
                                                                    </div>
                                                                ) : null}

                                                                {/* Action buttons for current milestone if user is creator */}
                                                                {isCreator &&
                                                                    isCurrentMilestone && (
                                                                        <div className="mt-4">
                                                                            {!milestone.proofSubmitted &&
                                                                            milestone.requiresProof ? (
                                                                                <Link
                                                                                    href={`/submit-proof/${fundraiser.id}`}
                                                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                                                                                    Submit
                                                                                    Proof
                                                                                </Link>
                                                                            ) : milestone.approved &&
                                                                              !milestone.fundsReleased ? (
                                                                                <Link
                                                                                    href={`/release-funds/${fundraiser.id}`}
                                                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                                                                                    Release
                                                                                    Funds
                                                                                </Link>
                                                                            ) : null}
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>

                                    {/* "Add new milestone" button if user is creator */}
                                    {isCreator && fundraiser.active && (
                                        <div className="px-4 py-5 sm:px-6 border-t border-gray-200 dark:border-gray-700">
                                            <Link
                                                href={`/fund-requests/create?fundraiserId=${fundraiser.id}`}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                                                Create New Milestone
                                            </Link>
                                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                Create a new milestone to
                                                request additional funds for
                                                your project.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-md">
                                    <p>Fundraiser not found.</p>
                                </div>
                                <div className="mt-4">
                                    <Link
                                        href="/fund-requests"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                                        Return to Fund Requests
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
