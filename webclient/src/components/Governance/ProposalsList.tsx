"use client";

import { useState, useEffect } from "react";
import { useAccount, useContractRead, useContractWrite } from "wagmi";
import { parseEther, formatEther } from "viem";
import Link from "next/link";

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
    type: "active" | "past";
}

export default function ProposalsList({ type }: ProposalsListProps) {
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

    // Mock function to fetch proposals - would be replaced with actual contract calls
    useEffect(() => {
        const fetchProposals = async () => {
            setLoading(true);

            // Mock data - in a real app, you'd fetch from the contract
            const mockProposals: Proposal[] = [
                {
                    id: 1,
                    title: "Community Garden Milestone 1",
                    description:
                        "Funding for initial land preparation and seed purchase",
                    amount: "0.5",
                    creator: "0x1234...5678",
                    status: "active",
                    votesFor: 8,
                    votesAgainst: 2,
                    deadline: new Date(Date.now() + 86400000 * 2), // 2 days from now
                    fundraiserId: 1,
                },
                {
                    id: 2,
                    title: "Clean Water Initiative Phase 1",
                    description:
                        "Equipment purchase for water purification system",
                    amount: "1.2",
                    creator: "0x5678...9012",
                    status: "active",
                    votesFor: 12,
                    votesAgainst: 3,
                    deadline: new Date(Date.now() + 86400000 * 3), // 3 days from now
                    fundraiserId: 2,
                },
                {
                    id: 3,
                    title: "Education Outreach Program",
                    description:
                        "Materials and transportation for rural area education",
                    amount: "0.8",
                    creator: "0x9012...3456",
                    status: "approved",
                    votesFor: 15,
                    votesAgainst: 5,
                    deadline: new Date(Date.now() - 86400000 * 1), // 1 day ago
                    fundraiserId: 3,
                },
                {
                    id: 4,
                    title: "Wildlife Conservation Project",
                    description: "Equipment for tracking endangered species",
                    amount: "1.5",
                    creator: "0x3456...7890",
                    status: "rejected",
                    votesFor: 5,
                    votesAgainst: 15,
                    deadline: new Date(Date.now() - 86400000 * 2), // 2 days ago
                    fundraiserId: 4,
                },
            ];

            // Filter based on type
            const filteredProposals = mockProposals.filter((p) =>
                type === "active"
                    ? p.status === "active"
                    : p.status === "approved" || p.status === "rejected"
            );

            setProposals(filteredProposals);
            setLoading(false);
        };

        fetchProposals();
    }, [type]);

    // Mock function for voting - would be replaced with actual contract calls
    const handleVote = async (
        proposalId: number,
        voteType: "for" | "against"
    ) => {
        setVotingStatus((prev) => ({
            ...prev,
            [proposalId]: { loading: true, voted: false, vote: voteType },
        }));

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Update the proposal with the new vote
        setProposals((prevProposals) =>
            prevProposals.map((p) => {
                if (p.id === proposalId) {
                    if (voteType === "for") {
                        return { ...p, votesFor: p.votesFor + 1 };
                    } else {
                        return { ...p, votesAgainst: p.votesAgainst + 1 };
                    }
                }
                return p;
            })
        );

        // Update voting status
        setVotingStatus((prev) => ({
            ...prev,
            [proposalId]: { loading: false, voted: true, vote: voteType },
        }));

        // Simple custom notification
        console.log(`You voted ${voteType} proposal #${proposalId}`);
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
                        No {type} proposals found.
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
                                        type === "active" && (
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
