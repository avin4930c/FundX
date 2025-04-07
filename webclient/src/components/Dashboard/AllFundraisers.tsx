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
import { formatEther, parseEther } from "viem";
import { FUND_ALLOCATION_ADDRESS } from "../../../config/wagmi";
import { fundAllocationABI } from "@/contracts/abis";

type Fundraiser = {
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
};

export const AllFundraisers = () => {
    const { isConnected, address } = useAccount();
    const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [donationAmounts, setDonationAmounts] = useState<{
        [key: number]: string;
    }>({});
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const publicClient = usePublicClient();

    // Get fundraiser count from contract
    const { data: fundraiserCount } = useContractReads({
        contracts: [
            {
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "getFundraiserCount",
            },
        ],
    });

    // For contract interaction to donate
    const { writeContract, data: txHash } = useWriteContract();

    // Wait for transaction receipt
    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash: txHash,
        });

    // Handle donation amount input
    const handleDonationChange = (id: number, value: string) => {
        setDonationAmounts((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    // Calculate time remaining
    const getTimeRemaining = (deadline: bigint) => {
        const now = BigInt(Math.floor(Date.now() / 1000));
        if (deadline <= now) return "Ended";

        const secondsLeft = Number(deadline - now);
        const daysLeft = Math.floor(secondsLeft / 86400);

        if (daysLeft > 0) {
            return `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
        }

        const hoursLeft = Math.floor(secondsLeft / 3600);
        if (hoursLeft > 0) {
            return `${hoursLeft} hour${hoursLeft === 1 ? "" : "s"} left`;
        }

        const minutesLeft = Math.floor(secondsLeft / 60);
        return `${minutesLeft} minute${minutesLeft === 1 ? "" : "s"} left`;
    };

    // Calculate progress percentage
    const calculateProgress = (current: bigint, target: bigint): number => {
        if (target === BigInt(0)) return 0;
        return Number((current * BigInt(100)) / target);
    };

    // Handle donation submission
    const handleDonate = async (id: number) => {
        if (!isConnected) {
            alert("Please connect your wallet to donate");
            return;
        }

        const amount = donationAmounts[id];
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            alert("Please enter a valid donation amount");
            return;
        }

        try {
            console.log(
                `Donating ${amount} ETH to fundraiser ${id} at contract ${FUND_ALLOCATION_ADDRESS}`
            );

            writeContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "donate",
                args: [BigInt(id)],
                value: parseEther(amount),
            });
        } catch (error) {
            console.error("Error donating:", error);
            alert(`Error making donation: ${error}`);
        }
    };

    // When transaction is confirmed, refresh the fundraisers
    useEffect(() => {
        if (isConfirmed) {
            // Trigger a refresh of the fundraisers data
            setRefreshTrigger((prev) => prev + 1);
        }
    }, [isConfirmed]);

    // Load real fundraiser data from the blockchain
    useEffect(() => {
        const loadFundraisers = async () => {
            setIsLoading(true);
            console.log(
                "Starting to load fundraisers, refreshTrigger:",
                refreshTrigger
            );

            try {
                // First check if fundraiserCount is available
                if (!fundraiserCount) {
                    console.log("Waiting for fundraiser count data...");
                    setIsLoading(false);
                    return;
                }

                // Then check if we have a valid result
                if (!fundraiserCount[0]?.result) {
                    console.log("No fundraiser count result available");
                    setIsLoading(false);
                    return;
                }

                const count = Number(fundraiserCount[0].result);
                console.log("Fundraiser count from contract:", count);

                // If no fundraisers yet, set empty array and stop loading
                if (count === 0) {
                    console.log("No fundraisers found");
                    setFundraisers([]);
                    setIsLoading(false);
                    return;
                }

                // Check if public client is available
                if (!publicClient) {
                    console.error("Public client not available");
                    setIsLoading(false);
                    return;
                }

                // Function to fetch actual fundraiser details from the contract
                const fetchFundraiserDetails = async (
                    id: number
                ): Promise<Fundraiser | null> => {
                    try {
                        console.log(`Fetching fundraiser data for ID: ${id}`);

                        // Call contract to get fundraiser data using publicClient
                        const result = await publicClient.readContract({
                            address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                            abi: fundAllocationABI,
                            functionName: "fundraisers",
                            args: [BigInt(id)],
                        });

                        console.log(`Fundraiser ${id} raw data:`, result);

                        if (result) {
                            try {
                                // The contract returns a struct with these fields:
                                // id, name, description, goal, raised, creator, status
                                const fundraiserData = result as any;

                                if (!fundraiserData) {
                                    console.error(
                                        `Fundraiser ${id} data has incorrect format`
                                    );
                                    return null;
                                }

                                // Extract data
                                const name =
                                    fundraiserData.name || `Fundraiser #${id}`;
                                const description =
                                    fundraiserData.description ||
                                    "No description available";
                                const creator =
                                    fundraiserData.creator ||
                                    "0x0000000000000000000000000000000000000000";
                                const targetAmount = BigInt(
                                    fundraiserData.goal?.toString() || "0"
                                );
                                const currentAmount = BigInt(
                                    fundraiserData.raised?.toString() || "0"
                                );

                                // Since we don't have deadline in the new structure, use a default (30 days from now)
                                const now = BigInt(
                                    Math.floor(Date.now() / 1000)
                                );
                                const deadline =
                                    now + BigInt(30 * 24 * 60 * 60); // 30 days from now

                                // Check status - 1 is Active in our enum
                                const active = fundraiserData.status === 1;

                                // Calculate progress percentage
                                const progress = calculateProgress(
                                    currentAmount,
                                    targetAmount
                                );

                                // Calculate time remaining (using our default deadline)
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

                                console.log(`Fundraiser ${id} processed:`, {
                                    id,
                                    name,
                                    progress,
                                    active,
                                    currentAmount: currentAmount.toString(),
                                    targetAmount: targetAmount.toString(),
                                });

                                return fundraiser;
                            } catch (parseError) {
                                console.error(
                                    `Error parsing fundraiser ${id} data:`,
                                    parseError
                                );
                                return null;
                            }
                        }
                        console.log(`Fundraiser ${id} data not found`);
                        return null;
                    } catch (error) {
                        console.error(
                            `Error fetching fundraiser ${id}:`,
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
                    "All fundraisers fetched:",
                    fetchedFundraisers.length
                );

                // Filter out any null results (but don't filter by active status)
                const validFundraisers = fetchedFundraisers.filter(
                    (f): f is Fundraiser => f !== null
                );

                console.log(
                    "Valid fundraisers (all statuses):",
                    validFundraisers.length
                );

                // Initialize donation amounts
                const initialDonationAmounts: { [key: number]: string } = {};
                validFundraisers.forEach((f) => {
                    initialDonationAmounts[f.id] = "0.1"; // Default donation amount
                });

                setDonationAmounts(initialDonationAmounts);
                setFundraisers(validFundraisers);
            } catch (error) {
                console.error("Error in loadFundraisers:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadFundraisers();

        // Set up an interval to refresh fundraisers regularly
        const intervalId = setInterval(() => {
            console.log("Auto-refreshing fundraisers data");
            setRefreshTrigger((prev) => prev + 1);
        }, 30000); // Every 30 seconds

        // Clean up interval on component unmount
        return () => clearInterval(intervalId);
    }, [fundraiserCount, refreshTrigger, publicClient]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">
                    Loading fundraisers...
                </span>
            </div>
        );
    }

    if (fundraisers.length === 0) {
        return (
            <div className="text-center py-10">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No fundraisers found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Be the first to create a fundraiser!
                </p>
                <Link
                    href="/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Create a Fundraiser
                </Link>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fundraisers.map((fundraiser) => (
                <div
                    key={fundraiser.id}
                    className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                                {fundraiser.name}
                            </h3>
                            <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    fundraiser.active
                                        ? "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                                }`}>
                                {fundraiser.active ? "Active" : "Completed"}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {fundraiser.description}
                        </p>

                        {/* Progress bar */}
                        <div className="mt-4">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    style={{
                                        width: `${Math.min(
                                            100,
                                            fundraiser.progress
                                        )}%`,
                                    }}></div>
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                                <span className="text-gray-500 dark:text-gray-400">
                                    {fundraiser.progress}% Funded
                                </span>
                                <span className="text-gray-500 dark:text-gray-400">
                                    {fundraiser.timeLeft}
                                </span>
                            </div>
                        </div>

                        {/* Donation details */}
                        <div className="mt-3 flex justify-between items-baseline">
                            <span className="text-gray-600 dark:text-gray-400 text-sm">
                                {formatEther(fundraiser.currentAmount)} ETH of{" "}
                                {formatEther(fundraiser.targetAmount)} ETH
                            </span>
                        </div>

                        {/* Donation form - only show for active fundraisers */}
                        {fundraiser.active && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex space-x-2">
                                    <div className="relative rounded-md shadow-sm flex-1">
                                        <input
                                            type="text"
                                            value={
                                                donationAmounts[
                                                    fundraiser.id
                                                ] || ""
                                            }
                                            onChange={(e) =>
                                                handleDonationChange(
                                                    fundraiser.id,
                                                    e.target.value
                                                )
                                            }
                                            className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                            placeholder="Amount"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                                                ETH
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() =>
                                            handleDonate(fundraiser.id)
                                        }
                                        disabled={!isConnected || isConfirming}
                                        className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white ${
                                            !isConnected || isConfirming
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        }`}>
                                        {isConfirming
                                            ? "Processing..."
                                            : "Donate"}
                                    </button>
                                </div>
                                {!isConnected && (
                                    <p className="mt-1 text-xs text-red-500">
                                        Connect wallet to donate
                                    </p>
                                )}
                            </div>
                        )}

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
