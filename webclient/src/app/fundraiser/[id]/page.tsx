"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatEther } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Header from "@/components/Layout/Header";
import { FUND_ALLOCATION_ADDRESS } from "../../../../config/wagmi";
import { fundAllocationABI } from "@/contracts/abis";

type Fundraiser = {
    id: number;
    name: string;
    description: string;
    creator: string;
    targetAmount: bigint;
    currentAmount: bigint;
    deadline: bigint;
    active: boolean;
    progress: number;
    timeLeft: string;
};

export default function FundraiserDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const { isConnected } = useAccount();
    const publicClient = usePublicClient();

    const [fundraiser, setFundraiser] = useState<Fundraiser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFundraiserDetails = async () => {
            if (!params || !params.id) {
                setError("Invalid fundraiser ID");
                setLoading(false);
                return;
            }

            if (!publicClient) {
                setError("Blockchain client not initialized");
                setLoading(false);
                return;
            }

            try {
                const id = Number(params.id);
                setLoading(true);

                // Call contract to get fundraiser data using publicClient
                const result = await publicClient.readContract({
                    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                    abi: fundAllocationABI,
                    functionName: "fundraisers",
                    args: [BigInt(id)],
                });

                if (result) {
                    try {
                        // Extract fundraiser data from result
                        const fundraiserData = result as any[];

                        if (
                            !Array.isArray(fundraiserData) ||
                            fundraiserData.length < 7
                        ) {
                            throw new Error("Invalid fundraiser data format");
                        }

                        // Extract data from array
                        const name = fundraiserData[0] || `Fundraiser #${id}`;
                        const description =
                            fundraiserData[1] || "No description available";
                        const creator =
                            fundraiserData[2] ||
                            "0x0000000000000000000000000000000000000000";
                        const targetAmount = BigInt(
                            fundraiserData[3]?.toString() || "0"
                        );
                        const currentAmount = BigInt(
                            fundraiserData[4]?.toString() || "0"
                        );
                        const deadline = BigInt(
                            fundraiserData[5]?.toString() || "0"
                        );
                        const active = !!fundraiserData[6];

                        // Calculate progress percentage
                        const progress =
                            targetAmount > 0
                                ? Number(
                                      (currentAmount * BigInt(100)) /
                                          targetAmount
                                  )
                                : 0;

                        // Calculate time remaining
                        const timeLeft = getTimeRemaining(deadline);

                        const fundraiserObj: Fundraiser = {
                            id,
                            name,
                            description,
                            creator,
                            targetAmount,
                            currentAmount,
                            deadline,
                            active,
                            progress,
                            timeLeft,
                        };

                        setFundraiser(fundraiserObj);
                        setError(null);
                    } catch (parseError) {
                        console.error(
                            "Error parsing fundraiser data:",
                            parseError
                        );
                        setError("Error parsing fundraiser data");
                    }
                } else {
                    setError("Fundraiser not found");
                }
            } catch (err) {
                console.error("Error fetching fundraiser:", err);
                setError("Error fetching fundraiser details");
            } finally {
                setLoading(false);
            }
        };

        if (isConnected && publicClient) {
            fetchFundraiserDetails();
        } else {
            setLoading(false);
        }
    }, [params, isConnected, publicClient]);

    // Helper function to calculate time remaining
    function getTimeRemaining(deadline: bigint): string {
        const now = BigInt(Math.floor(Date.now() / 1000));
        if (deadline <= now) return "Ended";

        const secondsLeft = Number(deadline - now);
        const daysLeft = Math.floor(secondsLeft / 86400);

        if (daysLeft > 0) {
            return `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
        }

        const hoursLeft = Math.floor(secondsLeft / 3600);
        if (hoursLeft > 0) {
            return `${hoursLeft} hour${hoursLeft === 1 ? "" : "s"} left`;
        }

        const minutesLeft = Math.floor(secondsLeft / 60);
        return `${minutesLeft} minute${minutesLeft === 1 ? "" : "s"} left`;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header
                pageTitle={fundraiser ? fundraiser.name : "Fundraiser Details"}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {!isConnected ? (
                    <div className="text-center py-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Connect your wallet to view fundraiser details
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            You need to connect your wallet to interact with the
                            blockchain.
                        </p>
                        <div className="flex justify-center">
                            <ConnectButton />
                        </div>
                    </div>
                ) : loading ? (
                    <div className="text-center py-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/5 mb-2"></div>
                            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
                        </div>
                    </div>
                ) : error ? (
                    <div className="text-center py-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">
                            Error
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            {error}
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Back to Home
                        </Link>
                    </div>
                ) : fundraiser ? (
                    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-2xl font-bold leading-6 text-gray-900 dark:text-white">
                                {fundraiser.name}
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                                Created by: {fundraiser.creator}
                            </p>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700">
                            <dl>
                                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Description
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                                        {fundraiser.description}
                                    </dd>
                                </div>
                                <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Target Amount
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                                        {formatEther(fundraiser.targetAmount)}{" "}
                                        ETH
                                    </dd>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Current Amount
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                                        {formatEther(fundraiser.currentAmount)}{" "}
                                        ETH
                                    </dd>
                                </div>
                                <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Progress
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                                        <div className="relative pt-1">
                                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                                                <div
                                                    style={{
                                                        width: `${fundraiser.progress}%`,
                                                    }}
                                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-semibold inline-block text-blue-600 dark:text-blue-400">
                                                    {fundraiser.progress}%
                                                </span>
                                            </div>
                                        </div>
                                    </dd>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Status
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                                        {fundraiser.active ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100">
                                                Active • {fundraiser.timeLeft}
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100">
                                                Inactive
                                            </span>
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                        <div className="px-4 py-5 sm:px-6 flex justify-center space-x-4">
                            <Link
                                href="/"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                Back to Home
                            </Link>
                            <Link
                                href={`/donate?id=${fundraiser.id}`}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                Donate
                            </Link>
                        </div>
                    </div>
                ) : null}
            </main>
        </div>
    );
}
