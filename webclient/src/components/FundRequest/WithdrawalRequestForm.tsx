"use client";

import { useState, useEffect } from "react";
import { parseEther } from "viem";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

// This would be imported from your contract configuration in a real app
const contractConfig = {
    address: "0x1234567890123456789012345678901234567890" as `0x${string}`, // Fund Request contract address
    abi: [
        {
            name: "createWithdrawalRequest",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
                { name: "fundraiserId", type: "uint256" },
                { name: "reason", type: "string" },
                { name: "amount", type: "uint256" },
            ],
            outputs: [{ name: "requestId", type: "uint256" }],
        },
    ],
};

interface WithdrawalRequestFormProps {
    fundraiserId: number;
    onSuccess?: () => void;
}

export default function WithdrawalRequestForm({
    fundraiserId,
    onSuccess,
}: WithdrawalRequestFormProps) {
    // Form state
    const [reason, setReason] = useState("");
    const [amount, setAmount] = useState("");
    const [errors, setErrors] = useState<{
        reason?: string;
        amount?: string;
    }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Contract interaction for creating withdrawal request
    const {
        writeContract,
        data: txHash,
        error: writeError,
        isPending: isWritePending,
    } = useWriteContract();

    // Wait for transaction to be mined
    const { isLoading: isWaitLoading, isSuccess } =
        useWaitForTransactionReceipt({
            hash: txHash,
        });

    // Handle transaction success
    useEffect(() => {
        if (isSuccess && txHash) {
            setSuccessMessage(
                "Your withdrawal request has been created successfully!"
            );
            setReason("");
            setAmount("");
            setIsSubmitting(false);
            if (onSuccess) onSuccess();
        }
    }, [isSuccess, txHash, onSuccess]);

    // Handle form input errors
    useEffect(() => {
        if (writeError) {
            console.error("Write error:", writeError);
            setErrorMessage(
                "Error creating withdrawal request: " + writeError.message
            );
            setIsSubmitting(false);
        }
    }, [writeError]);

    // Validate form inputs
    const validateForm = (): boolean => {
        const newErrors: {
            reason?: string;
            amount?: string;
        } = {};

        if (!reason.trim()) {
            newErrors.reason = "Reason is required";
        }

        if (!amount.trim()) {
            newErrors.amount = "Amount is required";
        } else if (isNaN(Number(amount)) || Number(amount) <= 0) {
            newErrors.amount = "Amount must be a positive number";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            // In a production app, this would call the actual contract
            writeContract({
                ...contractConfig,
                functionName: "createWithdrawalRequest",
                args: [BigInt(fundraiserId), reason, parseEther(amount)],
            });
        } catch (error) {
            console.error("Error submitting withdrawal request:", error);
            setErrorMessage(
                "There was an error creating your withdrawal request. Please try again."
            );
            setIsSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6">
            {/* Reason field */}
            <div>
                <label
                    htmlFor="reason"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Reason for Withdrawal
                </label>
                <div className="mt-1">
                    <textarea
                        id="reason"
                        name="reason"
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Explain why you need these funds and how they will be used"
                        className={`shadow-sm block w-full sm:text-sm rounded-md ${
                            errors.reason
                                ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
                                : "border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        }`}
                        disabled={isSubmitting}
                    />
                    {errors.reason && (
                        <p className="mt-2 text-sm text-red-600">
                            {errors.reason}
                        </p>
                    )}
                </div>
            </div>

            {/* Amount field */}
            <div>
                <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount (ETH)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                        type="text"
                        name="amount"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.0"
                        className={`block w-full pr-12 sm:text-sm rounded-md ${
                            errors.amount
                                ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
                                : "border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        }`}
                        disabled={isSubmitting}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">ETH</span>
                    </div>
                </div>
                {errors.amount && (
                    <p className="mt-2 text-sm text-red-600">{errors.amount}</p>
                )}
            </div>

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

            {/* Submit button */}
            <div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        isSubmitting
                            ? "bg-blue-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    }`}>
                    {isSubmitting || isWritePending || isWaitLoading ? (
                        <>
                            <svg
                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                            Submitting...
                        </>
                    ) : (
                        "Submit Withdrawal Request"
                    )}
                </button>
            </div>
        </form>
    );
}
