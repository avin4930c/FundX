"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import FundraiserForm from "@/components/Fundraiser/FundraiserForm";
import Header from "@/components/Layout/Header";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function CreateFundraiserPage() {
    const { isConnected } = useAccount();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle successful creation
    const handleSuccess = () => {
        // Redirect to home page after a slight delay to show success message
        setTimeout(() => {
            router.push("/");
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header pageTitle="Create a Fundraiser" />

            {/* Main content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="md:flex md:gap-10">
                    {/* Form section */}
                    <div className="md:w-2/3 mb-8 md:mb-0">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Create a Fundraiser
                            </h1>
                            <Link
                                href="/"
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
                                ← Back to Home
                            </Link>
                        </div>

                        {isConnected ? (
                            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                                <FundraiserForm
                                    onSuccess={handleSuccess}
                                    isSubmitting={isSubmitting}
                                    setIsSubmitting={setIsSubmitting}
                                />
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                                <div className="text-center py-10">
                                    <svg
                                        className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                    </svg>
                                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                                        Connect your wallet to create a
                                        fundraiser
                                    </h3>
                                    <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                        You need to connect your Ethereum wallet
                                        before you can create a fundraiser on
                                        the blockchain.
                                    </p>
                                    <div className="mt-6 flex justify-center">
                                        <ConnectButton />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Information section */}
                    <div className="md:w-1/3">
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 sticky top-8">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                How it works
                            </h2>

                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                                            1
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-md font-medium text-gray-900 dark:text-white">
                                            Create your fundraiser
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Fill out the form with all details
                                            about your fundraiser, including
                                            your target amount and milestone
                                            breakdown.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                                            2
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-md font-medium text-gray-900 dark:text-white">
                                            Add milestones (optional)
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Break down your project into
                                            manageable milestones. Each
                                            milestone requires proof before
                                            funds are released.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                                            3
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-md font-medium text-gray-900 dark:text-white">
                                            Deploy on blockchain
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Your fundraiser will be created
                                            on-chain with complete transparency
                                            and security. Gas fees will apply.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                                            4
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-md font-medium text-gray-900 dark:text-white">
                                            Share and receive donations
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Your fundraiser will appear on the
                                            FundX platform where users can
                                            discover and donate to your cause.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                                    About Milestones
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    Milestones increase trust by breaking your
                                    project into stages. When you complete a
                                    milestone, you submit proof and donors vote
                                    to release funds for that stage.
                                </p>

                                <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-md">
                                    <h4 className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                                        Tips for successful fundraisers:
                                    </h4>
                                    <ul className="mt-2 list-disc list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                        <li>Be specific about your goals</li>
                                        <li>Explain how funds will be used</li>
                                        <li>
                                            Break large projects into milestones
                                        </li>
                                        <li>
                                            Share your fundraiser on social
                                            media
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                                    Need help?
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Have questions about creating a fundraiser?
                                    Check our{" "}
                                    <Link
                                        href="/help"
                                        className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                                        help section
                                    </Link>{" "}
                                    or{" "}
                                    <Link
                                        href="/contact"
                                        className="text-blue-600 dark:text-blue-400 hover:underline">
                                        contact support
                                    </Link>
                                    .
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
