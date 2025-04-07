"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    useAccount,
    useContractReads,
    useWriteContract,
    useWaitForTransactionReceipt,
    usePublicClient,
} from "wagmi";
import { formatEther, parseEther, isAddress } from "viem";
import { FUND_ALLOCATION_ADDRESS } from "../../../config/wagmi";
import { fundAllocationABI } from "@/contracts/abis";

// Updated Fundraiser type to match the contract structure
type Fundraiser = {
    id: string;
    name: string;
    description: string;
    creator: string;
    targetAmount: string;
    currentAmount: string;
    status: number; // Using the enum value from the contract
    active: boolean; // Derived from status
    progress: number;
    timeLeft: string;
};

export const ActiveFundraisers = () => {
    const { isConnected } = useAccount();
    const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
    const [donationAmounts, setDonationAmounts] = useState<{
        [key: string]: string;
    }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Validate contract address
    const isValidContractAddress = isAddress(FUND_ALLOCATION_ADDRESS);

    // Get fundraiser count - adding watch to update when new fundraisers are created
    const { data: fundraiserCount, refetch: refetchFundraiserCount } =
        useContractReads({
            contracts: [
                {
                    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                    abi: fundAllocationABI,
                    functionName: "getFundraiserCount",
                },
            ],
            query: {
                enabled: isValidContractAddress, // Only enable if address is valid
                refetchInterval: 10000, // Refetch every 10 seconds
            },
        });

    // Donate function
    const { writeContract, data: donationHash } = useWriteContract();

    // Wait for donation transaction confirmation
    const { isSuccess: isDonationSuccess } = useWaitForTransactionReceipt({
        hash: donationHash,
    });

    // When donation is successful, trigger a refresh
    useEffect(() => {
        if (isDonationSuccess && donationHash) {
            console.log("Donation confirmed, refreshing data...");
            // Trigger refresh
            setRefreshTrigger((prev) => prev + 1);
            refetchFundraiserCount();
        }
    }, [isDonationSuccess, donationHash, refetchFundraiserCount]);

    // Update donation amount for a specific fundraiser
    const handleDonationChange = (id: string, value: string) => {
        setDonationAmounts((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    // Calculate time remaining helper function
    const getTimeRemaining = () => {
        // Since we don't have a deadline in the contract, we'll use a default of 30 days
        const now = new Date();
        const futureDate = new Date(now);
        futureDate.setDate(futureDate.getDate() + 30);

        const diff = futureDate.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days > 0) return `${days} day${days > 1 ? "s" : ""} left`;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} left`;

        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes} minute${minutes > 1 ? "s" : ""} left`;
    };

    // Calculate progress percentage helper
    const calculateProgress = (current: bigint, target: bigint): number => {
        if (target === BigInt(0)) return 0;

        // Convert BigInt values to strings first, then to numbers to avoid precision issues
        const currentNum = Number(current.toString());
        const targetNum = Number(target.toString());

        // Calculate the percentage using regular number operations
        return Math.floor((currentNum / targetNum) * 100);
    };

    // Get public client for direct contract reads
    const publicClient = usePublicClient();

    // Handle donation submission
    const handleDonate = async (id: string) => {
        if (!isConnected) {
            alert("Please connect your wallet to donate");
            return;
        }

        if (!isValidContractAddress) {
            alert(
                "Contract address is not valid. Please check your environment variables."
            );
            return;
        }

        const amount = donationAmounts[id];
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            alert("Please enter a valid donation amount");
            return;
        }

        try {
            // Convert ETH amount to Wei
            const amountInWei = parseEther(amount);

            // Call the contract's donate function
            const tx = await writeContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "donate",
                args: [BigInt(id)],
                value: amountInWei,
            });

            console.log("Donation transaction submitted:", tx);
        } catch (error) {
            console.error("Error donating:", error);
            alert("Failed to submit donation. Please try again.");
        }
    };

    // Load fundraisers from the blockchain
    useEffect(() => {
        const fetchFundraisers = async () => {
            if (!publicClient || !fundraiserCount) return;

            setIsLoading(true);
            setError("");

            try {
                const count = Number(fundraiserCount);
                console.log("Total fundraiser count:", count);

                const promises = [];
                for (let i = 0; i < count; i++) {
                    promises.push(fetchFundraiserDetails(BigInt(i)));
                }

                const results = await Promise.all(promises);
                const validFundraisers = results.filter(
                    (f): f is Fundraiser => f !== null
                );

                console.log("Valid active fundraisers:", validFundraisers);

                setFundraisers(validFundraisers);
                const initialDonationAmounts = Object.fromEntries(
                    validFundraisers.map((f) => [f.id, ""])
                );
                setDonationAmounts(initialDonationAmounts);
            } catch (error) {
                console.error("Error fetching fundraisers:", error);
                setError("Failed to fetch fundraisers");
            } finally {
                setIsLoading(false);
            }
        };

        fetchFundraisers();

        // Set up auto-refresh
        const intervalId = setInterval(() => {
            setRefreshTrigger((prev) => prev + 1);
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(intervalId);
    }, [publicClient, fundraiserCount, refreshTrigger]);

    const fetchFundraiserDetails = async (id: bigint) => {
        if (!publicClient) return null;

        try {
            const result = await publicClient.readContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "fundraisers",
                args: [id],
            });

            if (!result) return null;

            const fundraiserData = result as any;
            const status = Number(fundraiserData.status || 0);
            // Status 1 is Active in the contract's enum
            const isActive = status === 1;

            // Parse amounts as BigInt to handle them correctly
            const targetAmount = fundraiserData.goal
                ? BigInt(fundraiserData.goal.toString())
                : BigInt(0);
            const currentAmount = fundraiserData.raised
                ? BigInt(fundraiserData.raised.toString())
                : BigInt(0);

            console.log("Fundraiser details:", {
                id: id.toString(),
                name: fundraiserData.name,
                targetAmount: targetAmount.toString(),
                currentAmount: currentAmount.toString(),
                status,
                isActive,
            });

            // Only return active fundraisers
            if (!isActive) {
                console.log(
                    `Fundraiser ${id} is not active, status: ${status}`
                );
                return null;
            }

            const progress = calculateProgress(currentAmount, targetAmount);

            return {
                id: id.toString(),
                name: fundraiserData.name || "",
                description: fundraiserData.description || "",
                creator: fundraiserData.creator || "",
                targetAmount: formatEther(targetAmount),
                currentAmount: formatEther(currentAmount),
                status,
                active: isActive,
                progress,
                timeLeft: getTimeRemaining(),
            } as Fundraiser;
        } catch (error) {
            console.error(`Error fetching fundraiser ${id}:`, error);
            return null;
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10">
                <h3 className="text-xl font-medium text-red-600 dark:text-red-400">
                    {error}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Please check your environment variables and try again.
                </p>
            </div>
        );
    }

    if (fundraisers.length === 0) {
        return (
            <div className="text-center py-10">
                <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                    No active fundraisers
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Be the first to create a fundraiser!
                </p>
                <div className="mt-5">
                    <Link
                        href="/create"
                        className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        Create Fundraiser
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fundraisers.map((fundraiser) => (
                <div
                    key={fundraiser.id}
                    className="bg-white dark:bg-gray-700 shadow rounded-lg overflow-hidden">
                    {/* Fundraiser Image (placeholder) */}
                    <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                        <span className="text-white text-4xl font-bold">
                            {fundraiser.name.charAt(0)}
                        </span>
                    </div>

                    <div className="p-6">
                        <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {fundraiser.name}
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                                {fundraiser.timeLeft}
                            </span>
                        </div>

                        <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                            {fundraiser.description}
                        </p>

                        <div className="mt-4">
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
                                    style={{ width: `${fundraiser.progress}%` }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                            </div>
                        </div>

                        <div className="mt-2 flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">
                                Raised: {fundraiser.currentAmount} ETH
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">
                                Goal: {fundraiser.targetAmount} ETH
                            </span>
                        </div>

                        <div className="mt-6 flex items-center">
                            <div className="flex-1">
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={donationAmounts[fundraiser.id] || ""}
                                    onChange={(e) =>
                                        handleDonationChange(
                                            fundraiser.id,
                                            e.target.value
                                        )
                                    }
                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md p-2"
                                    placeholder="ETH amount"
                                    disabled={
                                        !isConnected || !isValidContractAddress
                                    }
                                />
                            </div>
                            <button
                                onClick={() => handleDonate(fundraiser.id)}
                                disabled={
                                    !isConnected || !isValidContractAddress
                                }
                                className={`ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                  ${
                      isConnected && isValidContractAddress
                          ? "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          : "bg-gray-400 cursor-not-allowed"
                  }`}>
                                Donate
                            </button>
                        </div>

                        <div className="mt-4 text-center">
                            <Link
                                href={`/fundraiser/${fundraiser.id}`}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium">
                                View Details
                            </Link>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
