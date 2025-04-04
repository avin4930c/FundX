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

export const ActiveFundraisers = () => {
    const { isConnected } = useAccount();
    const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
    const [donationAmounts, setDonationAmounts] = useState<{
        [key: number]: string;
    }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

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
                enabled: true,
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
    const handleDonationChange = (id: number, value: string) => {
        setDonationAmounts((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    // Calculate time remaining helper function
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
    const handleDonate = async (id: number) => {
        const amount = donationAmounts[id];
        if (!amount || parseFloat(amount) <= 0) {
            alert("Please enter a valid donation amount");
            return;
        }

        try {
            console.log(`Donating ${amount} ETH to fundraiser #${id}`);

            // Format contract address for console display
            const contractAddressDisplay = FUND_ALLOCATION_ADDRESS
                ? `${FUND_ALLOCATION_ADDRESS.substring(
                      0,
                      6
                  )}...${FUND_ALLOCATION_ADDRESS.substring(
                      FUND_ALLOCATION_ADDRESS.length - 4
                  )}`
                : "Not set";

            console.log(`Contract address: ${contractAddressDisplay}`);
            console.log(`Using function: donate with args: [${id}]`);

            // Check if contract address is valid
            if (!FUND_ALLOCATION_ADDRESS || FUND_ALLOCATION_ADDRESS === "") {
                throw new Error(
                    "Contract address is not configured. Please check your environment variables."
                );
            }

            // For testing: Log contract address and function call details
            console.log("Full details:", {
                address: FUND_ALLOCATION_ADDRESS,
                functionName: "donate",
                args: [BigInt(id)],
                value: parseEther(amount).toString(),
            });

            // Call the contract
            await writeContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "donate",
                args: [BigInt(id)],
                value: parseEther(amount),
            });

            // Show success message to user
            alert("Transaction submitted! Please confirm in your wallet.");
            console.log("Transaction submitted successfully");
        } catch (error) {
            console.error("Error making donation:", error);
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            console.error("Detailed error:", errorMessage);

            // Give user a more helpful error message
            if (errorMessage.includes("user rejected")) {
                alert("Transaction was rejected in your wallet.");
            } else if (errorMessage.includes("insufficient funds")) {
                alert(
                    "You don't have enough ETH in your wallet for this donation."
                );
            } else {
                alert(`Donation failed: ${errorMessage}`);
            }
        }
    };

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
                                // The contract returns an array with this order:
                                // [name, description, creator, targetAmount, currentAmount, deadline, active]
                                const fundraiserData = result as any[];

                                if (
                                    !Array.isArray(fundraiserData) ||
                                    fundraiserData.length < 7
                                ) {
                                    console.error(
                                        `Fundraiser ${id} data has incorrect format`
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

                // Filter out any null results and only include active fundraisers
                const validFundraisers = fetchedFundraisers.filter(
                    (f): f is Fundraiser => f !== null && f.active
                );

                console.log(
                    "Valid active fundraisers:",
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
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
                                Raised: {formatEther(fundraiser.currentAmount)}{" "}
                                ETH
                            </span>
                            <span className="text-gray-700 dark:text-gray-300">
                                Goal: {formatEther(fundraiser.targetAmount)} ETH
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
                                    disabled={!isConnected}
                                />
                            </div>
                            <button
                                onClick={() => handleDonate(fundraiser.id)}
                                disabled={!isConnected}
                                className={`ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                  ${
                      isConnected
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
