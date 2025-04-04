"use client";

import { useState, useEffect } from "react";
import {
    useAccount,
    useContractReads,
    useWriteContract,
    useWaitForTransactionReceipt,
    usePublicClient,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import { FUND_ALLOCATION_ADDRESS } from "../../../config/wagmi";
import { fundAllocationABI } from "@/contracts/abis";

interface Fundraiser {
    id: number;
    name: string;
    description: string;
    creator: string;
    targetAmount: bigint;
    currentAmount: bigint;
    deadline: bigint;
    active: boolean;
    progress: number;
    timeLeft: string;
}

interface DonationFormProps {
    onSuccess: () => void;
    isSubmitting: boolean;
    setIsSubmitting: (isSubmitting: boolean) => void;
}

export default function DonationForm({
    onSuccess,
    isSubmitting,
    setIsSubmitting,
}: DonationFormProps) {
    const { isConnected } = useAccount();
    const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFundraiser, setSelectedFundraiser] = useState<number | null>(
        null
    );
    const [donationAmount, setDonationAmount] = useState("0.1");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Get public client for direct contract reads
    const publicClient = usePublicClient();

    // Get fundraiser count
    const { data: fundraiserCount } = useContractReads({
        contracts: [
            {
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "getFundraiserCount",
            },
        ],
        query: {
            enabled: true,
            refetchInterval: 10000, // Refetch every 10 seconds
        },
    });

    // Write contract hook
    const { writeContract, data: hash } = useWriteContract();

    // Wait for transaction hook
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt(
        {
            hash,
        }
    );

    // Handle transaction success
    useEffect(() => {
        if (isSuccess && hash) {
            setSuccessMessage(
                "Donation successful! Thank you for your contribution."
            );
            setDonationAmount("0.1");
            setSelectedFundraiser(null);
            setIsSubmitting(false);
            setRefreshTrigger((prev) => prev + 1); // Trigger refresh after successful donation

            // Show transaction hash and link in console
            console.log(`Donation transaction confirmed: ${hash}`);

            // Call the success callback
            onSuccess();
        }
    }, [isSuccess, hash, onSuccess, setIsSubmitting]);

    // Calculate progress percentage helper
    const calculateProgress = (current: bigint, target: bigint): number => {
        if (target === BigInt(0)) return 0;

        // Convert BigInt values to strings first, then to numbers to avoid precision issues
        const currentNum = Number(current.toString());
        const targetNum = Number(target.toString());

        // Calculate the percentage using regular number operations
        return Math.floor((currentNum / targetNum) * 100);
    };

    // Calculate time remaining
    const getTimeRemaining = (deadline: bigint) => {
        const now = BigInt(Math.floor(Date.now() / 1000));
        if (deadline <= now) return "Ended";

        const diff = Number(deadline - now);
        const days = Math.floor(diff / 86400);

        if (days > 0) return `${days} day${days > 1 ? "s" : ""} left`;

        const hours = Math.floor(diff / 3600);
        if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} left`;

        const minutes = Math.floor(diff / 60);
        return `${minutes} minute${minutes > 1 ? "s" : ""} left`;
    };

    // Loading fundraisers from contract
    useEffect(() => {
        const loadFundraisers = async () => {
            setIsLoading(true);
            console.log(
                "DonationForm: Starting to load fundraisers, refreshTrigger:",
                refreshTrigger
            );

            try {
                // First check if fundraiserCount is available
                if (!fundraiserCount) {
                    console.log(
                        "DonationForm: Waiting for fundraiser count data..."
                    );
                    setIsLoading(false);
                    return;
                }

                // Then check if we have a valid result
                if (!fundraiserCount[0]?.result) {
                    console.log(
                        "DonationForm: No fundraiser count result available"
                    );
                    setIsLoading(false);
                    return;
                }

                const count = Number(fundraiserCount[0].result);
                console.log(
                    "DonationForm: Fundraiser count from contract:",
                    count
                );

                // If no fundraisers yet, set empty array and stop loading
                if (count === 0) {
                    console.log("DonationForm: No fundraisers found");
                    setFundraisers([]);
                    setIsLoading(false);
                    return;
                }

                // Check if public client is available
                if (!publicClient) {
                    console.error("DonationForm: Public client not available");
                    setIsLoading(false);
                    return;
                }

                // Function to fetch fundraiser details from the contract
                const fetchFundraiserDetails = async (
                    id: number
                ): Promise<Fundraiser | null> => {
                    try {
                        console.log(
                            `DonationForm: Fetching fundraiser data for ID: ${id}`
                        );

                        // Call contract to get fundraiser data using publicClient
                        const result = await publicClient.readContract({
                            address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                            abi: fundAllocationABI,
                            functionName: "fundraisers",
                            args: [BigInt(id)],
                        });

                        console.log(
                            `DonationForm: Fundraiser ${id} raw data:`,
                            result
                        );

                        if (result) {
                            try {
                                // The contract returns an array with this order:
                                // [name, description, creator, targetAmount, currentAmount, deadline, active]
                                const fundraiserData = result as any[];

                                if (
                                    !Array.isArray(fundraiserData) ||
                                    fundraiserData.length < 7
                                ) {
                                    console.error(
                                        `DonationForm: Fundraiser ${id} data has incorrect format`
                                    );
                                    return null;
                                }

                                // Extract data from array
                                const name =
                                    fundraiserData[0] || `Fundraiser #${id}`;
                                const description =
                                    fundraiserData[1] ||
                                    "No description available";
                                const creator =
                                    fundraiserData[2] ||
                                    "0x0000000000000000000000000000000000000000";
                                const targetAmount = BigInt(
                                    fundraiserData[3]?.toString() || "0"
                                );
                                const currentAmount = BigInt(
                                    fundraiserData[4]?.toString() || "0"
                                );
                                const deadline = BigInt(
                                    fundraiserData[5]?.toString() || "0"
                                );
                                const active = !!fundraiserData[6]; // Convert to boolean

                                // Calculate progress percentage
                                const progress = calculateProgress(
                                    currentAmount,
                                    targetAmount
                                );

                                // Calculate time remaining
                                const timeLeft = getTimeRemaining(deadline);

                                const fundraiser: Fundraiser = {
                                    id,
                                    name,
                                    description,
                                    creator,
                                    targetAmount,
                                    currentAmount,
                                    deadline,
                                    active,
                                    progress,
                                    timeLeft,
                                };

                                console.log(
                                    `DonationForm: Fundraiser ${id} processed:`,
                                    {
                                        id,
                                        name,
                                        progress,
                                        active,
                                        currentAmount: currentAmount.toString(),
                                        targetAmount: targetAmount.toString(),
                                    }
                                );

                                return fundraiser;
                            } catch (parseError) {
                                console.error(
                                    `DonationForm: Error parsing fundraiser ${id} data:`,
                                    parseError
                                );
                                return null;
                            }
                        }
                        console.log(
                            `DonationForm: Fundraiser ${id} data not found`
                        );
                        return null;
                    } catch (error) {
                        console.error(
                            `DonationForm: Error fetching fundraiser ${id}:`,
                            error
                        );
                        return null;
                    }
                };

                // Fetch all fundraisers in parallel
                const promises = [];
                for (let i = 0; i < count; i++) {
                    promises.push(fetchFundraiserDetails(i));
                }

                // Wait for all fundraisers to be fetched
                const fetchedFundraisers = await Promise.all(promises);
                console.log(
                    "DonationForm: All fundraisers fetched:",
                    fetchedFundraisers.length
                );

                // Filter out any null results and only include active fundraisers
                const validFundraisers = fetchedFundraisers.filter(
                    (f): f is Fundraiser => f !== null && f.active
                );

                console.log(
                    "DonationForm: Valid active fundraisers:",
                    validFundraisers.length
                );

                setFundraisers(validFundraisers);
            } catch (error) {
                console.error("DonationForm: Error in loadFundraisers:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadFundraisers();
    }, [fundraiserCount, publicClient, refreshTrigger]);

    // Handle donation submission
    const handleDonate = async (e: React.FormEvent) => {
        e.preventDefault();

        // Reset messages
        setSuccessMessage("");
        setErrorMessage("");

        // Validate form
        if (!selectedFundraiser && selectedFundraiser !== 0) {
            setErrorMessage("Please select a fundraiser");
            return;
        }

        if (!donationAmount || parseFloat(donationAmount) <= 0) {
            setErrorMessage("Please enter a valid donation amount");
            return;
        }

        try {
            setIsSubmitting(true);
            console.log(
                `Attempting to donate ${donationAmount} ETH to fundraiser #${selectedFundraiser}`
            );

            // Call the contract
            await writeContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "donate",
                args: [BigInt(selectedFundraiser)],
                value: parseEther(donationAmount),
            });

            console.log("Transaction submitted, waiting for confirmation");
            // Transaction submitted - MetaMask will prompt for confirmation
            // The rest is handled by useWaitForTransaction
        } catch (error) {
            console.error("Error submitting donation:", error);
            setErrorMessage(
                `Failed to submit donation: ${
                    (error as Error).message || "Unknown error"
                }`
            );
            setIsSubmitting(false);
        }
    };

    // Loading state during transaction confirmation
    const isProcessing = isSubmitting || isConfirming;

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleDonate}
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

            {/* Fundraiser selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select a Fundraiser
                </label>
                <div className="grid grid-cols-1 gap-4">
                    {fundraisers.map((fundraiser) => (
                        <div
                            key={fundraiser.id}
                            onClick={() => setSelectedFundraiser(fundraiser.id)}
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                selectedFundraiser === fundraiser.id
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                            }`}>
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    {fundraiser.name}
                                </h3>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                                    {fundraiser.timeLeft}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                {fundraiser.description}
                            </p>
                            <div className="mt-3">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-500 dark:text-gray-400">
                                        Progress
                                    </span>
                                    <span className="text-gray-700 dark:text-gray-300">
                                        {fundraiser.progress}%
                                    </span>
                                </div>
                                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200 dark:bg-gray-600">
                                    <div
                                        style={{
                                            width: `${fundraiser.progress}%`,
                                        }}
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                                </div>
                            </div>
                            <div className="mt-2 flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">
                                    Raised:{" "}
                                    {formatEther(fundraiser.currentAmount)} ETH
                                </span>
                                <span className="text-gray-700 dark:text-gray-300">
                                    Goal: {formatEther(fundraiser.targetAmount)}{" "}
                                    ETH
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Donation amount */}
            <div>
                <label
                    htmlFor="donationAmount"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Donation Amount (ETH)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                        type="number"
                        name="donationAmount"
                        id="donationAmount"
                        min="0.01"
                        step="0.01"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pr-12 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md p-2"
                        placeholder="0.0"
                        disabled={!isConnected || isProcessing}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                            ETH
                        </span>
                    </div>
                </div>
            </div>

            {/* Submit button */}
            <div>
                <button
                    type="submit"
                    disabled={
                        !isConnected ||
                        isProcessing ||
                        (!selectedFundraiser && selectedFundraiser !== 0)
                    }
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        !isConnected ||
                        isProcessing ||
                        (!selectedFundraiser && selectedFundraiser !== 0)
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    }`}>
                    {isProcessing ? (
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
                        "Donate Now"
                    )}
                </button>
            </div>

            {/* Transaction hash */}
            {hash && (
                <div className="mt-3 text-sm">
                    <p className="text-gray-500 dark:text-gray-400">
                        Transaction:{" "}
                        <a
                            href={`https://sepolia.etherscan.io/tx/${hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline break-all">
                            {hash}
                        </a>
                    </p>
                </div>
            )}
        </form>
    );
}
