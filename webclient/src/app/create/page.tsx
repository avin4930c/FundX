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
                    <div className="md:w-2/3">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                            Create a Fundraiser
                        </h1>

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
                                <div className="text-center py-8">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                        Connect your wallet to create a
                                        fundraiser
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                                        You need to connect your wallet before
                                        you can create a fundraiser.
                                    </p>
                                    <div className="flex justify-center">
                                        <ConnectButton />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Information section */}
                    <div className="md:w-1/3 mt-8 md:mt-0">
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
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
                                            target amount and duration.
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
                                            Deploy on blockchain
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Your fundraiser will be created
                                            on-chain with complete transparency
                                            and security.
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
                                            Share and receive donations
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Your fundraiser will appear on the
                                            FundX homepage where users can
                                            donate to your cause.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-2">
                                    Need help?
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Have questions about creating a fundraiser?
                                    Check our
                                    <Link
                                        href="/help"
                                        className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                                        help section
                                    </Link>
                                    or
                                    <Link
                                        href="/contact"
                                        className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                                        contact us
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
