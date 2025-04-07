"use client";

import { useState, useEffect } from "react";
import { useAccount, useContractReads, usePublicClient } from "wagmi";
import { FUND_ALLOCATION_ADDRESS } from "../../../../config/wagmi";
import { fundAllocationABI } from "@/contracts/abis";

type Fundraiser = {
    id: number;
    name: string;
    description: string;
    goal: bigint;
    raised: bigint;
    creator: string;
    status: number;
};

export default function FundraiserDebugPage() {
    const { isConnected, address } = useAccount();
    const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const publicClient = usePublicClient();

    // Get fundraiser count using useContractReads
    const { data: fundraiserCountData } = useContractReads({
        contracts: [
            {
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "getFundraiserCount",
            },
        ],
    });

    // Load fundraisers when count changes
    useEffect(() => {
        const loadFundraisers = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Get the count
                if (!fundraiserCountData || !fundraiserCountData[0]?.result) {
                    console.log("No fundraiser count available");
                    setIsLoading(false);
                    return;
                }

                const count = Number(fundraiserCountData[0].result);
                console.log(`Fundraiser count: ${count}`);

                if (count === 0) {
                    setFundraisers([]);
                    setIsLoading(false);
                    return;
                }

                if (!publicClient) {
                    setError("Public client not available");
                    setIsLoading(false);
                    return;
                }

                // Fetch individual fundraisers
                const fetchedFundraisers: Fundraiser[] = [];

                for (let i = 0; i < count; i++) {
                    try {
                        console.log(`Fetching fundraiser ${i}...`);

                        const result = await publicClient.readContract({
                            address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                            abi: fundAllocationABI,
                            functionName: "fundraisers",
                            args: [BigInt(i)],
                        });

                        console.log(`Fundraiser ${i} raw result:`, result);

                        // Extract the fundraiser data
                        const fundraiserData = result as any;

                        if (fundraiserData) {
                            const fundraiser: Fundraiser = {
                                id: i,
                                name: fundraiserData.name || "",
                                description: fundraiserData.description || "",
                                goal: BigInt(
                                    fundraiserData.goal?.toString() || "0"
                                ),
                                raised: BigInt(
                                    fundraiserData.raised?.toString() || "0"
                                ),
                                creator: fundraiserData.creator || "",
                                status: Number(fundraiserData.status) || 0,
                            };

                            fetchedFundraisers.push(fundraiser);
                        }
                    } catch (err) {
                        console.error(`Error fetching fundraiser ${i}:`, err);
                    }
                }

                console.log("All fundraisers:", fetchedFundraisers);
                setFundraisers(fetchedFundraisers);
            } catch (err: any) {
                console.error("Error loading fundraisers:", err);
                setError(err.message || "Unknown error");
            } finally {
                setIsLoading(false);
            }
        };

        loadFundraisers();
    }, [fundraiserCountData, publicClient]);

    // Status mapping
    const statusLabels = [
        "Inactive",
        "Active",
        "Funded",
        "Completed",
        "Cancelled",
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Fundraiser Debug Page</h1>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
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

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Fundraisers</h2>

                {isLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">
                            Loading fundraisers...
                        </p>
                    </div>
                ) : error ? (
                    <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                ) : fundraisers.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600 dark:text-gray-400">
                            No fundraisers found.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Goal (ETH)
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Raised (ETH)
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Creator
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {fundraisers.map((fundraiser) => (
                                    <tr key={fundraiser.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {fundraiser.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {fundraiser.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                                            {fundraiser.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {(
                                                Number(fundraiser.goal) / 1e18
                                            ).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                            {(
                                                Number(fundraiser.raised) / 1e18
                                            ).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {`${fundraiser.creator.substring(
                                                0,
                                                6
                                            )}...${fundraiser.creator.substring(
                                                fundraiser.creator.length - 4
                                            )}`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    fundraiser.status === 1
                                                        ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                                                        : fundraiser.status ===
                                                          2
                                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                                                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                                }`}>
                                                {statusLabels[
                                                    fundraiser.status
                                                ] ||
                                                    `Unknown (${fundraiser.status})`}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
