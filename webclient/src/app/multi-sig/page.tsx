"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Link from "next/link";
import WithdrawalRequestList from "@/components/MultiSig/WithdrawalRequestList";
import SignatureOwnersList from "@/components/MultiSig/SignatureOwnersList";
import Header from "@/components/Layout/Header";

export default function MultiSigPage() {
    const { isConnected, address } = useAccount();
    const [activeTab, setActiveTab] = useState<"pending" | "completed">(
        "pending"
    );

    // In a real app, this would be fetched from the contract
    const [isOwner, setIsOwner] = useState(true);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header pageTitle="Withdrawal Approval System" />

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {!isConnected ? (
                        <div className="text-center py-12">
                            <div className="inline-block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Connect your wallet to access the Approval
                                    interface
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    You need to connect your wallet to view and
                                    approve withdrawal requests.
                                </p>
                                <ConnectButton />
                            </div>
                        </div>
                    ) : !isOwner ? (
                        <div className="text-center py-12">
                            <div className="inline-block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Access Restricted
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    Only authorized signers can access this
                                    interface.
                                </p>
                                <Link
                                    href="/"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                    Return to Home
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8">
                                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                                    As an authorized signer, you can review and
                                    approve withdrawal requests submitted by
                                    fundraiser owners.
                                </p>

                                <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
                                    <div className="border-b border-gray-200 dark:border-gray-700">
                                        <nav className="flex -mb-px">
                                            <button
                                                onClick={() =>
                                                    setActiveTab("pending")
                                                }
                                                className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                                                    activeTab === "pending"
                                                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                                                }`}>
                                                Pending Approvals
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setActiveTab("completed")
                                                }
                                                className={`w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                                                    activeTab === "completed"
                                                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                                                }`}>
                                                Completed Transactions
                                            </button>
                                        </nav>
                                    </div>
                                    <div className="px-4 py-5 sm:p-6">
                                        <WithdrawalRequestList
                                            type={activeTab}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg mt-8">
                                <div className="px-4 py-5 sm:px-6">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Authorized Signers
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        The following addresses are authorized
                                        to approve withdrawal requests.
                                    </p>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-700">
                                    <SignatureOwnersList
                                        currentAddress={address || ""}
                                    />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg mt-8">
                                <div className="px-4 py-5 sm:p-6">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                        About the Approval Process
                                    </h2>
                                    <div className="prose dark:prose-dark max-w-none">
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Our multi-signature system ensures
                                            secure fund disbursement through
                                            multiple approvals.
                                        </p>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-6 mb-2">
                                            How it works:
                                        </h3>
                                        <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-2">
                                            <li>
                                                Fundraiser owners submit
                                                withdrawal requests via the Fund
                                                Requests page
                                            </li>
                                            <li>
                                                At least 2 out of 3 authorized
                                                signers must approve each
                                                withdrawal request
                                            </li>
                                            <li>
                                                Once threshold is met, funds are
                                                automatically released to the
                                                fundraiser owner
                                            </li>
                                            <li>
                                                All transactions are recorded on
                                                the blockchain for transparency
                                            </li>
                                        </ul>
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
