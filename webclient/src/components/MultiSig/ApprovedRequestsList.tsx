"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";

// Define types
interface MultiSigTransaction {
    id: number;
    title: string;
    fundraiserId: number;
    fundraiserName: string;
    amount: string;
    recipient: string;
    approvals: number;
    requiredApprovals: number;
    status: "pending" | "completed" | "cancelled";
    approvers: string[];
    hasApproved: boolean;
    createdAt: Date;
    completedAt?: Date;
}

interface ApprovedRequestsListProps {
    type: "pending" | "completed";
}

export default function ApprovedRequestsList({
    type,
}: ApprovedRequestsListProps) {
    const [transactions, setTransactions] = useState<MultiSigTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const { address } = useAccount();

    // Track approval status for UI
    const [approvingStatus, setApprovingStatus] = useState<{
        [key: number]: boolean;
    }>({});
    const [executingStatus, setExecutingStatus] = useState<{
        [key: number]: boolean;
    }>({});

    // Mock function to fetch transactions - would be replaced with actual contract calls
    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);

            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Mock data - in a real app, this would be fetched from the contract
            const mockTransactions: MultiSigTransaction[] = [
                {
                    id: 1,
                    title: "Community Garden Milestone 1",
                    fundraiserId: 1,
                    fundraiserName: "Community Garden Project",
                    amount: "0.5",
                    recipient: "0x1234...5678",
                    approvals: 1,
                    requiredApprovals: 2,
                    status: "pending",
                    approvers: ["0x5678...9012"],
                    hasApproved: false,
                    createdAt: new Date(Date.now() - 86400000), // 1 day ago
                },
                {
                    id: 2,
                    title: "Clean Water Initiative Phase 1",
                    fundraiserId: 2,
                    fundraiserName: "Clean Water Project",
                    amount: "1.2",
                    recipient: "0x2345...6789",
                    approvals: 2,
                    requiredApprovals: 2,
                    status: "pending",
                    approvers: ["0x5678...9012", "0x3456...7890"],
                    hasApproved: true,
                    createdAt: new Date(Date.now() - 172800000), // 2 days ago
                },
                {
                    id: 3,
                    title: "Education Outreach Materials",
                    fundraiserId: 3,
                    fundraiserName: "Tech Education for Kids",
                    amount: "0.8",
                    recipient: "0x3456...7890",
                    approvals: 3,
                    requiredApprovals: 2,
                    status: "completed",
                    approvers: [
                        "0x5678...9012",
                        "0x3456...7890",
                        "0x7890...1234",
                    ],
                    hasApproved: true,
                    createdAt: new Date(Date.now() - 259200000), // 3 days ago
                    completedAt: new Date(Date.now() - 172800000), // 2 days ago
                },
                {
                    id: 4,
                    title: "Wildlife Conservation Equipment",
                    fundraiserId: 4,
                    fundraiserName: "Wildlife Conservation",
                    amount: "1.5",
                    recipient: "0x4567...8901",
                    approvals: 2,
                    requiredApprovals: 2,
                    status: "completed",
                    approvers: ["0x5678...9012", "0x7890...1234"],
                    hasApproved: false,
                    createdAt: new Date(Date.now() - 345600000), // 4 days ago
                    completedAt: new Date(Date.now() - 259200000), // 3 days ago
                },
            ];

            // Filter based on the selected tab
            const filteredTransactions = mockTransactions.filter((tx) =>
                type === "pending"
                    ? tx.status === "pending"
                    : tx.status === "completed"
            );

            setTransactions(filteredTransactions);
            setLoading(false);
        };

        fetchTransactions();
    }, [type]);

    // Mock function to approve a transaction - would be replaced with contract calls
    const approveTransaction = async (txId: number) => {
        setApprovingStatus((prev) => ({ ...prev, [txId]: true }));

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Update the transaction with the new approval
        setTransactions((prevTx) =>
            prevTx.map((tx) => {
                if (tx.id === txId) {
                    const updatedTx = {
                        ...tx,
                        approvals: tx.approvals + 1,
                        hasApproved: true,
                        approvers: [
                            ...tx.approvers,
                            address?.slice(0, 6) + "..." + address?.slice(-4) ||
                                "",
                        ],
                    };

                    // If enough approvals, mark as ready to execute
                    if (updatedTx.approvals >= updatedTx.requiredApprovals) {
                        updatedTx.status = "pending"; // Still pending until executed
                    }

                    return updatedTx;
                }
                return tx;
            })
        );

        setApprovingStatus((prev) => ({ ...prev, [txId]: false }));
        console.log(`Approved transaction #${txId}`);
    };

    // Mock function to execute a transaction - would be replaced with contract calls
    const executeTransaction = async (txId: number) => {
        setExecutingStatus((prev) => ({ ...prev, [txId]: true }));

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Update the transaction status to completed
        setTransactions((prevTx) =>
            prevTx.map((tx) => {
                if (tx.id === txId) {
                    return {
                        ...tx,
                        status: "completed",
                        completedAt: new Date(),
                    };
                }
                return tx;
            })
        );

        setExecutingStatus((prev) => ({ ...prev, [txId]: false }));
        console.log(`Executed transaction #${txId}`);

        // Remove from the list if we're viewing pending transactions
        if (type === "pending") {
            setTimeout(() => {
                setTransactions((prevTx) =>
                    prevTx.filter((tx) => tx.id !== txId)
                );
            }, 1000);
        }
    };

    // Format addresses for display
    const formatAddress = (address: string) => {
        if (address.includes("...")) return address;
        return address.slice(0, 6) + "..." + address.slice(-4);
    };

    return (
        <div>
            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                        No {type} transactions found.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {transactions.map((tx) => (
                        <div
                            key={tx.id}
                            className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                            {tx.title}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Transaction ID: #{tx.id} •
                                            Fundraiser: {tx.fundraiserName}
                                        </p>
                                    </div>
                                    <div className="flex items-center">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${
                                                tx.status === "pending"
                                                    ? tx.approvals >=
                                                      tx.requiredApprovals
                                                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                                                        : "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                                                    : "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                                            }`}>
                                            {tx.status === "pending"
                                                ? tx.approvals >=
                                                  tx.requiredApprovals
                                                    ? "Ready to Execute"
                                                    : "Awaiting Approvals"
                                                : "Completed"}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Amount
                                        </p>
                                        <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                            {tx.amount} ETH
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Recipient
                                        </p>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {tx.recipient}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                        Approvals: {tx.approvals} of{" "}
                                        {tx.requiredApprovals} required
                                    </p>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                        <div
                                            className={`h-2.5 rounded-full ${
                                                tx.approvals >=
                                                tx.requiredApprovals
                                                    ? "bg-green-600 dark:bg-green-500"
                                                    : "bg-blue-600 dark:bg-blue-500"
                                            }`}
                                            style={{
                                                width: `${
                                                    (tx.approvals /
                                                        tx.requiredApprovals) *
                                                    100
                                                }%`,
                                            }}></div>
                                    </div>
                                </div>

                                {tx.approvers.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                            Approved by:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {tx.approvers.map(
                                                (approver, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                        {formatAddress(
                                                            approver
                                                        )}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                                {tx.status === "completed" &&
                                    tx.completedAt && (
                                        <div className="mt-4">
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Completed on
                                            </p>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {tx.completedAt.toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}

                                {/* Action buttons for pending transactions */}
                                {tx.status === "pending" && (
                                    <div className="mt-6 flex justify-end space-x-4">
                                        {!tx.hasApproved && (
                                            <button
                                                onClick={() =>
                                                    approveTransaction(tx.id)
                                                }
                                                disabled={
                                                    approvingStatus[tx.id]
                                                }
                                                className="px-4 py-2 border rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                                {approvingStatus[tx.id] ? (
                                                    <span className="flex items-center">
                                                        <svg
                                                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                                                        Approving...
                                                    </span>
                                                ) : (
                                                    "Approve"
                                                )}
                                            </button>
                                        )}

                                        {tx.approvals >=
                                            tx.requiredApprovals && (
                                            <button
                                                onClick={() =>
                                                    executeTransaction(tx.id)
                                                }
                                                disabled={
                                                    executingStatus[tx.id]
                                                }
                                                className="px-4 py-2 border rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                                {executingStatus[tx.id] ? (
                                                    <span className="flex items-center">
                                                        <svg
                                                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                                                        Executing...
                                                    </span>
                                                ) : (
                                                    "Execute Transaction"
                                                )}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
