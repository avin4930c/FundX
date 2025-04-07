"use client";

import { useState, useEffect } from "react";
import {
    useAccount,
    useReadContracts,
    usePublicClient,
    useWriteContract,
    useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther } from "viem";
import { FUND_ALLOCATION_ADDRESS } from "../../../../config/wagmi";
import { fundAllocationABI } from "@/contracts/abis";

type WithdrawalRequest = {
    id: number;
    fundraiserId: number;
    to: string;
    amount: bigint;
    reason: string;
    executed: boolean;
    approvers: string[];
};

export default function WithdrawalDebugPage() {
    const { isConnected, address } = useAccount();
    const [withdrawalRequests, setWithdrawalRequests] = useState<
        WithdrawalRequest[]
    >([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const publicClient = usePublicClient();
    const { writeContract } = useWriteContract();
    const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash: txHash,
        });

    // Get withdrawal request count and owners
    const { data: contractData } = useReadContracts({
        contracts: [
            {
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "getWithdrawalRequestCount",
            },
            {
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "getOwners",
            },
            {
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "required",
            },
        ],
    });

    // Approve withdrawal request
    const handleApprove = async (requestId: number) => {
        if (!isConnected) {
            alert("Please connect your wallet");
            return;
        }

        try {
            console.log(`Approving withdrawal request #${requestId}`);

            const tx = await writeContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "approveWithdrawalRequest",
                args: [BigInt(requestId)],
            });

            setTxHash(tx);
        } catch (err: any) {
            console.error("Error approving withdrawal:", err);
            alert(`Error: ${err.message || "Unknown error"}`);
        }
    };

    // Execute withdrawal request
    const handleExecute = async (requestId: number) => {
        if (!isConnected) {
            alert("Please connect your wallet");
            return;
        }

        try {
            console.log(`Executing withdrawal request #${requestId}`);

            const tx = await writeContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "executeWithdrawalRequest",
                args: [BigInt(requestId)],
            });

            setTxHash(tx);
        } catch (err: any) {
            console.error("Error executing withdrawal:", err);
            alert(`Error: ${err.message || "Unknown error"}`);
        }
    };

    // Refresh data when transaction is confirmed
    useEffect(() => {
        if (isConfirmed) {
            // Reset hash and refresh data
            setTxHash(undefined);
        }
    }, [isConfirmed]);

    // Load withdrawal requests when contract data changes
    useEffect(() => {
        const loadWithdrawalRequests = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Check if contract data is available
                if (!contractData) {
                    console.log("No contract data available");
                    setIsLoading(false);
                    return;
                }

                const withdrawalRequestCount = contractData[0]?.result;
                const owners = contractData[1]?.result;
                const requiredConfirmations = contractData[2]?.result;

                if (
                    withdrawalRequestCount === undefined ||
                    !owners ||
                    requiredConfirmations === undefined
                ) {
                    console.log("Incomplete contract data");
                    setIsLoading(false);
                    return;
                }

                console.log(
                    "Withdrawal request count:",
                    withdrawalRequestCount.toString()
                );
                console.log("Owners:", owners);
                console.log(
                    "Required confirmations:",
                    requiredConfirmations.toString()
                );

                const count = Number(withdrawalRequestCount);

                if (count === 0) {
                    setWithdrawalRequests([]);
                    setIsLoading(false);
                    return;
                }

                if (!publicClient) {
                    setError("Public client not available");
                    setIsLoading(false);
                    return;
                }

                // Fetch individual withdrawal requests
                const fetchedRequests: WithdrawalRequest[] = [];

                for (let i = 0; i < count; i++) {
                    try {
                        console.log(`Fetching withdrawal request ${i}...`);

                        // Get the request details
                        const requestDetails = await publicClient.readContract({
                            address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                            abi: fundAllocationABI,
                            functionName: "getWithdrawalRequest",
                            args: [BigInt(i)],
                        });

                        console.log(`Request ${i} details:`, requestDetails);

                        // Get the approvers
                        const approvers = (await publicClient.readContract({
                            address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                            abi: fundAllocationABI,
                            functionName: "getApprovers",
                            args: [BigInt(i)],
                        })) as string[];

                        console.log(`Request ${i} approvers:`, approvers);

                        if (requestDetails) {
                            const requestData = requestDetails as any;

                            const request: WithdrawalRequest = {
                                id: i,
                                fundraiserId: Number(
                                    requestData.fundraiserId || 0
                                ),
                                to: requestData.to || "",
                                amount: BigInt(
                                    requestData.amount?.toString() || "0"
                                ),
                                reason: requestData.reason || "",
                                executed: !!requestData.executed,
                                approvers: approvers || [],
                            };

                            fetchedRequests.push(request);
                        }
                    } catch (err) {
                        console.error(
                            `Error fetching withdrawal request ${i}:`,
                            err
                        );
                    }
                }

                console.log("All withdrawal requests:", fetchedRequests);
                setWithdrawalRequests(fetchedRequests);
            } catch (err: any) {
                console.error("Error loading withdrawal requests:", err);
                setError(err.message || "Unknown error");
            } finally {
                setIsLoading(false);
            }
        };

        loadWithdrawalRequests();
    }, [contractData, publicClient, isConfirmed]);

    // Check if current user is an owner
    const isOwner = ((contractData?.[1]?.result as string[]) || []).some(
        (owner) => address && owner.toLowerCase() === address.toLowerCase()
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">
                Withdrawal Request Debug Page
            </h1>

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
                        <span className="font-medium">Is Owner:</span>{" "}
                        <span
                            className={
                                isOwner ? "text-green-500" : "text-red-500"
                            }>
                            {isOwner ? "Yes" : "No"}
                        </span>
                    </div>
                    <div>
                        <span className="font-medium">
                            Required Confirmations:
                        </span>{" "}
                        <span className="text-blue-500">
                            {contractData?.[2]?.result?.toString() || "N/A"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">
                    Withdrawal Requests
                </h2>

                {isLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">
                            Loading withdrawal requests...
                        </p>
                    </div>
                ) : error ? (
                    <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                ) : withdrawalRequests.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-600 dark:text-gray-400">
                            No withdrawal requests found.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {withdrawalRequests.map((request) => (
                            <div
                                key={request.id}
                                className="border dark:border-gray-700 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Withdrawal Request #{request.id}
                                    </h3>
                                    <div className="flex space-x-2">
                                        {request.executed ? (
                                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                                                Executed
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                                                Pending
                                            </span>
                                        )}
                                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                                            {request.approvers.length} /{" "}
                                            {contractData?.[2]?.result?.toString() ||
                                                "?"}{" "}
                                            Approvals
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Fundraiser ID
                                        </p>
                                        <p className="text-gray-900 dark:text-white">
                                            {request.fundraiserId}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Recipient
                                        </p>
                                        <p className="text-gray-900 dark:text-white truncate">
                                            {request.to}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Amount
                                        </p>
                                        <p className="text-gray-900 dark:text-white">
                                            {formatEther(request.amount)} ETH
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Reason
                                        </p>
                                        <p className="text-gray-900 dark:text-white">
                                            {request.reason}
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t dark:border-gray-700 pt-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                        Approvers ({request.approvers.length})
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {request.approvers.map(
                                            (approver, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                                                    {approver.substring(0, 6)}
                                                    ...
                                                    {approver.substring(
                                                        approver.length - 4
                                                    )}
                                                </span>
                                            )
                                        )}
                                        {request.approvers.length === 0 && (
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                No approvers yet
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {!request.executed && isOwner && (
                                    <div className="mt-4 flex space-x-2">
                                        <button
                                            onClick={() =>
                                                handleApprove(request.id)
                                            }
                                            disabled={
                                                isConfirming ||
                                                request.approvers.includes(
                                                    address || ""
                                                )
                                            }
                                            className={`px-3 py-1 rounded text-sm text-white ${
                                                isConfirming ||
                                                request.approvers.includes(
                                                    address || ""
                                                )
                                                    ? "bg-gray-400 cursor-not-allowed"
                                                    : "bg-blue-500 hover:bg-blue-600"
                                            }`}>
                                            {request.approvers.includes(
                                                address || ""
                                            )
                                                ? "Approved"
                                                : "Approve"}
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleExecute(request.id)
                                            }
                                            disabled={
                                                isConfirming ||
                                                request.approvers.length <
                                                    Number(
                                                        contractData?.[2]
                                                            ?.result || 0
                                                    )
                                            }
                                            className={`px-3 py-1 rounded text-sm text-white ${
                                                isConfirming ||
                                                request.approvers.length <
                                                    Number(
                                                        contractData?.[2]
                                                            ?.result || 0
                                                    )
                                                    ? "bg-gray-400 cursor-not-allowed"
                                                    : "bg-green-500 hover:bg-green-600"
                                            }`}>
                                            Execute
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
