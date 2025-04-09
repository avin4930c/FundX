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
import { MilestoneList } from "./MilestoneList";
import { Fundraiser, Milestone } from "@/types";

export const AllFundraisers = () => {
    const { isConnected, address } = useAccount();
    const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
    const getTimeRemaining = () => {
        // Since we don't have a deadline in the contract, we'll use a default of 30 days
        const now = new Date();
        const futureDate = new Date(now);
        futureDate.setDate(futureDate.getDate() + 30);

        const diff = futureDate.getTime() - now.getTime();
        const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (daysLeft > 0) {
            return `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
        }

        const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
        if (hoursLeft > 0) {
            return `${hoursLeft} hour${hoursLeft === 1 ? "" : "s"} left`;
        }

        const minutesLeft = Math.floor(diff / (1000 * 60));
        return `${minutesLeft} minute${minutesLeft === 1 ? "" : "s"} left`;
    };

    // Calculate progress percentage
    const calculateProgress = (current: bigint, target: bigint): number => {
        if (!current || !target || target === BigInt(0)) return 0;

        try {
            // Convert BigInt values to strings first, then to numbers to avoid precision issues
            const currentNum = Number(current.toString());
            const targetNum = Number(target.toString());

            // Calculate the percentage using regular number operations
            return Math.floor((currentNum / targetNum) * 100);
        } catch (error) {
            console.error("Error calculating progress:", error);
            return 0;
        }
    };

    // Handle donation submission
    const handleDonate = async (id: number) => {
        if (!isConnected) {
            alert("Please connect your wallet to donate");
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
                            functionName: "getFundraiserDetails",
                            args: [BigInt(id)],
                        });

                        console.log(`Fundraiser ${id} raw data:`, result);

                        if (result) {
                            try {
                                // The result is an array with the fundraiser properties in order
                                const fundraiserData = result as any[];

                                if (
                                    !fundraiserData ||
                                    !Array.isArray(fundraiserData)
                                ) {
                                    console.error(
                                        `Fundraiser ${id} data has incorrect format`,
                                        fundraiserData
                                    );
                                    return null;
                                }

                                // Extract values from the array
                                const [
                                    creator,
                                    title,
                                    description,
                                    targetAmount,
                                    raisedAmount,
                                    active,
                                    milestoneCount,
                                    currentMilestoneIndex,
                                ] = fundraiserData;

                                // Fetch milestones
                                const milestones: Milestone[] = [];
                                for (
                                    let i = 0;
                                    i < Number(milestoneCount);
                                    i++
                                ) {
                                    try {
                                        const milestoneResult =
                                            (await publicClient.readContract({
                                                address:
                                                    FUND_ALLOCATION_ADDRESS as `0x${string}`,
                                                abi: fundAllocationABI,
                                                functionName: "getMilestone",
                                                args: [BigInt(id), BigInt(i)],
                                            })) as any[];

                                        if (
                                            milestoneResult &&
                                            Array.isArray(milestoneResult)
                                        ) {
                                            milestones.push({
                                                description: milestoneResult[0],
                                                amount: milestoneResult[1],
                                                proof: milestoneResult[2],
                                                proofSubmitted:
                                                    milestoneResult[3],
                                                approved: milestoneResult[4],
                                                fundsReleased:
                                                    milestoneResult[5],
                                                yesVotes: milestoneResult[6],
                                                noVotes: milestoneResult[7],
                                            });
                                        }
                                    } catch (milestoneError) {
                                        console.error(
                                            `Error fetching milestone ${i} for fundraiser ${id}:`,
                                            milestoneError
                                        );
                                    }
                                }

                                // Make sure targetAmount and raisedAmount are defined before calculating progress
                                const progress = calculateProgress(
                                    raisedAmount,
                                    targetAmount
                                );

                                // Calculate time remaining (using default)
                                const timeLeft = getTimeRemaining();

                                const fundraiser: Fundraiser = {
                                    id,
                                    title: title || `Fundraiser #${id}`,
                                    description:
                                        description ||
                                        "No description available",
                                    creator:
                                        creator ||
                                        "0x0000000000000000000000000000000000000000",
                                    targetAmount: targetAmount || BigInt(0),
                                    raisedAmount: raisedAmount || BigInt(0),
                                    active: active || false,
                                    milestoneCount: Number(milestoneCount || 0),
                                    currentMilestoneIndex: Number(
                                        currentMilestoneIndex || 0
                                    ),
                                    milestones,
                                    progress,
                                };

                                console.log(`Fundraiser ${id} processed:`, {
                                    id,
                                    title: fundraiser.title,
                                    progress: fundraiser.progress,
                                    active: fundraiser.active,
                                    raisedAmount:
                                        fundraiser.raisedAmount.toString(),
                                    targetAmount:
                                        fundraiser.targetAmount.toString(),
                                    milestoneCount: fundraiser.milestoneCount,
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
        }, 30000);

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
        <div className="space-y-6">
            {fundraisers.map((fundraiser) => (
                <div
                    key={fundraiser.id}
                    className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <div className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    {fundraiser.title}
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {fundraiser.description}
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        fundraiser.active
                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                    }`}>
                                    {fundraiser.active ? "Active" : "Completed"}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                                <span>Progress</span>
                                <span>{fundraiser.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    style={{ width: `${fundraiser.progress}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Raised:{" "}
                                    {formatEther(fundraiser.raisedAmount)} ETH
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Target:{" "}
                                    {formatEther(fundraiser.targetAmount)} ETH
                                </span>
                            </div>
                        </div>

                        {/* Milestones */}
                        <div className="mt-6">
                            <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">
                                Milestones
                            </h4>
                            <MilestoneList
                                fundraiserId={BigInt(fundraiser.id)}
                                milestoneCount={fundraiser.milestoneCount}
                            />
                        </div>

                        {/* Donation Form */}
                        {fundraiser.active && (
                            <div className="mt-6">
                                <div className="flex space-x-4">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={donationAmounts[fundraiser.id]}
                                        onChange={(e) =>
                                            setDonationAmounts({
                                                ...donationAmounts,
                                                [fundraiser.id]: e.target.value,
                                            })
                                        }
                                        placeholder="Amount in ETH"
                                        className="flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={() =>
                                            handleDonate(fundraiser.id)
                                        }
                                        disabled={!isConnected}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isConnected ? (
                                            "Donate"
                                        ) : (
                                            <>
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
                                                        strokeWidth="4"
                                                    />
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    />
                                                </svg>
                                                Connecting...
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
