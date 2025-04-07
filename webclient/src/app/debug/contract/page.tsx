"use client";

import { useState, useEffect } from "react";
import { useAccount, useContractReads, usePublicClient } from "wagmi";
import { FUND_ALLOCATION_ADDRESS } from "../../../../config/wagmi";
import { fundAllocationABI } from "@/contracts/abis";

export default function ContractDebugPage() {
    const { isConnected, address } = useAccount();
    const [contractReadsResult, setContractReadsResult] = useState<any>(null);
    const [directResult, setDirectResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const publicClient = usePublicClient();

    // Get fundraiser count using useContractReads
    const {
        data: fundraiserCount,
        isLoading,
        isError,
        refetch,
    } = useContractReads({
        contracts: [
            {
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "getFundraiserCount",
            },
        ],
    });

    // Attempt to read directly using publicClient
    const readDirectly = async () => {
        try {
            setError(null);
            if (!publicClient) {
                setError("Public client not available");
                return;
            }

            const result = await publicClient.readContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "getFundraiserCount",
            });

            console.log("Direct read result:", result);
            setDirectResult(result);
        } catch (err: any) {
            console.error("Error reading contract directly:", err);
            setError(err.message || "Unknown error");
        }
    };

    // Fetch contract reads result when available
    useEffect(() => {
        if (fundraiserCount) {
            setContractReadsResult(fundraiserCount);
        }
    }, [fundraiserCount]);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Contract Debug Page</h1>

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

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">
                    Contract Read Tests
                </h2>

                <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">
                        Using useContractReads
                    </h3>
                    {isLoading ? (
                        <div className="text-gray-500">Loading...</div>
                    ) : isError ? (
                        <div className="text-red-500">Error fetching data</div>
                    ) : (
                        <div>
                            <div className="mb-2">
                                <span className="font-medium">Raw Result:</span>
                                <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 overflow-auto">
                                    {JSON.stringify(
                                        contractReadsResult,
                                        null,
                                        2
                                    )}
                                </pre>
                            </div>
                            <div>
                                <span className="font-medium">
                                    Fundraiser Count:
                                </span>{" "}
                                {contractReadsResult &&
                                contractReadsResult[0]?.result !== undefined
                                    ? Number(contractReadsResult[0].result)
                                    : "N/A"}
                            </div>
                            <button
                                onClick={() => refetch()}
                                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                Refresh
                            </button>
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-lg font-medium mb-2">
                        Using Direct Contract Call
                    </h3>
                    <div className="mb-2">
                        <button
                            onClick={readDirectly}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            Read Directly
                        </button>
                    </div>

                    {error && (
                        <div className="text-red-500 mb-2">Error: {error}</div>
                    )}

                    {directResult !== null && (
                        <div>
                            <span className="font-medium">Raw Result:</span>
                            <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 overflow-auto">
                                {JSON.stringify(directResult, null, 2)}
                            </pre>
                            <div className="mt-2">
                                <span className="font-medium">
                                    Fundraiser Count:
                                </span>{" "}
                                {Number(directResult)}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">
                    Back to Debug Tools
                </h2>
                <a
                    href="/debug"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    ← Back to Debug Index
                </a>
            </div>
        </div>
    );
}
