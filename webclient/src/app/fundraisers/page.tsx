"use client";

import { useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AllFundraisers } from "@/components/Dashboard/AllFundraisers";
import Header from "@/components/Layout/Header";

export default function FundraisersPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header pageTitle="All Fundraisers" />

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="mb-8">
                        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                            Browse through all fundraisers, including both
                            active and completed campaigns.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                href="/create"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                Create New Fundraiser
                            </Link>
                            <Link
                                href="/fund-requests"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                View Fund Requests
                            </Link>
                            <Link
                                href="/"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                Active Fundraisers
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <AllFundraisers />
                        </div>
                    </div>

                    {/* How it works section */}
                    <div className="mt-10 bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                How It Works
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <div className="bg-blue-100 dark:bg-blue-900 w-10 h-10 rounded-full flex items-center justify-center mb-3">
                                        <span className="text-blue-600 dark:text-blue-300 font-bold">
                                            1
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        Browse Projects
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Explore fundraisers from various
                                        categories and find causes you care
                                        about.
                                    </p>
                                </div>
                                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <div className="bg-blue-100 dark:bg-blue-900 w-10 h-10 rounded-full flex items-center justify-center mb-3">
                                        <span className="text-blue-600 dark:text-blue-300 font-bold">
                                            2
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        Donate Securely
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Make transparent donations directly
                                        through your crypto wallet.
                                    </p>
                                </div>
                                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <div className="bg-blue-100 dark:bg-blue-900 w-10 h-10 rounded-full flex items-center justify-center mb-3">
                                        <span className="text-blue-600 dark:text-blue-300 font-bold">
                                            3
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        Track Impact
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Follow the progress of your donations
                                        and see the impact you're making.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
