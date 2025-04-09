"use client";

import { useState } from "react";
import {
    useAccount,
    useWriteContract,
    useWaitForTransactionReceipt,
    useReadContract,
    usePublicClient,
} from "wagmi";
import { FUND_ALLOCATION_ADDRESS } from "@/lib/constants";
import { fundAllocationABI } from "@/contracts/abis";
import Header from "@/components/Layout/Header";
import { formatEther } from "viem";

export default function DebugPage() {
    const { address, isConnected } = useAccount();
    const { writeContract, data: txHash } = useWriteContract();
    const { isLoading, isSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    });
    const { data: validators, refetch: refetchValidators } = useReadContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: "getValidators",
    });
    const publicClient = usePublicClient();
    const [milestones, setMilestones] = useState<any[]>([]);
    const [milestoneLoading, setMilestoneLoading] = useState(false);
    const [pendingMilestones, setPendingMilestones] = useState<any[]>([]);
    const [pendingLoading, setPendingLoading] = useState(false);

    // Hardhat default accounts
    const hardhatAccounts = [
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Account #0
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Account #1
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Account #2
        "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Account #3
    ];

    const [customValidators, setCustomValidators] = useState<string>(
        hardhatAccounts.join("\n")
    );
    const [notification, setNotification] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    const handleSetValidators = async () => {
        try {
            const addresses = customValidators
                .split("\n")
                .map((addr) => addr.trim())
                .filter((addr) => addr && addr.startsWith("0x"));

            if (addresses.length === 0) {
                setNotification({
                    type: "error",
                    message: "No valid addresses entered",
                });
                return;
            }

            await writeContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "setValidators",
                args: [addresses],
            });

            setNotification({
                type: "success",
                message: "Transaction submitted successfully",
            });
        } catch (error) {
            console.error("Error setting validators:", error);
            setNotification({
                type: "error",
                message: `Error: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            });
        }
    };

    // Update the handleLoadAllMilestones function to properly structure milestone data
    const handleLoadAllMilestones = async () => {
        if (!publicClient) {
            console.error("Public client not available");
            return;
        }

        setMilestoneLoading(true);
        const allMilestones = [];

        try {
            // Get the total number of fundraisers
            const fundraiserCount = await publicClient.readContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "getFundraiserCount",
            });

            console.log(`Total fundraisers: ${fundraiserCount}`);

            // Loop through each fundraiser
            for (
                let fundraiserId = 0;
                fundraiserId < Number(fundraiserCount);
                fundraiserId++
            ) {
                try {
                    // Get fundraiser details
                    const fundraiserData = (await publicClient.readContract({
                        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                        abi: fundAllocationABI,
                        functionName: "fundraisers",
                        args: [fundraiserId],
                    })) as any[];

                    const fundraiserDetails = await publicClient.readContract({
                        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                        abi: fundAllocationABI,
                        functionName: "getFundraiserDetails",
                        args: [fundraiserId],
                    });

                    // Extract fundraiser name and milestones count
                    // Fundraiser data [2] is name
                    const fundraiserName =
                        fundraiserData[2] || `Fundraiser #${fundraiserId}`;
                    // Fundraiser data [8] is milestoneCount
                    const milestoneCount = Number(fundraiserData[8]) || 0;

                    console.log(
                        `Fundraiser #${fundraiserId} - ${fundraiserName}: ${milestoneCount} milestones`
                    );

                    // Get milestone details for this fundraiser
                    for (
                        let milestoneIndex = 0;
                        milestoneIndex < milestoneCount;
                        milestoneIndex++
                    ) {
                        try {
                            const milestoneData =
                                (await publicClient.readContract({
                                    address:
                                        FUND_ALLOCATION_ADDRESS as `0x${string}`,
                                    abi: fundAllocationABI,
                                    functionName: "getMilestone",
                                    args: [fundraiserId, milestoneIndex],
                                })) as any[];

                            console.log(
                                `Milestone ${milestoneIndex} data:`,
                                milestoneData
                            );

                            // Structure:
                            // 0: description
                            // 1: amountRequested
                            // 2: hasProof
                            // 3: proof (string)
                            // 4: approved (bool)
                            // 5: fundsReleased (bool)
                            // 6: voteCount

                            allMilestones.push({
                                fundraiserId,
                                fundraiserName,
                                index: milestoneIndex,
                                description:
                                    milestoneData[0] || "No description",
                                amount: milestoneData[1],
                                hasProof: milestoneData[2],
                                proof: milestoneData[3],
                                approved: milestoneData[4],
                                fundsReleased: milestoneData[5],
                                voteCount: Number(milestoneData[6]) || 0,
                            });
                        } catch (error) {
                            console.error(
                                `Error fetching milestone ${milestoneIndex} for fundraiser ${fundraiserId}:`,
                                error
                            );
                        }
                    }
                } catch (error) {
                    console.error(
                        `Error fetching fundraiser ${fundraiserId}:`,
                        error
                    );
                }
            }

            console.log("All milestones:", allMilestones);
            setMilestones(allMilestones);
        } catch (error) {
            console.error("Error loading milestones:", error);
        } finally {
            setMilestoneLoading(false);
        }
    };

    // Handle successful transaction
    if (isSuccess && notification?.type === "success") {
        setTimeout(() => {
            refetchValidators();
        }, 2000);
    }

    // Add a helper function to display milestone status badges
    const getMilestoneStatusBadge = (milestone: any) => {
        if (milestone.fundsReleased) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Completed
                </span>
            );
        }

        if (milestone.approved) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Approved
                </span>
            );
        }

        if (milestone.hasProof) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Proof Submitted
                </span>
            );
        }

        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                Pending
            </span>
        );
    };

    // Add a function to filter milestones with proof submitted but not approved
    const handleFilterPendingMilestones = () => {
        if (milestones.length === 0) {
            alert("Please load all milestones first");
            return;
        }

        setPendingLoading(true);

        // Filter milestones that have proof submitted but not yet approved
        const pending = milestones.filter(
            (m) => m.hasProof && !m.approved && !m.fundsReleased
        );

        console.log("Pending milestones:", pending);
        setPendingMilestones(pending);
        setPendingLoading(false);
    };

    // Add a section to display all milestones for debugging
    const renderMilestoneDebug = () => (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mt-8">
            <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Milestone Debug
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    View all milestones in the system
                </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
                <button
                    onClick={handleLoadAllMilestones}
                    disabled={milestoneLoading}
                    className="mb-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400">
                    {milestoneLoading ? (
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
                            Loading Milestones...
                        </>
                    ) : (
                        "Load All Milestones"
                    )}
                </button>

                {milestones.length > 0 ? (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Found {milestones.length} milestones
                        </p>
                        {milestones.map((milestone, index) => (
                            <div
                                key={`${milestone.fundraiserId}-${index}`}
                                className="border rounded-md p-4 mb-2 bg-white dark:bg-gray-800">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-lg font-medium">
                                        {milestone.fundraiserName ||
                                            `Fundraiser #${milestone.fundraiserId}`}{" "}
                                        - Milestone #{index}
                                    </h4>
                                    {getMilestoneStatusBadge(milestone)}
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 mb-2">
                                    {milestone.description || "No description"}
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="font-medium">
                                            Amount:
                                        </span>{" "}
                                        {milestone.amount
                                            ? formatEther(milestone.amount)
                                            : "0"}{" "}
                                        ETH
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            Proof:
                                        </span>{" "}
                                        {milestone.hasProof
                                            ? "Submitted"
                                            : "Not submitted"}
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            Approval:
                                        </span>{" "}
                                        {milestone.approved
                                            ? "Approved"
                                            : "Not approved"}
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            Votes:
                                        </span>{" "}
                                        {milestone.voteCount || 0}
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            Funds Released:
                                        </span>{" "}
                                        {milestone.fundsReleased ? "Yes" : "No"}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : milestoneLoading ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Loading...
                    </p>
                ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        No milestones loaded yet. Click the button above to load
                        all milestones.
                    </p>
                )}
            </div>
        </div>
    );

    return (
        <>
            <Header pageTitle="Debug Tools" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {!isConnected ? (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
                        <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
                            Connect Your Wallet
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            You need to connect your wallet to use the debug
                            tools.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                            <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                    Multi-Signature Validator Management
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    Set up validators for the multi-signature
                                    approval process
                                </p>
                            </div>

                            <div className="px-4 py-5 sm:p-6">
                                <div className="mb-6">
                                    <h4 className="font-medium mb-2 text-gray-900 dark:text-white">
                                        Current Validators:
                                    </h4>
                                    {validators ? (
                                        <ul className="list-disc pl-5 space-y-1 mb-4">
                                            {(validators as string[]).map(
                                                (validator, index) => (
                                                    <li
                                                        key={index}
                                                        className="text-sm font-mono break-all text-gray-700 dark:text-gray-300">
                                                        {validator}
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-400">
                                            Loading current validators...
                                        </p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label
                                        htmlFor="validators"
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Validator Addresses (one per line):
                                    </label>
                                    <textarea
                                        id="validators"
                                        name="validators"
                                        rows={6}
                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md"
                                        value={customValidators}
                                        onChange={(e) =>
                                            setCustomValidators(e.target.value)
                                        }
                                        placeholder="Enter validator addresses, one per line"
                                    />
                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Default Hardhat accounts are pre-filled.
                                        These are the first 4 accounts available
                                        in your local Hardhat node.
                                    </p>
                                </div>

                                {notification && (
                                    <div
                                        className={`rounded-md p-4 mb-4 ${
                                            notification.type === "success"
                                                ? "bg-green-50 dark:bg-green-900"
                                                : "bg-red-50 dark:bg-red-900"
                                        }`}>
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                {notification.type ===
                                                "success" ? (
                                                    <svg
                                                        className="h-5 w-5 text-green-400"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                ) : (
                                                    <svg
                                                        className="h-5 w-5 text-red-400"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="ml-3">
                                                <p
                                                    className={`text-sm font-medium ${
                                                        notification.type ===
                                                        "success"
                                                            ? "text-green-800 dark:text-green-200"
                                                            : "text-red-800 dark:text-red-200"
                                                    }`}>
                                                    {notification.message}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleSetValidators}
                                    disabled={isLoading}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400">
                                    {isLoading ? (
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
                                            Setting Validators...
                                        </>
                                    ) : (
                                        "Set Validators"
                                    )}
                                </button>
                            </div>
                        </div>

                        {renderMilestoneDebug()}

                        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                            <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                    Testing Instructions
                                </h3>
                            </div>
                            <div className="px-4 py-5 sm:p-6">
                                <ol className="list-decimal pl-5 space-y-3">
                                    <li className="text-gray-700 dark:text-gray-300">
                                        <strong>Set Validators:</strong> Use the
                                        form above to set the first four Hardhat
                                        accounts as validators
                                    </li>
                                    <li className="text-gray-700 dark:text-gray-300">
                                        <strong>Create a Fundraiser:</strong> Go
                                        to the Create page and create a new
                                        fundraiser
                                    </li>
                                    <li className="text-gray-700 dark:text-gray-300">
                                        <strong>Create a Milestone:</strong> Go
                                        to the Fund Requests page to create a
                                        milestone for your fundraiser
                                    </li>
                                    <li className="text-gray-700 dark:text-gray-300">
                                        <strong>Switch Accounts:</strong> Change
                                        your wallet to one of the validator
                                        accounts
                                    </li>
                                    <li className="text-gray-700 dark:text-gray-300">
                                        <strong>
                                            Approve/Reject Milestone:
                                        </strong>{" "}
                                        Go to the Fund Requests page and select
                                        "Pending Milestones" to approve or
                                        reject the milestone
                                    </li>
                                    <li className="text-gray-700 dark:text-gray-300">
                                        <strong>Release Funds:</strong> Switch
                                        back to the fundraiser creator account
                                        and release the approved milestone funds
                                    </li>
                                </ol>
                            </div>
                        </div>

                        {/* Add a button to filter pending milestones */}
                        <div className="mt-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Pending Milestones
                            </h3>
                            <div className="mb-4">
                                <button
                                    onClick={handleFilterPendingMilestones}
                                    disabled={
                                        pendingLoading || milestoneLoading
                                    }
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400">
                                    {pendingLoading ? (
                                        <>
                                            <svg
                                                className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                                            Filtering...
                                        </>
                                    ) : (
                                        "Show Pending Milestones"
                                    )}
                                </button>
                            </div>

                            {pendingMilestones.length > 0 ? (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                        {pendingMilestones.length} pending
                                        milestone
                                        {pendingMilestones.length !== 1
                                            ? "s"
                                            : ""}{" "}
                                        found (proof submitted but not approved)
                                    </p>
                                    <div className="space-y-2">
                                        {pendingMilestones.map(
                                            (milestone, index) => (
                                                <div
                                                    key={`pending-${milestone.fundraiserId}-${milestone.index}`}
                                                    className="border-l-4 border-yellow-500 pl-4 py-2">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="font-medium">
                                                                {
                                                                    milestone.fundraiserName
                                                                }{" "}
                                                                - Milestone #
                                                                {
                                                                    milestone.index
                                                                }
                                                            </h4>
                                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                                {milestone.description ||
                                                                    "No description"}
                                                            </p>
                                                            <p className="text-sm">
                                                                Amount:{" "}
                                                                {milestone.amount
                                                                    ? formatEther(
                                                                          milestone.amount
                                                                      )
                                                                    : "0"}{" "}
                                                                ETH
                                                            </p>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                                Validator votes:{" "}
                                                                {milestone.voteCount ||
                                                                    0}
                                                            </p>
                                                        </div>
                                                        {getMilestoneStatusBadge(
                                                            milestone
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            ) : pendingMilestones.length === 0 &&
                              !pendingLoading &&
                              milestones.length > 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    No pending milestones found
                                </p>
                            ) : null}
                        </div>
                    </div>
                )}
            </main>
        </>
    );
}
