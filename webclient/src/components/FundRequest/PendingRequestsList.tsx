"use client";

import { useState, useEffect } from "react";
import {
    useAccount,
    useContractReads,
    useWriteContract,
    useWaitForTransactionReceipt,
    useReadContract,
} from "wagmi";
import { formatEther } from "viem";
import { FUND_ALLOCATION_ADDRESS } from "../../../config/wagmi";
import { fundAllocationABI } from "@/contracts/abis";

interface WithdrawalRequest {
    id: number;
    fundraiserId: number;
    fundraiserName: string;
    reason: string;
    amount: bigint;
    timestamp: bigint;
    createdBy: string;
    approvals: number;
    rejections: number;
    status: "Pending" | "Approved" | "Rejected" | "Executed";
    hasVoted: boolean;
    voteType?: "Approve" | "Reject";
}

// This would be imported from your contract configuration in a real app
const contractConfig = {
    address: "0x1234567890123456789012345678901234567890" as `0x${string}`, // Fund Request contract address
    abi: [
        {
            name: "voteOnRequest",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
                { name: "requestId", type: "uint256" },
                { name: "approve", type: "bool" },
            ],
            outputs: [],
        },
        {
            name: "isDAOMember",
            type: "function",
            stateMutability: "view",
            inputs: [{ name: "account", type: "address" }],
            outputs: [{ name: "isActive", type: "bool" }],
        },
    ],
};

export default function PendingRequestsList() {
    const { address, isConnected } = useAccount();
    const [pendingRequests, setPendingRequests] = useState<WithdrawalRequest[]>(
        []
    );
    const [isLoading, setIsLoading] = useState(true);
    const [activeVotes, setActiveVotes] = useState<Record<number, boolean>>({});
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Check if user is a DAO member
    const { data: isValidator } = useReadContract({
        ...contractConfig,
        functionName: "isDAOMember",
        args: address ? [address as `0x${string}`] : undefined,
    });

    // Contract interaction for voting
    const {
        writeContract,
        data: txHash,
        error: writeError,
        isPending: isWritePending,
    } = useWriteContract();

    // Wait for transaction to be mined
    const { isLoading: isWaitLoading, isSuccess: isVoteSuccess } =
        useWaitForTransactionReceipt({
            hash: txHash,
        });

    // Get request count from contract
    const { data: requestCount } = useContractReads({
        contracts: [
            {
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "getWithdrawalRequestCount",
            },
        ],
    });

    // Load requests from contract
    useEffect(() => {
        // For demo purposes, we'll use mock data
        // In a real app, you would fetch from the contract based on requestCount

        const mockRequests: WithdrawalRequest[] = [
            {
                id: 0,
                fundraiserId: 1,
                fundraiserName: "Tech Education for Kids",
                reason: "Purchase of laptops for coding classes",
                amount: BigInt("1000000000000000000"), // 1 ETH
                timestamp: BigInt(Math.floor(Date.now() / 1000) - 86400), // 1 day ago
                createdBy: "0x1234...5678",
                approvals: 2,
                rejections: 1,
                status: "Pending",
                hasVoted: false,
            },
            {
                id: 1,
                fundraiserId: 0,
                fundraiserName: "Community Garden Project",
                reason: "Purchasing seeds and gardening tools",
                amount: BigInt("500000000000000000"), // 0.5 ETH
                timestamp: BigInt(Math.floor(Date.now() / 1000) - 43200), // 12 hours ago
                createdBy: "0x2345...6789",
                approvals: 3,
                rejections: 0,
                status: "Pending",
                hasVoted: true,
                voteType: "Approve",
            },
            {
                id: 2,
                fundraiserId: 2,
                fundraiserName: "Clean Water Initiative",
                reason: "Installation of water filtration system",
                amount: BigInt("2000000000000000000"), // 2 ETH
                timestamp: BigInt(Math.floor(Date.now() / 1000) - 21600), // 6 hours ago
                createdBy: "0x3456...7890",
                approvals: 1,
                rejections: 2,
                status: "Pending",
                hasVoted: false,
            },
        ];

        setPendingRequests(mockRequests);
        setIsLoading(false);
    }, [requestCount, address]);

    // Handle votes
    const handleVote = async (requestId: number, approve: boolean) => {
        setErrorMessage("");
        setSuccessMessage("");

        try {
            setActiveVotes((prev) => ({ ...prev, [requestId]: true }));

            // Call the contract function
            await writeContract({
                ...contractConfig,
                functionName: "voteOnRequest",
                args: [BigInt(requestId), approve],
            });
        } catch (error) {
            console.error("Error voting on request:", error);
            setErrorMessage(
                `Failed to submit vote: ${
                    (error as Error).message || "Unknown error"
                }`
            );
            setActiveVotes((prev) => ({ ...prev, [requestId]: false }));
        }
    };

    // Handle transaction success
    useEffect(() => {
        if (isVoteSuccess && txHash) {
            setSuccessMessage("Your vote has been recorded successfully!");
            // Update the UI to show that the user has voted
            // In a real app, we would reload the data from the contract
            setPendingRequests((prev) =>
                prev.map((request) => {
                    if (activeVotes[request.id]) {
                        return { ...request, hasVoted: true };
                    }
                    return request;
                })
            );
            setActiveVotes({});
        }
    }, [isVoteSuccess, txHash, activeVotes]);

    // Handle transaction error
    useEffect(() => {
        if (writeError) {
            console.error("Error submitting vote:", writeError);
            setErrorMessage(`Failed to submit vote: ${writeError.message}`);
            setActiveVotes({});
        }
    }, [writeError]);

    // Format timestamp to readable date
    const formatDate = (timestamp: bigint) => {
        const date = new Date(Number(timestamp) * 1000);
        return date.toLocaleString();
    };

    // Format address for display
    const formatAddress = (address: string) => {
        if (address.length <= 10) return address;
        return `${address.substring(0, 6)}...${address.substring(
            address.length - 4
        )}`;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-32">
                <svg
                    className="animate-spin h-5 w-5 text-blue-500"
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
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                    Loading requests...
                </span>
            </div>
        );
    }

    // Check if user is a DAO member
    const isDAOMember = !!isValidator;

    if (!isDAOMember) {
        return (
            <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg
                            className="h-5 w-5 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"></path>
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Access Restricted
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                            <p>
                                Only DAO members can view and vote on pending
                                withdrawal requests.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (pendingRequests.length === 0) {
        return (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md text-center">
                <p className="text-gray-500 dark:text-gray-400">
                    There are no pending withdrawal requests at this time.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Success/Error messages */}
            {successMessage && (
                <div className="rounded-md bg-green-50 dark:bg-green-900 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg
                                className="h-5 w-5 text-green-400"
                                fill="currentColor"
                                viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                {successMessage}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {errorMessage && (
                <div className="rounded-md bg-red-50 dark:bg-red-900 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg
                                className="h-5 w-5 text-red-400"
                                fill="currentColor"
                                viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">
                                {errorMessage}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Pending requests list */}
            <div className="overflow-hidden rounded-lg shadow">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {pendingRequests.map((request) => (
                        <li
                            key={request.id}
                            className="p-4 bg-white dark:bg-gray-800">
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                            {request.fundraiserName}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Request #{request.id} • Created{" "}
                                            {formatDate(request.timestamp)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                            {request.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                        Reason for request:
                                    </p>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                        {request.reason}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            Amount
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {formatEther(request.amount)} ETH
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            Requested by
                                        </p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {formatAddress(request.createdBy)}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            Current votes
                                        </p>
                                        <div className="flex space-x-2 mt-1">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                {request.approvals} Approve
                                            </span>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                {request.rejections} Reject
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {!request.hasVoted && (
                                    <div className="flex justify-end space-x-2">
                                        <button
                                            onClick={() =>
                                                handleVote(request.id, false)
                                            }
                                            disabled={
                                                activeVotes[request.id] ||
                                                isWritePending
                                            }
                                            className={`px-3 py-1 border border-red-300 text-red-700 rounded-md ${
                                                activeVotes[request.id]
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : "hover:bg-red-50 dark:hover:bg-red-900"
                                            } dark:border-red-700 dark:text-red-400`}>
                                            Reject
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleVote(request.id, true)
                                            }
                                            disabled={
                                                activeVotes[request.id] ||
                                                isWritePending
                                            }
                                            className={`px-3 py-1 bg-green-600 text-white rounded-md ${
                                                activeVotes[request.id]
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : "hover:bg-green-700"
                                            }`}>
                                            Approve
                                        </button>
                                    </div>
                                )}

                                {request.hasVoted && (
                                    <div className="flex justify-end">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                            You've already voted on this request
                                        </span>
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
