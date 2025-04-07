"use client";

import { useState, useEffect } from "react";
import { parseEther } from "viem";
import {
    useWriteContract,
    useWaitForTransactionReceipt,
    useAccount,
    useReadContract,
    usePublicClient,
} from "wagmi";
import { FUND_ALLOCATION_ADDRESS } from "../../../config/wagmi";
import { FundAllocationABI } from "@/abi/FundAllocationABI";
import Link from "next/link";

// Updated to use the proper contract address and ABI
const contractConfig = {
    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
    abi: FundAllocationABI,
};

interface WithdrawalRequestFormProps {
    fundraiserId: number;
    onSuccess?: () => void;
}

export default function WithdrawalRequestForm({
    fundraiserId,
    onSuccess,
}: WithdrawalRequestFormProps) {
    // Get connected account
    const { address } = useAccount();
    // Add publicClient
    const publicClient = usePublicClient();

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
    const [isCreator, setIsCreator] = useState(false);
    const [isCheckingCreator, setIsCheckingCreator] = useState(true);
    const [isValidator, setIsValidator] = useState(false);

    // Read fundraiser data to check if current user is the creator
    const { data: fundraiserData, isSuccess: isFundraiserDataSuccess } =
        useReadContract({
            address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
            abi: FundAllocationABI,
            functionName: "fundraisers",
            args: [BigInt(fundraiserId)],
        });

    // Check if the current user is a validator
    const { data: validatorsData, isSuccess: isValidatorsSuccess } =
        useReadContract({
            address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
            abi: FundAllocationABI,
            functionName: "getValidators",
        });

    // Additional state for fundraiser validation
    const [fundraiserExists, setFundraiserExists] = useState(false);
    const [fundraiserActive, setFundraiserActive] = useState(false);
    const [fundraiserFunded, setFundraiserFunded] = useState(false);
    const [fundraiserDetails, setFundraiserDetails] = useState<any>(null);

    // Check if the user is a validator
    useEffect(() => {
        if (isValidatorsSuccess && validatorsData && address) {
            const validators = validatorsData as string[];
            const isUserValidator = validators.some(
                (v) => v.toLowerCase() === address.toLowerCase()
            );
            setIsValidator(isUserValidator);
            console.log("User is validator:", isUserValidator);
        }
    }, [isValidatorsSuccess, validatorsData, address]);

    // Check if fundraiser exists and validate its status
    useEffect(() => {
        const validateFundraiser = async () => {
            setIsCheckingCreator(true);

            try {
                // Check if the blockchain has been queried yet
                if (!isFundraiserDataSuccess) {
                    console.log("Still waiting for contract data...");
                    return; // Don't set error yet, still loading
                }

                // Log the fundraiser ID we're trying to verify
                console.log(
                    `Attempting to validate fundraiser with ID: ${fundraiserId}`
                );

                // Check fundraiser count first to see if any fundraisers exist
                try {
                    // Add null checking for publicClient
                    if (!publicClient) {
                        console.error("Public client not available");
                        setErrorMessage(
                            "Connection to blockchain not available. Please check your wallet connection."
                        );
                        setIsCheckingCreator(false);
                        return;
                    }

                    const count = (await publicClient.readContract({
                        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                        abi: FundAllocationABI,
                        functionName: "getFundraiserCount",
                    })) as bigint;

                    console.log(`Total fundraisers in contract: ${count}`);

                    if (Number(count) === 0) {
                        console.log("No fundraisers exist in the contract yet");
                        setFundraiserExists(false);
                        setErrorMessage(
                            "No fundraisers have been created yet. Please create a fundraiser first."
                        );
                        setIsCheckingCreator(false);
                        return;
                    }

                    if (BigInt(fundraiserId) >= count) {
                        console.log(
                            `Fundraiser ID ${fundraiserId} is out of range (max: ${
                                Number(count) - 1
                            })`
                        );
                        setFundraiserExists(false);
                        setErrorMessage(
                            `Fundraiser with ID ${fundraiserId} does not exist. Maximum ID is ${
                                Number(count) - 1
                            }.`
                        );
                        setIsCheckingCreator(false);
                        return;
                    }
                } catch (countError) {
                    console.error(
                        "Error checking fundraiser count:",
                        countError
                    );
                    // Continue to check the specific fundraiser anyway
                }

                if (fundraiserData) {
                    const fundraiserArray = fundraiserData as unknown as any[];

                    // Log complete fundraiser data for debugging
                    console.log(
                        `Fundraiser ${fundraiserId} data:`,
                        fundraiserArray
                    );

                    // Check if fundraiser exists - first check if array is empty
                    // Some blockchain providers return empty arrays for non-existent records
                    if (
                        !fundraiserArray ||
                        fundraiserArray.length === 0 ||
                        (typeof fundraiserArray[0] === "string" &&
                            (!fundraiserArray[0] || fundraiserArray[0] === ""))
                    ) {
                        console.error(
                            `Fundraiser #${fundraiserId} does not exist or returned empty data`
                        );
                        setFundraiserExists(false);
                        setErrorMessage(
                            `Fundraiser with ID ${fundraiserId} does not exist in the contract`
                        );
                        setIsCheckingCreator(false);
                        return;
                    }

                    // Check if fundraiser exists (name should be non-empty)
                    const exists =
                        !!fundraiserArray[0] && fundraiserArray[0] !== "";
                    setFundraiserExists(exists);

                    if (exists) {
                        // Get target and current amounts
                        const targetAmount = BigInt(
                            fundraiserArray[3]?.toString() || "0"
                        );
                        const currentAmount = BigInt(
                            fundraiserArray[4]?.toString() || "0"
                        );

                        // Format the amounts for display (convert from wei to ETH)
                        const targetEth = Number(targetAmount) / 1e18;
                        const currentEth = Number(currentAmount) / 1e18;

                        // Check if fundraiser has reached its target
                        const isFunded =
                            currentAmount >= targetAmount && targetAmount > 0;
                        setFundraiserFunded(isFunded);

                        // Check if fundraiser is active
                        const isActive = !!fundraiserArray[6];
                        setFundraiserActive(isActive);

                        // Store details for debugging
                        setFundraiserDetails({
                            id: fundraiserId,
                            name: fundraiserArray[0],
                            description: fundraiserArray[1],
                            creator: fundraiserArray[2],
                            targetAmount: targetEth.toString(),
                            currentAmount: currentEth.toString(),
                            rawTargetAmount: targetAmount.toString(),
                            rawCurrentAmount: currentAmount.toString(),
                            deadline: fundraiserArray[5]?.toString(),
                            active: isActive,
                            funded: isFunded,
                        });

                        console.log(
                            `Successfully validated fundraiser #${fundraiserId}:`,
                            {
                                name: fundraiserArray[0],
                                creator: fundraiserArray[2],
                                isActive,
                                isFunded,
                            }
                        );

                        // Check if user is creator
                        const creatorAddress = fundraiserArray[2] as string;
                        console.log("Fundraiser creator:", creatorAddress);
                        console.log("Current user:", address);

                        const isUserCreator =
                            address &&
                            creatorAddress &&
                            creatorAddress.toLowerCase() ===
                                address.toLowerCase();
                        setIsCreator(!!isUserCreator);

                        if (!isActive && !isFunded) {
                            setErrorMessage(
                                `Fundraiser with ID ${fundraiserId} is inactive and has not reached its target`
                            );
                        } else if (!isUserCreator && !isValidator) {
                            setErrorMessage(
                                "Only the fundraiser creator or a validator can initiate the governance process"
                            );
                        }
                    } else {
                        console.error(
                            `Fundraiser #${fundraiserId} exists but has empty name`
                        );
                        setErrorMessage(
                            `Fundraiser with ID ${fundraiserId} exists but appears to be invalid`
                        );
                    }
                } else {
                    console.error(
                        `No data returned for fundraiser with ID ${fundraiserId}`
                    );
                    setFundraiserExists(false);
                    setFundraiserActive(false);
                    setFundraiserFunded(false);
                    setErrorMessage(
                        `Could not find fundraiser with ID ${fundraiserId}. Make sure you're connected to the correct network.`
                    );
                }

                setIsCheckingCreator(false);
            } catch (error) {
                console.error(
                    `Error validating fundraiser #${fundraiserId}:`,
                    error
                );
                setIsCheckingCreator(false);
                setFundraiserExists(false);
                setFundraiserActive(false);
                setFundraiserFunded(false);
                setErrorMessage(
                    `Error validating fundraiser: ${
                        error instanceof Error ? error.message : String(error)
                    }`
                );
            }
        };

        validateFundraiser();
    }, [
        fundraiserId,
        fundraiserData,
        isFundraiserDataSuccess,
        address,
        isValidator,
        publicClient,
    ]);

    // Contract interaction for creating milestoneProposal
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
            // Show success message for withdrawal request creation
            setSuccessMessage(
                "Your withdrawal request has been created successfully! It will now be reviewed by authorized signers."
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
            console.error("Error creating withdrawal request:", writeError);

            // Provide a user-friendly error message based on the error
            let errorMsg = "There was an error creating your request. ";

            const errorMessage = writeError.message || "";
            if (errorMessage.includes("Not authorized")) {
                errorMsg +=
                    "You are not authorized to create withdrawal requests for this fundraiser.";
            } else if (errorMessage.includes("Insufficient funds")) {
                errorMsg +=
                    "The fundraiser doesn't have enough funds for this withdrawal.";
            } else if (errorMessage.includes("Invalid fundraiser")) {
                errorMsg += "This fundraiser doesn't exist.";
            } else if (errorMessage.includes("User rejected")) {
                errorMsg += "You rejected the transaction.";
            } else {
                errorMsg += "Please check your inputs and try again.";
            }

            setErrorMessage(errorMsg);
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
            newErrors.reason = "Please provide a reason for the withdrawal";
        }

        if (!amount.trim()) {
            newErrors.amount = "Amount is required";
        } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
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

        // Additional validations before submission
        if (!fundraiserExists) {
            setErrorMessage(
                `Fundraiser with ID ${fundraiserId} does not exist`
            );
            return;
        }

        // Allow proposals for either active fundraisers OR funded fundraisers (even if inactive)
        if (!fundraiserActive && !fundraiserFunded) {
            setErrorMessage(
                `Fundraiser with ID ${fundraiserId} is inactive and has not reached its target. Only completed fundraisers can have withdrawals when inactive.`
            );
            return;
        }

        // Validate request amount
        if (!validateForm()) return;

        const amountInEth = parseFloat(amount);
        if (isNaN(amountInEth)) {
            setErrorMessage("Please enter a valid withdrawal amount");
            return;
        }

        // Check if requested amount is available in the fundraiser
        if (
            fundraiserDetails &&
            amountInEth > parseFloat((fundraiserDetails as any[])[4]) / 1e18
        ) {
            setErrorMessage(
                `Cannot withdraw more than the available balance (${
                    parseFloat((fundraiserDetails as any[])[4]) / 1e18
                } ETH)`
            );
            return;
        }

        setIsSubmitting(true);

        try {
            // Call the createWithdrawalRequest function
            writeContract({
                ...contractConfig,
                functionName: "createWithdrawalRequest",
                args: [BigInt(fundraiserId), reason, parseEther(amount)],
            });
        } catch (error) {
            console.error("Error creating withdrawal request:", error);
            setErrorMessage(
                "There was an error creating your request. Please try again." +
                    (error instanceof Error ? error.message : String(error))
            );
            setIsSubmitting(false);
        }
    };

    // If checking creator status, show loading
    if (isCheckingCreator) {
        return (
            <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Verifying permissions...
                </p>
            </div>
        );
    }

    // If not creator or validator, show permission error
    if (!isCreator && !isValidator) {
        return (
            <div className="rounded-md bg-red-50 dark:bg-red-900 p-6 text-center">
                <div className="flex flex-col items-center">
                    <div className="flex-shrink-0 mb-3">
                        <svg
                            className="h-10 w-10 text-red-400"
                            fill="currentColor"
                            viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
                        Permission Denied
                    </h3>
                    <p className="text-red-700 dark:text-red-300 mb-4">
                        Only the creator of this fundraiser or a validator can
                        initiate the governance process.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6">
            {/* Fundraiser Status */}
            {fundraiserDetails && (
                <div
                    className={`rounded-md p-4 mb-4 ${
                        fundraiserFunded
                            ? "bg-green-50 dark:bg-green-900"
                            : fundraiserActive
                            ? "bg-blue-50 dark:bg-blue-900"
                            : "bg-yellow-50 dark:bg-yellow-900"
                    }`}>
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            {fundraiserFunded ? (
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
                            ) : fundraiserActive ? (
                                <svg
                                    className="h-5 w-5 text-blue-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="h-5 w-5 text-yellow-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            )}
                        </div>
                        <div className="ml-3">
                            <h3
                                className={`text-sm font-medium ${
                                    fundraiserFunded
                                        ? "text-green-800 dark:text-green-200"
                                        : fundraiserActive
                                        ? "text-blue-800 dark:text-blue-200"
                                        : "text-yellow-800 dark:text-yellow-200"
                                }`}>
                                {fundraiserFunded
                                    ? "Fundraiser Target Reached"
                                    : fundraiserActive
                                    ? "Active Fundraiser"
                                    : "Inactive Fundraiser"}
                            </h3>
                            <div
                                className={`mt-2 text-sm ${
                                    fundraiserFunded
                                        ? "text-green-700 dark:text-green-300"
                                        : fundraiserActive
                                        ? "text-blue-700 dark:text-blue-300"
                                        : "text-yellow-700 dark:text-yellow-300"
                                }`}>
                                <p>
                                    {fundraiserDetails.currentAmount} /{" "}
                                    {fundraiserDetails.targetAmount} ETH
                                    {fundraiserFunded &&
                                        !fundraiserActive &&
                                        " (Completed)"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Info box about the new direct withdrawal process */}
            <div className="rounded-md bg-blue-50 dark:bg-blue-900 p-4 mb-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg
                            className="h-5 w-5 text-blue-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Withdrawal Request Process
                        </h3>
                        <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                            <p>
                                Once submitted, your withdrawal request will be
                                processed through a multi-signature approval
                                system. Multiple signers will review and approve
                                the request before funds are released.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reason field */}
            <div>
                <label
                    htmlFor="reason"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reason for Withdrawal
                </label>
                <div className="mt-1">
                    <textarea
                        id="reason"
                        name="reason"
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Explain why these funds should be released and how they will be used"
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

            {/* Amount field - might not be needed depending on contract */}
            <div>
                <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    }`}>
                    {isSubmitting
                        ? "Processing..."
                        : "Create Withdrawal Request"}
                </button>
            </div>
        </form>
    );
}
