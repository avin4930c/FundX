"use client";

import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { FUND_ALLOCATION_ADDRESS } from "../../../config/wagmi";
import { fundAllocationABI } from "@/contracts/abis";

interface FundraiserFormProps {
    onSuccess: () => void;
    isSubmitting: boolean;
    setIsSubmitting: (isSubmitting: boolean) => void;
}

export default function FundraiserForm({
    onSuccess,
    isSubmitting,
    setIsSubmitting,
}: FundraiserFormProps) {
    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        targetAmount: "",
        duration: "30", // Default 30 days
    });

    // Form errors
    const [errors, setErrors] = useState<{
        name?: string;
        description?: string;
        targetAmount?: string;
        duration?: string;
    }>({});

    // Success/error messages
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Contract write hook for the createFundraiser function
    const { writeContract, data: hash } = useWriteContract();

    // Wait for transaction hook
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt(
        {
            hash,
        }
    );

    // Handle transaction success/error
    useEffect(() => {
        if (isSuccess && hash) {
            setSuccessMessage(
                "Fundraiser created successfully! You will be redirected to the homepage in a moment."
            );

            // Clear form data
            setFormData({
                name: "",
                description: "",
                targetAmount: "",
                duration: "30",
            });

            setIsSubmitting(false);

            // Show success message for 3 seconds before redirecting
            // This gives the blockchain time to update and ensures the dashboard will display the new fundraiser
            setTimeout(() => {
                console.log(
                    "Redirecting to homepage after successful fundraiser creation"
                );
                onSuccess();
            }, 3000);
        }
    }, [isSuccess, hash, onSuccess]);

    // Handle form input changes
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        // Clear error when field is edited
        if (errors[name as keyof typeof errors]) {
            setErrors({
                ...errors,
                [name]: undefined,
            });
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors: {
            name?: string;
            description?: string;
            targetAmount?: string;
            duration?: string;
        } = {};

        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        }

        if (!formData.description.trim()) {
            newErrors.description = "Description is required";
        }

        if (!formData.targetAmount) {
            newErrors.targetAmount = "Target amount is required";
        } else if (
            isNaN(parseFloat(formData.targetAmount)) ||
            parseFloat(formData.targetAmount) <= 0
        ) {
            newErrors.targetAmount = "Target amount must be a positive number";
        }

        if (!formData.duration) {
            newErrors.duration = "Duration is required";
        } else if (
            isNaN(parseInt(formData.duration)) ||
            parseInt(formData.duration) <= 0
        ) {
            newErrors.duration = "Duration must be a positive number of days";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Reset messages
        setSuccessMessage("");
        setErrorMessage("");

        // Validate form
        if (!validateForm()) {
            return;
        }

        try {
            setIsSubmitting(true);

            // Validate contract address
            if (!FUND_ALLOCATION_ADDRESS || FUND_ALLOCATION_ADDRESS === "") {
                throw new Error(
                    "Contract address is not configured. Please check your environment variables."
                );
            }

            // Convert form values to appropriate types for the contract call
            const targetAmountInWei = parseEther(formData.targetAmount);
            const durationInDays = BigInt(parseInt(formData.duration));

            console.log("Creating fundraiser with data:", {
                name: formData.name,
                description: formData.description,
                targetAmount: formData.targetAmount,
                targetAmountWei: targetAmountInWei.toString(),
                durationDays: durationInDays.toString(),
                contractAddress: FUND_ALLOCATION_ADDRESS,
            });

            // Call the contract
            const tx = await writeContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "createFundraiser",
                args: [
                    formData.name,
                    formData.description,
                    targetAmountInWei,
                    durationInDays,
                ],
            });

            console.log("Transaction submitted with hash:", tx);
            console.log("Waiting for confirmation");
            // Transaction submitted - metamask will prompt for confirmation
            // The rest is handled by useWaitForTransaction
        } catch (error) {
            console.error("Error submitting transaction:", error);
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            // Give user a more helpful error message
            if (errorMessage.includes("user rejected")) {
                setErrorMessage("Transaction was rejected in your wallet");
            } else if (errorMessage.includes("insufficient funds")) {
                setErrorMessage(
                    "You don't have enough ETH in your wallet for this transaction"
                );
            } else {
                setErrorMessage(
                    `Failed to submit transaction: ${errorMessage}`
                );
            }

            setIsSubmitting(false);
        }
    };

    // Loading state during transaction confirmation
    const isLoading = isSubmitting || isConfirming;

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6">
            {/* Success message */}
            {successMessage && (
                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-md">
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

            {/* Error message */}
            {errorMessage && (
                <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md">
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

            {/* Fundraiser Name */}
            <div>
                <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fundraiser Name
                </label>
                <div className="mt-1">
                    <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md ${
                            errors.name ? "border-red-300" : ""
                        }`}
                        placeholder="Community Garden Project"
                        disabled={isLoading}
                    />
                    {errors.name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {errors.name}
                        </p>
                    )}
                </div>
            </div>

            {/* Description */}
            <div>
                <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                </label>
                <div className="mt-1">
                    <textarea
                        id="description"
                        name="description"
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md ${
                            errors.description ? "border-red-300" : ""
                        }`}
                        placeholder="Describe your fundraiser and what you plan to do with the funds..."
                        disabled={isLoading}
                    />
                    {errors.description && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {errors.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Target Amount */}
            <div>
                <label
                    htmlFor="targetAmount"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Target Amount (ETH)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                        type="number"
                        name="targetAmount"
                        id="targetAmount"
                        value={formData.targetAmount}
                        onChange={handleChange}
                        step="0.01"
                        min="0.01"
                        className={`focus:ring-blue-500 focus:border-blue-500 block w-full pr-12 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md ${
                            errors.targetAmount ? "border-red-300" : ""
                        }`}
                        placeholder="1.00"
                        disabled={isLoading}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                            ETH
                        </span>
                    </div>
                </div>
                {errors.targetAmount && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.targetAmount}
                    </p>
                )}
            </div>

            {/* Duration */}
            <div>
                <label
                    htmlFor="duration"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Duration (Days)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                        type="number"
                        name="duration"
                        id="duration"
                        value={formData.duration}
                        onChange={handleChange}
                        min="1"
                        max="365"
                        step="1"
                        className={`focus:ring-blue-500 focus:border-blue-500 block w-full pr-12 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md ${
                            errors.duration ? "border-red-300" : ""
                        }`}
                        placeholder="30"
                        disabled={isLoading}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                            Days
                        </span>
                    </div>
                </div>
                {errors.duration && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.duration}
                    </p>
                )}
            </div>

            {/* Submit Button */}
            <div>
                <button
                    type="submit"
                    disabled={isLoading || isSuccess}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${
                isLoading || isSuccess
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            }
          `}>
                    {isLoading ? (
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
                            {isConfirming
                                ? "Confirming Transaction..."
                                : "Creating Fundraiser..."}
                        </>
                    ) : isSuccess ? (
                        "Fundraiser Created!"
                    ) : (
                        "Create Fundraiser"
                    )}
                </button>
            </div>

            {/* Transaction Hash */}
            {hash && (
                <div className="mt-3 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Transaction Hash:
                        <a
                            href={`https://sepolia.etherscan.io/tx/${hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                            {`${hash.substring(0, 6)}...${hash.substring(
                                hash.length - 4
                            )}`}
                        </a>
                    </p>
                </div>
            )}
        </form>
    );
}
