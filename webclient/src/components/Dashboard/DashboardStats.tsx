"use client";

import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { useContractRead, usePublicClient, useBlockNumber } from "wagmi";
import { FUND_ALLOCATION_ADDRESS } from "../../../config/wagmi";
import { fundAllocationABI } from "@/contracts/abis";

export const DashboardStats = () => {
    // Statistics state
    const [stats, setStats] = useState({
        totalFunds: "0",
        totalProjects: "0",
        activeFundraisers: "0",
        successfulProjects: "0",
    });

    const publicClient = usePublicClient();
    const { data: blockNumber } = useBlockNumber({ watch: true });

    // Contract reads
    const { data: totalFunds, refetch: refetchTotalFunds } = useContractRead({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: "totalFunds",
    });

    const { data: fundraiserCount, refetch: refetchFundraiserCount } =
        useContractRead({
            address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
            abi: fundAllocationABI,
            functionName: "getFundraiserCount",
        });

    // Refresh data on new blocks
    useEffect(() => {
        refetchTotalFunds();
        refetchFundraiserCount();
    }, [blockNumber, refetchTotalFunds, refetchFundraiserCount]);

    // Update stats when data changes
    useEffect(() => {
        const loadStats = async () => {
            const newStats = {
                totalFunds: totalFunds
                    ? formatEther(totalFunds as bigint)
                    : "0",
                totalProjects: "0",
                activeFundraisers: "0",
                successfulProjects: "0",
            };

            if (fundraiserCount && publicClient) {
                const count = Number(fundraiserCount);
                let activeCount = 0;
                let successfulCount = 0;

                // Fetch all fundraisers and count active ones
                for (let i = 0; i < count; i++) {
                    try {
                        const result = await publicClient.readContract({
                            address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                            abi: fundAllocationABI,
                            functionName: "fundraisers",
                            args: [BigInt(i)],
                        });

                        if (result) {
                            const fundraiserData = result as any;
                            const status = Number(fundraiserData.status || 0);
                            if (status === 1) {
                                // Active status
                                activeCount++;
                            } else if (status === 2) {
                                // Funded status
                                successfulCount++;
                            }
                        }
                    } catch (error) {
                        console.error(`Error fetching fundraiser ${i}:`, error);
                    }
                }

                newStats.totalProjects = count.toString();
                newStats.activeFundraisers = activeCount.toString();
                newStats.successfulProjects = successfulCount.toString();
            }

            setStats(newStats);
        };

        loadStats();
    }, [totalFunds, fundraiserCount, publicClient]);

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                Platform Statistics
            </h2>

            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative bg-white dark:bg-gray-700 pt-5 px-4 pb-6 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden">
                    <dt>
                        <div className="absolute bg-blue-500 rounded-md p-3">
                            <svg
                                className="h-6 w-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <p className="ml-16 text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                            Total Funds Raised
                        </p>
                    </dt>
                    <dd className="ml-16 flex items-baseline">
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {parseFloat(stats.totalFunds).toFixed(2)} ETH
                        </p>
                    </dd>
                </div>

                <div className="relative bg-white dark:bg-gray-700 pt-5 px-4 pb-6 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden">
                    <dt>
                        <div className="absolute bg-green-500 rounded-md p-3">
                            <svg
                                className="h-6 w-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <p className="ml-16 text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                            Successful Projects
                        </p>
                    </dt>
                    <dd className="ml-16 flex items-baseline">
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {stats.successfulProjects}
                        </p>
                    </dd>
                </div>

                <div className="relative bg-white dark:bg-gray-700 pt-5 px-4 pb-6 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden">
                    <dt>
                        <div className="absolute bg-purple-500 rounded-md p-3">
                            <svg
                                className="h-6 w-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                />
                            </svg>
                        </div>
                        <p className="ml-16 text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                            Total Projects
                        </p>
                    </dt>
                    <dd className="ml-16 flex items-baseline">
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {stats.totalProjects}
                        </p>
                    </dd>
                </div>

                <div className="relative bg-white dark:bg-gray-700 pt-5 px-4 pb-6 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden">
                    <dt>
                        <div className="absolute bg-yellow-500 rounded-md p-3">
                            <svg
                                className="h-6 w-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                                />
                            </svg>
                        </div>
                        <p className="ml-16 text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                            Active Fundraisers
                        </p>
                    </dt>
                    <dd className="ml-16 flex items-baseline">
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {stats.activeFundraisers}
                        </p>
                    </dd>
                </div>
            </dl>
        </div>
    );
};
