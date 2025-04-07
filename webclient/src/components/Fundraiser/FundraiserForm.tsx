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
    });

    // Form errors
    const [errors, setErrors] = useState<{
        name?: string;
        description?: string;
        targetAmount?: string;
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

            console.log("Creating fundraiser with data:", {
                name: formData.name,
                description: formData.description,
                targetAmount: formData.targetAmount,
                targetAmountWei: targetAmountInWei.toString(),
                contractAddress: FUND_ALLOCATION_ADDRESS,
            });

            // Call the contract with the correct parameters
            const tx = await writeContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "createFundraiser",
                args: [formData.name, formData.description, targetAmountInWei],
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

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6">
            {successMessage && (
                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-md">
                    <p className="text-green-800 dark:text-green-200">
                        {successMessage}
                    </p>
                </div>
            )}

            {errorMessage && (
                <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md">
                    <p className="text-red-800 dark:text-red-200">
                        {errorMessage}
                    </p>
                </div>
            )}

            <div>
                <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fundraiser Name
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.name ? "border-red-500" : ""
                    }`}
                    placeholder="Enter fundraiser name"
                    disabled={isSubmitting || isConfirming}
                />
                {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.name}
                    </p>
                )}
            </div>

            <div>
                <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                </label>
                <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.description ? "border-red-500" : ""
                    }`}
                    placeholder="Describe your fundraiser"
                    disabled={isSubmitting || isConfirming}
                />
                {errors.description && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.description}
                    </p>
                )}
            </div>

            <div>
                <label
                    htmlFor="targetAmount"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Target Amount (ETH)
                </label>
                <input
                    type="text"
                    id="targetAmount"
                    name="targetAmount"
                    value={formData.targetAmount}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        errors.targetAmount ? "border-red-500" : ""
                    }`}
                    placeholder="Enter target amount in ETH"
                    disabled={isSubmitting || isConfirming}
                />
                {errors.targetAmount && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.targetAmount}
                    </p>
                )}
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting || isConfirming}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting
                        ? "Submitting..."
                        : isConfirming
                        ? "Confirming..."
                        : "Create Fundraiser"}
                </button>
            </div>
        </form>
    );
}
