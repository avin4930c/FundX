"use client";

import { useState, useEffect } from "react";
import {
    useAccount,
    useReadContract,
    useWriteContract,
    useWaitForTransactionReceipt,
    useReadContracts,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import Link from "next/link";
import { FUND_ALLOCATION_ADDRESS } from "../../../config/wagmi";
import { FundAllocationABI } from "@/abi/FundAllocationABI";

// Define the Proposal type
interface Proposal {
    id: number;
    title: string;
    description: string;
    amount: string;
    creator: string;
    status: "active" | "approved" | "rejected";
    votesFor: number;
    votesAgainst: number;
    deadline: Date;
    fundraiserId: number;
}

// Props for the component
interface ProposalsListProps {
    status: "active" | "past";
}

export default function ProposalsList({ status }: ProposalsListProps) {
    // State for proposals
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const { address } = useAccount();

    // For contract interactions
    const [votingStatus, setVotingStatus] = useState<{
        [key: number]: {
            loading: boolean;
            voted: boolean;
            vote?: "for" | "against";
        };
    }>({});

    // Get proposal count
    const { data: proposalCount } = useReadContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: FundAllocationABI,
        functionName: "proposalCount",
    });

    // Contract write function for voting
    const { writeContract, data: txHash } = useWriteContract();

    // Wait for transaction receipt
    const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    // Add this hook near the top of your component
    const { data: fundraisersData } = useReadContracts({
        contracts: proposalCount
            ? Array.from({ length: Number(proposalCount) }).map((_, i) => ({
                  address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                  abi: FundAllocationABI as any,
                  functionName: "fundraisers",
                  args: [BigInt(i)],
              }))
            : [],
    });

    // Effect to handle successful transaction confirmation
    useEffect(() => {
        if (isConfirmed && txHash) {
            // Refresh data after successful transaction
            fetchProposals();
        }
    }, [isConfirmed, txHash]);

    // Fetch proposals from the contract
    const fetchProposals = async () => {
        setLoading(true);

        try {
            // Get total withdrawal requests count
            const withdrawalRequestsCount = await window.ethereum.request({
                method: "eth_call",
                params: [
                    {
                        to: FUND_ALLOCATION_ADDRESS,
                        data: "0x9d866985", // Function selector for "withdrawalRequests().length"
                    },
                    "latest",
                ],
            });

            const count = parseInt(withdrawalRequestsCount || "0", 16);
            console.log(`Total withdrawal requests: ${count}`);

            if (count === 0 || !count) {
                setProposals([]);
                setLoading(false);
                return;
            }

            // Fetch each withdrawal request
            const requests = [];
            for (let i = 0; i < Math.min(count, 10); i++) {
                // Limit to 10 most recent for performance
                try {
                    // Call contract to get withdrawal request data
                    const result = await window.ethereum.request({
                        method: "eth_call",
                        params: [
                            {
                                to: FUND_ALLOCATION_ADDRESS,
                                // Function selector for withdrawalRequests(uint256)
                                data: `0x5e446194${i
                                    .toString(16)
                                    .padStart(64, "0")}`,
                            },
                            "latest",
                        ],
                    });

                    if (result) {
                        // Decode the request data
                        // Format: projectId, milestoneId, amount, approvedBy, executed, timestamp
                        const projectId = parseInt(result.slice(2, 66), 16);
                        const amount = BigInt(`0x${result.slice(66, 130)}`);
                        const executed =
                            result.slice(194, 258) !== "0".repeat(64);
                        const timestamp = parseInt(result.slice(258, 322), 16);

                        // Get fundraiser details
                        const fundraiserData = await window.ethereum.request({
                            method: "eth_call",
                            params: [
                                {
                                    to: FUND_ALLOCATION_ADDRESS,
                                    data: `0x8b5b9ceb${projectId
                                        .toString(16)
                                        .padStart(64, "0")}`,
                                },
                                "latest",
                            ],
                        });

                        // Get project name and description
                        const name = "Withdrawal Request #" + i;
                        const description = `Withdrawal request for Project #${projectId}`;
                        const proposalStatus = executed ? "approved" : "active";
                        const deadline = new Date(timestamp * 1000);

                        // Create a proper proposal object
                        const proposal: Proposal = {
                            id: i,
                            title: name,
                            description: description,
                            amount: formatEther(amount),
                            creator:
                                "0x" + result.slice(130, 194).substring(24), // Extract creator address
                            status: proposalStatus,
                            votesFor: 0, // These would come from actual votes
                            votesAgainst: 0,
                            deadline: deadline,
                            fundraiserId: projectId,
                        };

                        // Filter based on tab and proposal status separately
                        const isActiveTab = proposalStatus === "active";
                        const isPastTab = proposalStatus === "approved";

                        if (
                            (isActiveTab && proposal.status === "active") ||
                            (isPastTab && proposal.status === "approved")
                        ) {
                            requests.push(proposal);
                        }
                    }
                } catch (error) {
                    console.error(
                        `Error fetching withdrawal request ${i}:`,
                        error
                    );
                }
            }

            setProposals(requests);
        } catch (error) {
            console.error("Error fetching proposals:", error);
            setProposals([]);
        }

        setLoading(false);
    };

    // Then update your useEffect
    useEffect(() => {
        const fetchUserFundraisers = async () => {
            if (!address || !proposalCount || !fundraisersData) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                console.log("Fetching fundraisers for address:", address);

                const userFundraisers: Proposal[] = [];

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

                            const proposal: Proposal = {
                                id: index,
                                title: data[0] || `Proposal #${index}`,
                                description:
                                    data[1] || "No description available",
                                amount: data[3]?.toString() || "0",
                                creator: creatorAddress,
                                status: data[6] ? "active" : "approved",
                                votesFor: 0,
                                votesAgainst: 0,
                                deadline: new Date(
                                    Number(BigInt(data[5]?.toString() || "0")) *
                                        1000
                                ),
                                fundraiserId: index,
                            };

                            userFundraisers.push(proposal);
                        }
                    }
                });

                setProposals(userFundraisers);
            } catch (error) {
                console.error("Error processing fundraisers:", error);
            } finally {
                setLoading(false);
            }
        };

        if (address && proposalCount && fundraisersData) {
            fetchUserFundraisers();
        } else {
            setLoading(false);
        }
    }, [address, proposalCount, fundraisersData]);

    // Function to vote on a proposal
    const handleVote = async (
        proposalId: number,
        voteType: "for" | "against"
    ) => {
        setVotingStatus((prev) => ({
            ...prev,
            [proposalId]: { loading: true, voted: false, vote: voteType },
        }));

        try {
            writeContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: FundAllocationABI,
                functionName: "vote",
                args: [BigInt(proposalId), voteType === "for"],
            });

            // Note: We don't update the state here because we'll refresh
            // the data once the transaction is confirmed in the useEffect above
        } catch (error) {
            console.error("Error voting on proposal:", error);
            setVotingStatus((prev) => ({
                ...prev,
                [proposalId]: { loading: false, voted: false },
            }));
        }
    };

    // Calculate approval percentage
    const getApprovalPercentage = (votesFor: number, votesAgainst: number) => {
        const total = votesFor + votesAgainst;
        if (total === 0) return 0;
        return Math.round((votesFor / total) * 100);
    };

    // Check if threshold is met
    const isThresholdMet = (votesFor: number, votesAgainst: number) => {
        const total = votesFor + votesAgainst;
        if (total === 0) return false;
        return votesFor / total >= 0.7; // 70% threshold
    };

    return (
        <div>
            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : proposals.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                        No {status} proposals found.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {proposals.map((proposal) => (
                        <div
                            key={proposal.id}
                            className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                            {proposal.title}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Request ID: #{proposal.id} •
                                            Fundraiser ID: #
                                            {proposal.fundraiserId}
                                        </p>
                                    </div>
                                    <div className="flex items-center">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${
                                                proposal.status === "active"
                                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                                                    : proposal.status ===
                                                      "approved"
                                                    ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                                                    : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                                            }`}>
                                            {proposal.status
                                                .charAt(0)
                                                .toUpperCase() +
                                                proposal.status.slice(1)}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {proposal.description}
                                    </p>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Requested Amount
                                        </p>
                                        <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                            {proposal.amount} ETH
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            {proposal.status === "active"
                                                ? "Voting Deadline"
                                                : "Completed On"}
                                        </p>
                                        <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                            {proposal.deadline.toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Approval:{" "}
                                            {getApprovalPercentage(
                                                proposal.votesFor,
                                                proposal.votesAgainst
                                            )}
                                            %
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {proposal.votesFor} For /{" "}
                                            {proposal.votesAgainst} Against
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                        <div
                                            className={`h-2.5 rounded-full ${
                                                isThresholdMet(
                                                    proposal.votesFor,
                                                    proposal.votesAgainst
                                                )
                                                    ? "bg-green-600 dark:bg-green-500"
                                                    : "bg-blue-600 dark:bg-blue-500"
                                            }`}
                                            style={{
                                                width: `${getApprovalPercentage(
                                                    proposal.votesFor,
                                                    proposal.votesAgainst
                                                )}%`,
                                            }}></div>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            0%
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            70% Threshold
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            100%
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-between items-center">
                                    <Link
                                        href={`/governance/${proposal.id}`}
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline">
                                        View Details
                                    </Link>

                                    {proposal.status === "active" &&
                                        status === "active" && (
                                            <div className="flex space-x-4">
                                                <button
                                                    onClick={() =>
                                                        handleVote(
                                                            proposal.id,
                                                            "against"
                                                        )
                                                    }
                                                    disabled={
                                                        votingStatus[
                                                            proposal.id
                                                        ]?.loading ||
                                                        votingStatus[
                                                            proposal.id
                                                        ]?.voted
                                                    }
                                                    className={`px-4 py-2 border rounded-md text-sm font-medium ${
                                                        votingStatus[
                                                            proposal.id
                                                        ]?.voted &&
                                                        votingStatus[
                                                            proposal.id
                                                        ]?.vote === "against"
                                                            ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-100 dark:border-red-700"
                                                            : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
                                                    }`}>
                                                    {votingStatus[proposal.id]
                                                        ?.loading &&
                                                    votingStatus[proposal.id]
                                                        ?.vote === "against" ? (
                                                        <span className="flex items-center">
                                                            <svg
                                                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-500"
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
                                                        </span>
                                                    ) : votingStatus[
                                                          proposal.id
                                                      ]?.voted &&
                                                      votingStatus[proposal.id]
                                                          ?.vote ===
                                                          "against" ? (
                                                        "Voted Against"
                                                    ) : (
                                                        "Vote Against"
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleVote(
                                                            proposal.id,
                                                            "for"
                                                        )
                                                    }
                                                    disabled={
                                                        votingStatus[
                                                            proposal.id
                                                        ]?.loading ||
                                                        votingStatus[
                                                            proposal.id
                                                        ]?.voted
                                                    }
                                                    className={`px-4 py-2 border rounded-md text-sm font-medium ${
                                                        votingStatus[
                                                            proposal.id
                                                        ]?.voted &&
                                                        votingStatus[
                                                            proposal.id
                                                        ]?.vote === "for"
                                                            ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-700"
                                                            : "border-gray-300 text-white bg-blue-600 hover:bg-blue-700 dark:border-blue-500 dark:text-white dark:bg-blue-600 dark:hover:bg-blue-700"
                                                    }`}>
                                                    {votingStatus[proposal.id]
                                                        ?.loading &&
                                                    votingStatus[proposal.id]
                                                        ?.vote === "for" ? (
                                                        <span className="flex items-center">
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
                                                                    strokeWidth="4"></circle>
                                                                <path
                                                                    className="opacity-75"
                                                                    fill="currentColor"
                                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Processing...
                                                        </span>
                                                    ) : votingStatus[
                                                          proposal.id
                                                      ]?.voted &&
                                                      votingStatus[proposal.id]
                                                          ?.vote === "for" ? (
                                                        "Voted For"
                                                    ) : (
                                                        "Vote For"
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
