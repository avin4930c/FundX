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

// Updated Fundraiser type to match the contract structure
type Fundraiser = {
    id: number;
    name: string;
    description: string;
    creator: string;
    targetAmount: bigint;
    currentAmount: bigint;
    status: number; // Using the enum value from the contract
    active: boolean; // Derived from status
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

    // Calculate progress percentage
    const calculateProgress = (current: bigint, target: bigint): number => {
        if (target === BigInt(0)) return 0;

        // Convert BigInt values to strings first, then to numbers to avoid precision issues
        const currentNum = Number(current.toString());
        const targetNum = Number(target.toString());

        // Calculate the percentage using regular number operations
        return Math.floor((currentNum / targetNum) * 100);
    };

    // Calculate time remaining
    const getTimeRemaining = () => {
        // Since we don't have a deadline in the contract, we'll use a default of 30 days
        const now = new Date();
        const futureDate = new Date(now);
        futureDate.setDate(futureDate.getDate() + 30);

        const diff = futureDate.getTime() - now.getTime();
        const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (daysLeft > 0) {
            return `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
        }

        const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
        if (hoursLeft > 0) {
            return `${hoursLeft} hour${hoursLeft === 1 ? "" : "s"} left`;
        }

        const minutesLeft = Math.floor(diff / (1000 * 60));
        return `${minutesLeft} minute${minutesLeft === 1 ? "" : "s"} left`;
    };

    useEffect(() => {
        const fetchFundraiserDetails = async () => {
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
                        const fundraiserData = result as any;

                        if (!fundraiserData) {
                            throw new Error("Invalid fundraiser data format");
                        }

                        // Extract data
                        const name = fundraiserData.name || `Fundraiser #${id}`;
                        const description =
                            fundraiserData.description ||
                            "No description available";
                        const creator =
                            fundraiserData.creator ||
                            "0x0000000000000000000000000000000000000000";
                        const targetAmount = BigInt(
                            fundraiserData.goal?.toString() || "0"
                        );
                        const currentAmount = BigInt(
                            fundraiserData.raised?.toString() || "0"
                        );
                        const status = Number(fundraiserData.status || 0);

                        // Check status - 1 is Active in our enum
                        const active = status === 1;

                        // Calculate progress percentage
                        const progress = calculateProgress(
                            currentAmount,
                            targetAmount
                        );

                        // Calculate time remaining (using default)
                        const timeLeft = getTimeRemaining();

                        const fundraiser: Fundraiser = {
                            id,
                            name,
                            description,
                            creator,
                            targetAmount,
                            currentAmount,
                            status,
                            active,
                            progress,
                            timeLeft,
                        };

                        setFundraiser(fundraiser);
                        setError(null);
                    } catch (parseError) {
                        console.error(
                            "Error parsing fundraiser data:",
                            parseError
                        );
                        setError("Failed to parse fundraiser data");
                    }
                } else {
                    setError("Fundraiser not found");
                }
            } catch (error) {
                console.error("Error fetching fundraiser:", error);
                setError("Failed to load fundraiser details");
            } finally {
                setLoading(false);
            }
        };

        if (publicClient) {
            fetchFundraiserDetails();
        }
    }, [params.id, publicClient]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header
                    pageTitle="Fundraiser Details"
                    showBackButton
                />
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !fundraiser) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header
                    pageTitle="Fundraiser Details"
                    showBackButton
                />
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="text-center">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    {error || "Fundraiser not found"}
                                </h3>
                                <div className="mt-5">
                                    <Link
                                        href="/"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                        Return to Home
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header
                pageTitle={fundraiser.name}
                showBackButton
            />

            <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Fundraiser Image (placeholder) */}
                            <div className="h-64 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center rounded-lg">
                                <span className="text-white text-6xl font-bold">
                                    {fundraiser.name.charAt(0)}
                                </span>
                            </div>

                            {/* Fundraiser Details */}
                            <div>
                                <div className="flex justify-between items-start">
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {fundraiser.name}
                                    </h1>
                                    <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            fundraiser.active
                                                ? "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100"
                                                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                        }`}>
                                        {fundraiser.active
                                            ? "Active"
                                            : "Completed"}
                                    </span>
                                </div>

                                <p className="mt-2 text-gray-600 dark:text-gray-300">
                                    {fundraiser.description}
                                </p>

                                {/* Progress bar */}
                                <div className="mt-6">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-500 dark:text-gray-400">
                                            Progress
                                        </span>
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {fundraiser.progress}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full"
                                            style={{
                                                width: `${Math.min(
                                                    100,
                                                    fundraiser.progress
                                                )}%`,
                                            }}></div>
                                    </div>
                                </div>

                                {/* Fundraising details */}
                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Raised
                                        </p>
                                        <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                            {formatEther(
                                                fundraiser.currentAmount
                                            )}{" "}
                                            ETH
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Goal
                                        </p>
                                        <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                            {formatEther(
                                                fundraiser.targetAmount
                                            )}{" "}
                                            ETH
                                        </p>
                                    </div>
                                </div>

                                {/* Creator info */}
                                <div className="mt-6">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Created by
                                    </p>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                                        {fundraiser.creator}
                                    </p>
                                </div>

                                {/* Time remaining */}
                                <div className="mt-6">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Time Remaining
                                    </p>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {fundraiser.timeLeft}
                                    </p>
                                </div>

                                {/* Donation section - only show for active fundraisers */}
                                {fundraiser.active && (
                                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                            Support this Fundraiser
                                        </h2>
                                        {isConnected ? (
                                            <div className="flex space-x-2">
                                                <div className="relative rounded-md shadow-sm flex-1">
                                                    <input
                                                        type="text"
                                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                                        placeholder="Amount in ETH"
                                                    />
                                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                                                            ETH
                                                        </span>
                                                    </div>
                                                </div>
                                                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                                    Donate
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                    Connect your wallet to
                                                    donate
                                                </p>
                                                <ConnectButton />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
