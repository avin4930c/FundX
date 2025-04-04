"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import DonationForm from "@/components/Donation/DonationForm";
import Header from "@/components/Layout/Header";

export default function DonatePage() {
    const { isConnected } = useAccount();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle successful donation
    const handleSuccess = () => {
        // Delay before redirecting to home page
        setTimeout(() => {
            router.push("/");
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header pageTitle="Donate" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="md:flex md:gap-10">
                    {/* Form section */}
                    <div className="md:w-2/3">
                        {isConnected ? (
                            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                                <DonationForm
                                    onSuccess={handleSuccess}
                                    isSubmitting={isSubmitting}
                                    setIsSubmitting={setIsSubmitting}
                                />
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                                <div className="text-center py-8">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                        Connect your wallet to donate
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                                        You need to connect your wallet before
                                        you can make a donation.
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
                                            Select a fundraiser
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Browse through the available
                                            fundraisers and choose one that
                                            resonates with you.
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
                                            Enter donation amount
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Specify how much ETH you'd like to
                                            contribute to the selected cause.
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
                                            Confirm with MetaMask
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Your donation will be processed
                                            through MetaMask. Confirm the
                                            transaction to complete your
                                            donation.
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
                                            Track your impact
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Your donation is recorded on the
                                            blockchain. You can track its impact
                                            as the fundraiser progresses.
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
                </div>
            </main>
        </div>
    );
}
