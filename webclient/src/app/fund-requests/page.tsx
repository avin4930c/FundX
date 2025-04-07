"use client";

import { useState, useEffect } from "react";
import {
    useAccount,
    useReadContract,
    useContractReads,
    usePublicClient,
} from "wagmi";
import { formatEther } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PendingRequestsList from "@/components/FundRequest/PendingRequestsList";
import Header from "@/components/Layout/Header";
import { FUND_ALLOCATION_ADDRESS } from "../../../config/wagmi";
import { FundAllocationABI } from "@/abi/FundAllocationABI";
import WithdrawalRequestForm from "@/components/FundRequest/WithdrawalRequestForm";

interface Fundraiser {
    id: number;
    name: string;
    description: string;
    creator: string;
    targetAmount: bigint;
    currentAmount: bigint;
    deadline: bigint;
    active: boolean;
}

export default function FundRequestsPage() {
    const { isConnected, address } = useAccount();
    const [selectedTab, setSelectedTab] = useState<
        "myRequests" | "pendingApprovals"
    >("myRequests");
    const [selectedFundraiserId, setSelectedFundraiserId] = useState<number>(0);
    const [isRequestSuccessful, setIsRequestSuccessful] = useState(false);
    const [myFundraisers, setMyFundraisers] = useState<Fundraiser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Get fundraiser count
    const { data: fundraiserCount, isSuccess: isFundraiserCountSuccess } =
        useReadContract({
            address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
            abi: FundAllocationABI,
            functionName: "getFundraiserCount",
        });

    // Use useContractReads to fetch all fundraisers in one batch
    const { data: fundraisersData } = useContractReads({
        contracts: fundraiserCount
            ? Array.from({ length: Number(fundraiserCount) }).map((_, i) => ({
                  address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                  abi: FundAllocationABI as any, // Type assertion to resolve type issue
                  functionName: "fundraisers",
                  args: [BigInt(i)],
              }))
            : [],
    });

    // Fetch all fundraisers created by the current user
    useEffect(() => {
        const fetchUserFundraisers = async () => {
            if (
                !isConnected ||
                !address ||
                !fundraiserCount ||
                !fundraisersData
            ) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                console.log("Fetching fundraisers for address:", address);

                const userFundraisers: Fundraiser[] = [];

                // Process the data from useContractReads
                fundraisersData.forEach((result, index) => {
                    if (result.status === "success" && result.result) {
                        const data = result.result as any[];
                        const creatorAddress = data[2] as string;

                        if (
                            creatorAddress.toLowerCase() ===
                            address.toLowerCase()
                        ) {
                            console.log(
                                `Fundraiser ${index} belongs to current user`
                            );

                            const fundraiser: Fundraiser = {
                                id: index,
                                name: data[0] || `Fundraiser #${index}`,
                                description:
                                    data[1] || "No description available",
                                creator: creatorAddress,
                                targetAmount: BigInt(
                                    data[3]?.toString() || "0"
                                ),
                                currentAmount: BigInt(
                                    data[4]?.toString() || "0"
                                ),
                                deadline: BigInt(data[5]?.toString() || "0"),
                                active: !!data[6],
                            };

                            userFundraisers.push(fundraiser);
                        }
                    }
                });

                if (userFundraisers.length > 0) {
                    setSelectedFundraiserId(userFundraisers[0].id);
                }

                setMyFundraisers(userFundraisers);
                setIsLoading(false);
            } catch (error) {
                console.error("Error processing fundraisers:", error);
                setIsLoading(false);
            }
        };

        if (
            isConnected &&
            address &&
            isFundraiserCountSuccess &&
            fundraisersData
        ) {
            fetchUserFundraisers();
        } else {
            setIsLoading(false);
        }
    }, [
        isConnected,
        address,
        fundraiserCount,
        isFundraiserCountSuccess,
        fundraisersData,
    ]);

    // Handle successful request submission
    const handleRequestSuccess = () => {
        setIsRequestSuccessful(true);
        setTimeout(() => {
            setIsRequestSuccessful(false);
        }, 5000);
    };

    // Update selectedFundraiserId when a different fundraiser is chosen
    const handleFundraiserChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const id = parseInt(e.target.value);
        console.log(`Selected fundraiser changed to ID: ${id}`);
        setSelectedFundraiserId(id);
    };

    // Add debugging info for all available fundraisers
    useEffect(() => {
        if (fundraisersData && fundraisersData.length > 0) {
            console.log(
                `Total fundraisers data available: ${fundraisersData.length}`
            );

            // Log the first few fundraisers for debugging
            fundraisersData.slice(0, 5).forEach((result, index) => {
                if (result.status === "success" && result.result) {
                    const data = result.result as any[];
                    console.log(`Fundraiser #${index} details:`, {
                        name: data[0],
                        description: data[1],
                        creator: data[2],
                        targetAmount: data[3]?.toString(),
                        currentAmount: data[4]?.toString(),
                        deadline: data[5]?.toString(),
                        active: !!data[6],
                    });
                } else {
                    console.log(
                        `Fundraiser #${index} failed to load or is empty`
                    );
                }
            });
        }
    }, [fundraisersData]);

    const navigateToGovernance = () => {
        router.push("/governance");
    };

    return (
        <>
            <Header pageTitle="Fund Requests & Approvals" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {!isConnected ? (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                        <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
                            Connect Your Wallet
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            You need to connect your wallet to request funds or
                            approve requests.
                        </p>
                        <div className="flex justify-center">
                            <ConnectButton />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Tabs */}
                        <div className="border-b border-gray-200 dark:border-gray-700">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => setSelectedTab("myRequests")}
                                    className={`${
                                        selectedTab === "myRequests"
                                            ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                    aria-current={
                                        selectedTab === "myRequests"
                                            ? "page"
                                            : undefined
                                    }>
                                    My Requests
                                </button>
                                <button
                                    onClick={() =>
                                        setSelectedTab("pendingApprovals")
                                    }
                                    className={`${
                                        selectedTab === "pendingApprovals"
                                            ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                    aria-current={
                                        selectedTab === "pendingApprovals"
                                            ? "page"
                                            : undefined
                                    }>
                                    Pending Approvals
                                </button>
                            </nav>
                        </div>

                        {/* Successful request message */}
                        {isRequestSuccessful && (
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
                                            Your withdrawal request has been
                                            submitted successfully and is now
                                            awaiting approval from authorized
                                            signers.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedTab === "myRequests" ? (
                            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                                <div className="px-4 py-5 sm:px-6 bg-gray-50 dark:bg-gray-700">
                                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Request Withdrawal
                                    </h2>
                                    <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                                        Submit a request to withdraw funds from
                                        your fundraiser. DAO members will vote
                                        on your request.
                                    </p>
                                </div>

                                <div className="px-4 py-5 sm:p-6">
                                    {isLoading ? (
                                        <div className="text-center py-4">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                                Loading your fundraisers...
                                            </p>
                                        </div>
                                    ) : myFundraisers.length === 0 ? (
                                        <div className="text-center py-4">
                                            <p className="text-gray-500 dark:text-gray-400">
                                                You don't have any fundraisers
                                                yet.
                                                <Link
                                                    href="/create"
                                                    className="text-blue-500 hover:underline ml-1">
                                                    Create one
                                                </Link>
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Fundraiser selection - Improved styling */}
                                            <div className="mb-6">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Select Fundraiser
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={
                                                            selectedFundraiserId
                                                        }
                                                        onChange={
                                                            handleFundraiserChange
                                                        }
                                                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                                                        {myFundraisers.map(
                                                            (fundraiser) => (
                                                                <option
                                                                    key={
                                                                        fundraiser.id
                                                                    }
                                                                    value={
                                                                        fundraiser.id
                                                                    }>
                                                                    {
                                                                        fundraiser.name
                                                                    }
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300"></div>
                                                </div>
                                            </div>

                                            {/* Request Form */}
                                            <div className="mt-6">
                                                <WithdrawalRequestForm
                                                    fundraiserId={
                                                        selectedFundraiserId
                                                    }
                                                    onSuccess={
                                                        handleRequestSuccess
                                                    }
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                                <div className="px-4 py-5 sm:px-6 bg-gray-50 dark:bg-gray-700">
                                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                                        DAO Withdrawal Requests
                                    </h2>
                                    <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                                        Review and vote on pending withdrawal
                                        requests from fundraisers.
                                    </p>
                                </div>

                                <div className="px-4 py-5 sm:p-6">
                                    <PendingRequestsList />
                                </div>
                            </div>
                        )}

                        {/* Information section */}
                        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
                            <div className="px-4 py-5 sm:px-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                    How Withdrawal Requests Work
                                </h3>
                                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                                    Our platform ensures secure and transparent
                                    fund management through a structured
                                    withdrawal process:
                                </p>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:px-6">
                                <div className="space-y-6">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                                                1
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <h4 className="text-md font-medium text-gray-900 dark:text-white">
                                                Request Submission
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Fundraiser owners submit
                                                withdrawal requests specifying
                                                the amount and reason for the
                                                withdrawal.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                                                2
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <h4 className="text-md font-medium text-gray-900 dark:text-white">
                                                Multi-Signature Review
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Each withdrawal request requires
                                                approval from multiple
                                                authorized signers, ensuring
                                                transparency and accountability.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                                                3
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <h4 className="text-md font-medium text-gray-900 dark:text-white">
                                                Fund Release
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Once approved by the required
                                                number of signers, funds are
                                                automatically released to the
                                                fundraiser creator.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 text-center">
                                <Link
                                    href="/"
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium">
                                    Return to Home
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
