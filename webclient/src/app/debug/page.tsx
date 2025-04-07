"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { FUND_ALLOCATION_ADDRESS } from "../../../config/wagmi";

export default function DebugIndex() {
    const { isConnected, address } = useAccount();

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">FundX Debugging Tools</h1>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">
                    Contract Configuration
                </h2>
                <div className="space-y-2">
                    <div>
                        <span className="font-medium">Contract Address:</span>{" "}
                        <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {FUND_ALLOCATION_ADDRESS || "Not set"}
                        </code>
                    </div>
                    <div>
                        <span className="font-medium">Connected Address:</span>{" "}
                        <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {address || "Not connected"}
                        </code>
                    </div>
                    <div>
                        <span className="font-medium">Wallet Connected:</span>{" "}
                        <span
                            className={
                                isConnected ? "text-green-500" : "text-red-500"
                            }>
                            {isConnected ? "Yes" : "No"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <DebugCard
                    title="Contract Debug"
                    description="Test basic contract reading capabilities with getFundraiserCount."
                    href="/debug/contract"
                />

                <DebugCard
                    title="API Debug"
                    description="Test the API endpoints for reading contract data."
                    href="/debug/api"
                />

                <DebugCard
                    title="Fundraisers Debug"
                    description="View all fundraisers and their details."
                    href="/debug/fundraisers"
                />

                <DebugCard
                    title="Withdrawals Debug"
                    description="View and interact with withdrawal requests."
                    href="/debug/withdrawals"
                />
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        Return to Home
                    </Link>

                    <Link
                        href="/fundraisers"
                        className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                        View All Fundraisers
                    </Link>
                </div>
            </div>
        </div>
    );
}

// Helper component for debug card
function DebugCard({
    title,
    description,
    href,
}: {
    title: string;
    description: string;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="block bg-white dark:bg-gray-800 shadow hover:shadow-md rounded-lg overflow-hidden transition-shadow duration-200">
            <div className="p-6">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    {title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {description}
                </p>
                <div className="flex justify-end">
                    <span className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline">
                        Open Tool →
                    </span>
                </div>
            </div>
        </Link>
    );
}
