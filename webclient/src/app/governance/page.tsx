"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Link from "next/link";
import ProposalsList from "@/components/Governance/ProposalsList";
import Header from "@/components/Layout/Header";

export default function GovernancePage() {
    const { isConnected } = useAccount();
    const [activeTab, setActiveTab] = useState<"active" | "past">("active");

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header pageTitle="Governance" />

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {!isConnected ? (
                        <div className="text-center py-12">
                            <div className="inline-block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Connect your wallet to participate
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    You need to connect your wallet to view and
                                    vote on governance proposals.
                                </p>
                                <ConnectButton />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8">
                                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                                    As a DAO member, you can vote on fund
                                    allocation proposals to ensure proper use of
                                    funds.
                                </p>
                                <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
                                    <div className="border-b border-gray-200 dark:border-gray-700">
                                        <nav className="flex -mb-px">
                                            <button
                                                onClick={() =>
                                                    setActiveTab("active")
                                                }
                                                className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                                                    activeTab === "active"
                                                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                                                }`}>
                                                Active Proposals
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setActiveTab("past")
                                                }
                                                className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                                                    activeTab === "past"
                                                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                                                }`}>
                                                Past Proposals
                                            </button>
                                        </nav>
                                    </div>
                                    <div className="px-4 py-5 sm:p-6">
                                        <ProposalsList type={activeTab} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg mt-8">
                                <div className="px-4 py-5 sm:p-6">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                        About DAO Governance
                                    </h2>
                                    <div className="prose dark:prose-dark max-w-none">
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Our governance system ensures
                                            transparency and fairness in fund
                                            allocations.
                                        </p>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-2">
                                            How it works:
                                        </h3>
                                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
                                            <li>
                                                Fundraisers submit withdrawal
                                                requests for their projects
                                            </li>
                                            <li>
                                                DAO members vote on these
                                                requests (For/Against)
                                            </li>
                                            <li>
                                                Proposals need ≥70% approval to
                                                pass
                                            </li>
                                            <li>
                                                Approved proposals move to
                                                multi-signature execution
                                            </li>
                                        </ul>

                                        <div className="mt-4">
                                            <Link
                                                href="/multi-sig"
                                                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center">
                                                Go to Multi-Signature Wallet
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="ml-1 h-4 w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 5l7 7-7 7"
                                                    />
                                                </svg>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
