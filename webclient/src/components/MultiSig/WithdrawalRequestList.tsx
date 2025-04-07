"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import {
    useReadContract,
    useWriteContract,
    useWaitForTransactionReceipt,
} from "wagmi";
import { formatEther } from "viem";
import { FundAllocationABI } from "../../abi/FundAllocationABI";
import { formatEthereumAddress } from "@/lib/addressUtils";
import { MULTISIG_CONTRACT_ADDRESS } from "@/constants/addresses";

interface WithdrawalRequestListProps {
    type: "pending" | "completed";
}

interface WithdrawalRequest {
    id: number;
    fundraiserId: number;
    amount: bigint;
    to: string;
    reason: string;
    executed: boolean;
    approvers: string[];
    approvalCount: number;
}

export default function WithdrawalRequestList({
    type,
}: WithdrawalRequestListProps) {
    const { address } = useAccount();
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [requiredApprovals, setRequiredApprovals] = useState<number>(2);

    // Contract writes
    const {
        data: approveHash,
        isPending: isApproving,
        writeContract: approveRequest,
    } = useWriteContract();
    const {
        data: executeHash,
        isPending: isExecuting,
        writeContract: executeRequest,
    } = useWriteContract();

    // Transaction receipts
    const { isLoading: isConfirmingApprove } = useWaitForTransactionReceipt({
        hash: approveHash,
    });

    const { isLoading: isConfirmingExecute } = useWaitForTransactionReceipt({
        hash: executeHash,
    });

    // Get required approvals
    const { data: requiredApprovalsData } = useReadContract({
        address: MULTISIG_CONTRACT_ADDRESS as `0x${string}`,
        abi: FundAllocationABI,
        functionName: "required",
    });

    // Get total withdrawal requests count
    const { data: withdrawalRequestCount } = useReadContract({
        address: MULTISIG_CONTRACT_ADDRESS as `0x${string}`,
        abi: FundAllocationABI,
        functionName: "getWithdrawalRequestCount",
    });

    // Load withdrawal requests
    useEffect(() => {
        const fetchRequests = async () => {
            try {
                setLoading(true);

                if (withdrawalRequestCount && requiredApprovalsData) {
                    const count = Number(withdrawalRequestCount);
                    setRequiredApprovals(Number(requiredApprovalsData));

                    const tempRequests: WithdrawalRequest[] = [];

                    for (let i = 0; i < count; i++) {
                        try {
                            // Get request details
                            const requestDetails = await fetchRequestDetails(i);

                            // Filter based on type
                            if (
                                (type === "pending" &&
                                    !requestDetails.executed) ||
                                (type === "completed" &&
                                    requestDetails.executed)
                            ) {
                                tempRequests.push(requestDetails);
                            }
                        } catch (err) {
                            console.error(`Error fetching request ${i}:`, err);
                        }
                    }

                    setRequests(tempRequests);
                } else if (!withdrawalRequestCount) {
                    // Fallback to mock data
                    provideMockData();
                }
            } catch (err) {
                console.error("Error fetching withdrawal requests:", err);
                setError(
                    "Failed to load withdrawal requests. Please try again."
                );
                provideMockData();
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [
        withdrawalRequestCount,
        requiredApprovalsData,
        type,
        address,
        approveHash,
        executeHash,
    ]);

    // Fetch individual request details
    const fetchRequestDetails = async (
        requestId: number
    ): Promise<WithdrawalRequest> => {
        // Get transaction details
        const requestData: any = await fetch(
            `/api/read-contract?address=${MULTISIG_CONTRACT_ADDRESS}&function=getWithdrawalRequest&args=${requestId}`
        )
            .then((res) => res.json())
            .then((data) => data.result);

        if (!requestData) {
            throw new Error(`Failed to fetch details for request ${requestId}`);
        }

        // Get approvers for this request
        const approversData: any = await fetch(
            `/api/read-contract?address=${MULTISIG_CONTRACT_ADDRESS}&function=getApprovers&args=${requestId}`
        )
            .then((res) => res.json())
            .then((data) => data.result);

        return {
            id: requestId,
            fundraiserId: Number(requestData.fundraiserId),
            amount: BigInt(requestData.amount),
            to: requestData.to,
            reason: requestData.reason || "Withdrawal request",
            executed: requestData.executed,
            approvers: approversData || [],
            approvalCount: approversData ? approversData.length : 0,
        };
    };

    // Provide mock data if needed
    const provideMockData = () => {
        if (type === "pending") {
            setRequests([
                {
                    id: 0,
                    fundraiserId: 1,
                    amount: BigInt(1000000000000000000), // 1 ETH
                    to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                    reason: "Operating expenses",
                    executed: false,
                    approvers: address ? [address] : [],
                    approvalCount: address ? 1 : 0,
                },
                {
                    id: 2,
                    fundraiserId: 3,
                    amount: BigInt(500000000000000000), // 0.5 ETH
                    to: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
                    reason: "Marketing campaign",
                    executed: false,
                    approvers: [],
                    approvalCount: 0,
                },
            ]);
        } else {
            setRequests([
                {
                    id: 1,
                    fundraiserId: 2,
                    amount: BigInt(2000000000000000000), // 2 ETH
                    to: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
                    reason: "Team salaries",
                    executed: true,
                    approvers: [
                        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                    ],
                    approvalCount: 2,
                },
            ]);
        }
    };

    // Handle approve button click
    const handleApprove = async (requestId: number) => {
        if (!address) return;

        try {
            setProcessingId(requestId);
            approveRequest({
                address: MULTISIG_CONTRACT_ADDRESS as `0x${string}`,
                abi: FundAllocationABI,
                functionName: "approveWithdrawalRequest",
                args: [BigInt(requestId)],
            });
        } catch (err) {
            console.error("Error approving request:", err);
            setError("Failed to approve request. Please try again.");
            setProcessingId(null);
        }
    };

    // Handle execute button click
    const handleExecute = async (requestId: number) => {
        if (!address) return;

        try {
            setProcessingId(requestId);
            executeRequest({
                address: MULTISIG_CONTRACT_ADDRESS as `0x${string}`,
                abi: FundAllocationABI,
                functionName: "executeWithdrawalRequest",
                args: [BigInt(requestId)],
            });
        } catch (err) {
            console.error("Error executing request:", err);
            setError("Failed to execute request. Please try again.");
            setProcessingId(null);
        }
    };

    const isProcessing = (requestId: number) => {
        return (
            processingId === requestId &&
            (isApproving ||
                isConfirmingApprove ||
                isExecuting ||
                isConfirmingExecute)
        );
    };

    const canApprove = (request: WithdrawalRequest) => {
        if (!address) return false;
        return !request.executed && !request.approvers.includes(address);
    };

    const canExecute = (request: WithdrawalRequest) => {
        return !request.executed && request.approvalCount >= requiredApprovals;
    };

    const hasApproved = (request: WithdrawalRequest) => {
        if (!address) return false;
        return request.approvers.includes(address);
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                        <div className="mt-4 flex justify-end">
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900 border-l-4 border-red-500 p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg
                            className="h-5 w-5 text-red-400"
                            viewBox="0 0 20 20"
                            fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700 dark:text-red-200">
                            {error}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="text-center py-6">
                <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    No {type} withdrawal requests
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {type === "pending"
                        ? "There are no pending withdrawal requests waiting for approval."
                        : "There are no completed withdrawal requests to display."}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {requests.map((request) => (
                <div
                    key={request.id}
                    className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                Withdrawal Request #{request.id}
                            </h3>
                            <div className="flex space-x-2">
                                {request.executed ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        Executed
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                        Pending
                                    </span>
                                )}
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    Fundraiser #{request.fundraiserId}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-5 sm:px-6">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Amount
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {formatEther(request.amount)} ETH
                                </dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Recipient
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {formatEthereumAddress(request.to)}
                                </dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Reason
                                </dt>
                                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {request.reason}
                                </dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Approvals ({request.approvalCount}/
                                    {requiredApprovals})
                                </dt>
                                <dd className="mt-1">
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full"
                                            style={{
                                                width: `${
                                                    (request.approvalCount /
                                                        requiredApprovals) *
                                                    100
                                                }%`,
                                            }}></div>
                                    </div>
                                </dd>
                                <dd className="mt-2 text-sm text-gray-900 dark:text-white">
                                    {request.approvers.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {request.approvers.map(
                                                (approver, index) => (
                                                    <span
                                                        key={index}
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            approver.toLowerCase() ===
                                                            address?.toLowerCase()
                                                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                                        }`}>
                                                        {formatEthereumAddress(
                                                            approver
                                                        )}
                                                        {approver.toLowerCase() ===
                                                            address?.toLowerCase() &&
                                                            " (You)"}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    ) : (
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            No approvals yet
                                        </p>
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </div>
                    <div className="px-4 py-4 sm:px-6 bg-gray-50 dark:bg-gray-900 flex justify-end space-x-3">
                        {!request.executed && (
                            <>
                                {canApprove(request) && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleApprove(request.id)
                                        }
                                        disabled={isProcessing(request.id)}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isProcessing(request.id) ? (
                                            <>
                                                <svg
                                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24">
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"></circle>
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing...
                                            </>
                                        ) : (
                                            "Approve"
                                        )}
                                    </button>
                                )}

                                {hasApproved(request) && (
                                    <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-700 dark:text-green-300">
                                        <svg
                                            className="mr-1.5 h-4 w-4 text-green-500"
                                            fill="currentColor"
                                            viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        You've approved
                                    </span>
                                )}

                                {canExecute(request) && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleExecute(request.id)
                                        }
                                        disabled={isProcessing(request.id)}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isProcessing(request.id) ? (
                                            <>
                                                <svg
                                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24">
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"></circle>
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing...
                                            </>
                                        ) : (
                                            "Execute"
                                        )}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
