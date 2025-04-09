"use client";

import { useState } from "react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useFundRequests } from "@/contexts/FundRequestContext";
import Link from "next/link";

export default function FundRequestList() {
    const {
        fundraisers,
        milestones,
        pendingApprovals,
        isLoading,
        error,
        refreshData,
    } = useFundRequests();
    const { address, isConnected } = useAccount();
    const [currentTab, setCurrentTab] = useState<
        "my-requests" | "pending-approvals"
    >("my-requests");

    // Filter milestones by fundraiser for easier display
    const milestonesByFundraiser = milestones.reduce((acc, milestone) => {
        if (!acc[milestone.fundraiserId]) {
            acc[milestone.fundraiserId] = [];
        }
        acc[milestone.fundraiserId].push(milestone);
        return acc;
    }, {} as Record<number, typeof milestones>);

    // Handle refresh button click
    const handleRefresh = () => {
        refreshData();
    };

    // If not connected, show a message
    if (!isConnected) {
        return (
            <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-6">
                <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Connect Your Wallet
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Please connect your wallet to view fund requests.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                        Fund Requests
                    </h3>
                    <button
                        onClick={handleRefresh}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                        Refresh
                    </button>
                </div>

                {/* Loading state */}
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

                {/* Error state */}
                {error && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md">
                        {error}
                    </div>
                )}

                {/* Tab navigation */}
                <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setCurrentTab("my-requests")}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                                currentTab === "my-requests"
                                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}>
                            My Fund Requests
                        </button>
                        <button
                            onClick={() => setCurrentTab("pending-approvals")}
                            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                                currentTab === "pending-approvals"
                                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}>
                            Pending Approvals{" "}
                            {pendingApprovals.length > 0 && (
                                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                                    {pendingApprovals.length}
                                </span>
                            )}
                        </button>
                    </nav>
                </div>

                {/* No data message */}
                {!isLoading &&
                    fundraisers.length === 0 &&
                    currentTab === "my-requests" && (
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-md">
                            <p>
                                You don't have any fundraisers yet. Create a
                                fundraiser first to request funds.
                            </p>
                            <Link
                                href="/create"
                                className="mt-3 inline-block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                Create a Fundraiser
                            </Link>
                        </div>
                    )}

                {!isLoading &&
                    pendingApprovals.length === 0 &&
                    currentTab === "pending-approvals" && (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md">
                            <p>
                                There are no fund requests awaiting your
                                approval at this time.
                            </p>
                        </div>
                    )}

                {/* My fund requests tab content */}
                {currentTab === "my-requests" && (
                    <div className="mt-6 space-y-6">
                        {fundraisers.map((fundraiser) => {
                            const fundraiserMilestones =
                                milestonesByFundraiser[fundraiser.id] || [];

                            if (fundraiserMilestones.length === 0) return null;

                            return (
                                <div
                                    key={fundraiser.id}
                                    className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                        {fundraiser.name}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {fundraiser.description.substring(
                                            0,
                                            100
                                        )}
                                        {fundraiser.description.length > 100
                                            ? "..."
                                            : ""}
                                    </p>

                                    <div className="mt-4 space-y-4">
                                        {fundraiserMilestones.map(
                                            (milestone) => (
                                                <div
                                                    key={`${fundraiser.id}-${milestone.id}`}
                                                    className={`border ${
                                                        milestone.approved
                                                            ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20"
                                                            : "border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800"
                                                    } p-4 rounded-md`}>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h5 className="font-medium text-gray-900 dark:text-white">
                                                                Milestone #
                                                                {milestone.id +
                                                                    1}
                                                            </h5>
                                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                                {
                                                                    milestone.description
                                                                }
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                {formatEther(
                                                                    milestone.amount
                                                                )}{" "}
                                                                ETH
                                                            </p>
                                                            <span
                                                                className={`inline-flex mt-1 items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                    milestone.approved
                                                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                                                }`}>
                                                                {milestone.approved
                                                                    ? "Approved"
                                                                    : "Pending"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {milestone.fundsReleased ? (
                                                        <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-sm text-blue-700 dark:text-blue-300">
                                                            Funds have been
                                                            released for this
                                                            milestone.
                                                        </div>
                                                    ) : milestone.approved ? (
                                                        <div className="mt-3">
                                                            <Link
                                                                href={`/release-funds/${fundraiser.id}`}
                                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                                                                Release Funds
                                                            </Link>
                                                        </div>
                                                    ) : milestone.requiresProof &&
                                                      !milestone.proofSubmitted ? (
                                                        <div className="mt-3">
                                                            <Link
                                                                href={`/submit-proof/${fundraiser.id}`}
                                                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                                                                Submit Proof
                                                            </Link>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-sm text-yellow-700 dark:text-yellow-300">
                                                            Waiting for
                                                            validator
                                                            approval...
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>

                                    <div className="mt-4">
                                        <Link
                                            href={`/fund-requests/${fundraiser.id}`}
                                            className="inline-flex items-center text-blue-600 hover:text-blue-500">
                                            View all milestones
                                            <svg
                                                className="ml-1 h-5 w-5"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                                aria-hidden="true">
                                                <path
                                                    fillRule="evenodd"
                                                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pending approvals tab content */}
                {currentTab === "pending-approvals" && (
                    <div className="mt-6">
                        {!isLoading && pendingApprovals.length > 0 && (
                            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md">
                                <p className="text-sm">
                                    As a validator, you can review and approve
                                    fund withdrawal requests. Each approval
                                    contributes to the consensus needed for
                                    releasing funds to projects.
                                </p>
                            </div>
                        )}

                        <div className="space-y-4">
                            {pendingApprovals.map((milestone) => {
                                const fundraiser = fundraisers.find(
                                    (f) => f.id === milestone.fundraiserId
                                );

                                if (!fundraiser) return null;

                                return (
                                    <div
                                        key={`${milestone.fundraiserId}-${milestone.id}`}
                                        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-4 rounded-lg shadow-sm hover:shadow transition-shadow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                                    {fundraiser.name} -
                                                    Milestone #
                                                    {milestone.id + 1}
                                                </h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    {milestone.description}
                                                </p>
                                                {milestone.requiresProof && (
                                                    <div className="mt-2">
                                                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            Proof:
                                                        </h5>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                            {milestone.proof ||
                                                                "No proof submitted yet"}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="bg-yellow-100 dark:bg-yellow-900/40 px-3 py-1 rounded-md">
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {formatEther(
                                                            milestone.amount
                                                        )}{" "}
                                                        ETH
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        Votes:{" "}
                                                        {milestone.yesVotes} Yes
                                                        / {milestone.noVotes} No
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex justify-between items-center">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Created by:{" "}
                                                {fundraiser.creator.substring(
                                                    0,
                                                    6
                                                )}
                                                ...
                                                {fundraiser.creator.substring(
                                                    fundraiser.creator.length -
                                                        4
                                                )}
                                            </p>
                                            <Link
                                                href={`/validate/${fundraiser.id}/${milestone.id}`}
                                                className="inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                                                Review & Validate
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {pendingApprovals.length > 0 && (
                            <div className="mt-6 text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                    View all your pending validations in one
                                    place
                                </p>
                                <Link
                                    href="/validate-dashboard"
                                    className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                                    Go to Validator Dashboard
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
