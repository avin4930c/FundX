"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import WithdrawalRequestForm from "@/components/FundRequest/WithdrawalRequestForm";
import PendingRequestsList from "@/components/FundRequest/PendingRequestsList";
import Header from "@/components/Layout/Header";

export default function FundRequestsPage() {
    const { isConnected } = useAccount();
    const [selectedTab, setSelectedTab] = useState<
        "myRequests" | "pendingApprovals"
    >("myRequests");
    const [selectedFundraiserId, setSelectedFundraiserId] = useState<number>(0);
    const [isRequestSuccessful, setIsRequestSuccessful] = useState(false);

    // In a real app, these would be loaded from the contract
    const myFundraisers = [
        { id: 0, name: "Community Garden Project" },
        { id: 1, name: "Tech Education for Kids" },
        { id: 2, name: "Clean Water Initiative" },
    ];

    // Handle successful request submission
    const handleRequestSuccess = () => {
        setIsRequestSuccessful(true);
        setTimeout(() => {
            setIsRequestSuccessful(false);
        }, 5000);
    };

    return (
        <>
            <Header pageTitle="Fund Requests & Approvals" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {!isConnected ? (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                        <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
                            Connect Your Wallet
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            You need to connect your wallet to request funds or
                            approve requests.
                        </p>
                        <div className="flex justify-center">
                            <ConnectButton />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Tabs */}
                        <div className="border-b border-gray-200 dark:border-gray-700">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => setSelectedTab("myRequests")}
                                    className={`${
                                        selectedTab === "myRequests"
                                            ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                    aria-current={
                                        selectedTab === "myRequests"
                                            ? "page"
                                            : undefined
                                    }>
                                    My Requests
                                </button>
                                <button
                                    onClick={() =>
                                        setSelectedTab("pendingApprovals")
                                    }
                                    className={`${
                                        selectedTab === "pendingApprovals"
                                            ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                    aria-current={
                                        selectedTab === "pendingApprovals"
                                            ? "page"
                                            : undefined
                                    }>
                                    Pending Approvals
                                </button>
                            </nav>
                        </div>

                        {/* Successful request message */}
                        {isRequestSuccessful && (
                            <div className="bg-green-50 dark:bg-green-900 p-4 rounded-md">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg
                                            className="h-5 w-5 text-green-400"
                                            fill="currentColor"
                                            viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                            Your withdrawal request has been
                                            submitted successfully and is now
                                            awaiting approval from DAO members.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedTab === "myRequests" ? (
                            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                                <div className="px-4 py-5 sm:px-6 bg-gray-50 dark:bg-gray-700">
                                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Request Withdrawal
                                    </h2>
                                    <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                                        Submit a request to withdraw funds from
                                        your fundraiser. DAO members will vote
                                        on your request.
                                    </p>
                                </div>

                                <div className="px-4 py-5 sm:p-6">
                                    {/* Fundraiser selection */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Select Fundraiser
                                        </label>
                                        <select
                                            value={selectedFundraiserId}
                                            onChange={(e) =>
                                                setSelectedFundraiserId(
                                                    Number(e.target.value)
                                                )
                                            }
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                                            {myFundraisers.map((fundraiser) => (
                                                <option
                                                    key={fundraiser.id}
                                                    value={fundraiser.id}>
                                                    {fundraiser.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Request Form */}
                                    <WithdrawalRequestForm
                                        fundraiserId={selectedFundraiserId}
                                        onSuccess={handleRequestSuccess}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                                <div className="px-4 py-5 sm:px-6 bg-gray-50 dark:bg-gray-700">
                                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                                        DAO Withdrawal Requests
                                    </h2>
                                    <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                                        Review and vote on pending withdrawal
                                        requests from fundraisers.
                                    </p>
                                </div>

                                <div className="px-4 py-5 sm:p-6">
                                    <PendingRequestsList />
                                </div>
                            </div>
                        )}

                        {/* Information section */}
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                About Fund Requests
                            </h3>
                            <div className="space-y-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                                            1
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h4 className="text-md font-medium text-gray-900 dark:text-white">
                                            Submit a Request
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Fundraisers can request to withdraw
                                            funds from their campaigns by
                                            specifying the amount and reason.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                                            2
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h4 className="text-md font-medium text-gray-900 dark:text-white">
                                            DAO Voting
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            DAO members vote to approve or
                                            reject each request, ensuring
                                            transparency and accountability.
                                            <span className="block mt-1">
                                                <Link
                                                    href="/governance"
                                                    className="text-blue-600 dark:text-blue-400 hover:underline">
                                                    Go to Governance Portal →
                                                </Link>
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                                            3
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h4 className="text-md font-medium text-gray-900 dark:text-white">
                                            Multi-Signature Approval
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Approved requests require additional
                                            signatures from designated approvers
                                            before funds are released.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 text-center">
                                <Link
                                    href="/"
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium">
                                    Return to Home
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
