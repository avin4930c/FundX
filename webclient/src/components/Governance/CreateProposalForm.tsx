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

const contractConfig = {
    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
    abi: FundAllocationABI,
};

interface CreateProposalFormProps {
    fundraiserId?: number;
    onSuccess?: () => void;
}

export default function CreateProposalForm({
    fundraiserId = 0,
    onSuccess,
}: CreateProposalFormProps) {
    // Get connected account
    const { address } = useAccount();
    const publicClient = usePublicClient();

    // Form state
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [selectedFundraiserId, setSelectedFundraiserId] =
        useState<number>(fundraiserId);
    const [errors, setErrors] = useState<{
        description?: string;
        amount?: string;
        fundraiserId?: string;
    }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isValidator, setIsValidator] = useState(false);
    const [availableFundraisers, setAvailableFundraisers] = useState<
        { id: number; name: string; currentAmount: string }[]
    >([]);
    const [activeProposals, setActiveProposals] = useState<any[]>([]);
    const [isLoadingProposals, setIsLoadingProposals] = useState(true);

    // Check if the current user is a validator
    const { data: validatorsData, isSuccess: isValidatorsSuccess } =
        useReadContract({
            address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
            abi: FundAllocationABI,
            functionName: "getValidators",
        });

    // Get fundraiser count
    const { data: fundraiserCount, isSuccess: isFundraiserCountSuccess } =
        useReadContract({
            address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
            abi: FundAllocationABI,
            functionName: "getFundraiserCount",
        });

    // Get proposal count
    const { data: proposalCount, isSuccess: isProposalCountSuccess } =
        useReadContract({
            address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
            abi: FundAllocationABI,
            functionName: "proposalCount",
        });

    // Contract interaction
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

    // Fetch available fundraisers
    useEffect(() => {
        const fetchFundraisers = async () => {
            if (
                !publicClient ||
                !isFundraiserCountSuccess ||
                !fundraiserCount
            ) {
                return;
            }

            const count = Number(fundraiserCount);
            if (count === 0) {
                return;
            }

            const fundraisers = [];
            for (let i = 0; i < count; i++) {
                try {
                    const result = await publicClient.readContract({
                        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                        abi: FundAllocationABI,
                        functionName: "fundraisers",
                        args: [BigInt(i)],
                    });

                    // Extract fundraiser data
                    const fundraiserData = result as any[];
                    if (fundraiserData && fundraiserData.length > 0) {
                        const name = fundraiserData[0];
                        const currentAmount = (
                            Number(fundraiserData[4]) / 1e18
                        ).toString();

                        fundraisers.push({
                            id: i,
                            name,
                            currentAmount,
                        });
                    }
                } catch (error) {
                    console.error(`Error fetching fundraiser ${i}:`, error);
                }
            }

            setAvailableFundraisers(fundraisers);
        };

        fetchFundraisers();
    }, [publicClient, isFundraiserCountSuccess, fundraiserCount]);

    // Fetch active proposals
    useEffect(() => {
        const fetchProposals = async () => {
            setIsLoadingProposals(true);
            if (!publicClient || !isProposalCountSuccess || !proposalCount) {
                setIsLoadingProposals(false);
                return;
            }

            const count = Number(proposalCount);
            console.log("Proposal count:", count);

            if (count === 0) {
                setActiveProposals([]);
                setIsLoadingProposals(false);
                return;
            }

            try {
                // In a real app, you would query the proposals from the contract
                // For demonstration, we'll just check if we have any proposals
                setActiveProposals(count > 0 ? [{ id: 0 }] : []);
            } catch (error) {
                console.error("Error fetching proposals:", error);
                setActiveProposals([]);
            }

            setIsLoadingProposals(false);
        };

        fetchProposals();
    }, [publicClient, isProposalCountSuccess, proposalCount]);

    // Handle transaction success
    useEffect(() => {
        if (isSuccess && txHash) {
            setSuccessMessage(
                "Your vote has been cast successfully! The proposal will now be processed according to DAO rules."
            );
            setDescription("");
            setAmount("");
            setIsSubmitting(false);
            if (onSuccess) onSuccess();
        }
    }, [isSuccess, txHash, onSuccess]);

    // Handle form input errors
    useEffect(() => {
        if (writeError) {
            console.error("Write error:", writeError);
            let errorMsg = "Error creating proposal: ";

            // Analyze the error message
            const errorMessage = writeError.message || "";
            console.log("Raw error message:", errorMessage);

            if (errorMessage.includes("does not exist")) {
                errorMsg += "Fundraiser does not exist in the contract.";
            } else if (errorMessage.includes("insufficient funds")) {
                errorMsg +=
                    "The contract has insufficient funds for this operation.";
            } else if (errorMessage.includes("not validator")) {
                errorMsg += "Only validators can create proposals.";
            } else if (errorMessage.includes("already executed")) {
                errorMsg +=
                    "This fundraiser may not be active or has already been executed.";
            } else {
                errorMsg +=
                    "The contract rejected this transaction. Check your permissions and fundraiser details.";
            }

            setErrorMessage(errorMsg);
            setIsSubmitting(false);
        }
    }, [writeError]);

    // Validate form inputs
    const validateForm = (): boolean => {
        const newErrors: {
            description?: string;
            amount?: string;
            fundraiserId?: string;
        } = {};

        if (!description.trim()) {
            newErrors.description = "Description is required";
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
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        // Check if user is a validator
        if (!isValidator) {
            setErrorMessage(
                "Only validators can create proposals. Please contact a validator to create a proposal for your fundraiser."
            );
            return;
        }

        // Check if there are any active proposals
        if (activeProposals.length === 0) {
            setErrorMessage(
                "There are currently no active proposals to vote on. Proposals must be created by an administrator first."
            );
            return;
        }

        // Validate inputs
        if (!validateForm()) return;

        // Submit vote
        try {
            setIsSubmitting(true);

            // Use the first available proposal
            const proposalId = 0; // This would ideally be dynamically determined
            const support = true; // Vote for approval

            console.log(
                `Attempting to vote on proposal ${proposalId} for fundraiser ${selectedFundraiserId}`
            );

            writeContract({
                ...contractConfig,
                functionName: "vote",
                args: [BigInt(proposalId), support],
            });

            // We'll handle errors through the writeError useEffect
        } catch (error) {
            console.error("Error submitting proposal action:", error);
            setErrorMessage(
                "There was an error with your proposal action. Please try again. " +
                    (error instanceof Error ? error.message : String(error))
            );
            setIsSubmitting(false);
        }
    };

    // If not a validator, show warning
    if (!isValidator) {
        return (
            <div className="rounded-md bg-yellow-50 dark:bg-yellow-900 p-6 text-center">
                <div className="flex flex-col items-center">
                    <div className="flex-shrink-0 mb-3">
                        <svg
                            className="h-10 w-10 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                        Validator Permission Required
                    </h3>
                    <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                        Only validators can create proposals in this DAO. Please
                        contact a validator to create a proposal for your
                        fundraiser.
                    </p>
                </div>
            </div>
        );
    }

    // If no active proposals exist, show instructions
    if (!isLoadingProposals && activeProposals.length === 0) {
        return (
            <div className="rounded-md bg-yellow-50 dark:bg-yellow-900 p-6">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg
                            className="h-8 w-8 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <div className="ml-4">
                        <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">
                            No Active Proposals
                        </h3>
                        <p className="mt-2 text-yellow-700 dark:text-yellow-300">
                            There are currently no active proposals to vote on.
                            Proposals need to be created by an administrator
                            through a backend process first.
                        </p>
                        <p className="mt-4 text-yellow-700 dark:text-yellow-300">
                            <strong>How to create a proposal:</strong>
                        </p>
                        <ol className="list-decimal ml-5 mt-2 text-yellow-700 dark:text-yellow-300">
                            <li className="mb-2">
                                Run the Hardhat script we created:{" "}
                                <code className="bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded font-mono text-sm">
                                    npx hardhat run scripts/create-proposal.js
                                    --network localhost
                                </code>
                            </li>
                            <li className="mb-2">
                                This will create a test proposal for fundraiser
                                ID 0
                            </li>
                            <li>
                                Return to this page to vote on the newly created
                                proposal
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        );
    }

    // If loading proposals, show loading indicator
    if (isLoadingProposals) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-300">
                    Loading proposals...
                </span>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6">
            <div className="rounded-md bg-blue-50 dark:bg-blue-900 p-4 mb-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg
                            className="h-5 w-5 text-blue-400"
                            fill="currentColor"
                            viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Participate in Governance
                        </h3>
                        <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                            <p>
                                As a validator, you can vote on active
                                proposals. The system requires proposals to go
                                through a multi-step governance process.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-md bg-yellow-50 dark:bg-yellow-900 p-4 mb-4">
                <div className="flex">
                    <div className="flex-shrink-0">
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
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Important: About the Governance Process
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                            <p className="mb-2">
                                Our contract has a specific governance flow:
                            </p>
                            <ol className="list-decimal ml-5 space-y-1">
                                <li>
                                    Proposals must first be created through
                                    backend processes
                                </li>
                                <li>
                                    Validators (like you) vote on these
                                    proposals
                                </li>
                                <li>
                                    When approved, the contract creates
                                    withdrawal requests
                                </li>
                                <li>
                                    Multi-sig signers complete the approval flow
                                </li>
                            </ol>
                            <p className="mt-2">
                                Note: Direct proposal creation is not supported
                                through the UI at this time. Please contact the
                                administrator if you need to create a new
                                proposal.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fundraiser Select Field */}
            <div>
                <label
                    htmlFor="fundraiserId"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Fundraiser
                </label>
                <div className="mt-1">
                    <select
                        id="fundraiserId"
                        name="fundraiserId"
                        value={selectedFundraiserId}
                        onChange={(e) =>
                            setSelectedFundraiserId(Number(e.target.value))
                        }
                        className="shadow-sm block w-full sm:text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        disabled={
                            isSubmitting || availableFundraisers.length === 0
                        }>
                        {availableFundraisers.length === 0 ? (
                            <option value="">No fundraisers available</option>
                        ) : (
                            availableFundraisers.map((f) => (
                                <option
                                    key={f.id}
                                    value={f.id}>
                                    {f.name} ({f.currentAmount} ETH)
                                </option>
                            ))
                        )}
                    </select>
                    {errors.fundraiserId && (
                        <p className="mt-2 text-sm text-red-600">
                            {errors.fundraiserId}
                        </p>
                    )}
                </div>
            </div>

            {/* Description Field */}
            <div>
                <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Proposal Description
                </label>
                <div className="mt-1">
                    <textarea
                        id="description"
                        name="description"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Explain the purpose of this proposal and how funds will be used"
                        className={`shadow-sm block w-full sm:text-sm rounded-md ${
                            errors.description
                                ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
                                : "border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        }`}
                        disabled={isSubmitting}
                    />
                    {errors.description && (
                        <p className="mt-2 text-sm text-red-600">
                            {errors.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Amount Field */}
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
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    }`}>
                    {isSubmitting ? "Processing..." : "Vote on Proposal"}
                </button>
            </div>
        </form>
    );
}
