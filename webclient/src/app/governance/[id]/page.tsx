"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import Link from "next/link";
import Header from "@/components/Layout/Header";

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
    createdAt: Date;
}

export default function ProposalDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const proposalId = Number(params.id);
    const { isConnected, address } = useAccount();

    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const [voteType, setVoteType] = useState<"for" | "against" | null>(null);

    // Mock function to fetch proposal - would be replaced with actual contract calls
    useEffect(() => {
        const fetchProposal = async () => {
            setLoading(true);

            // Simulate API call delay
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Mock data - in a real app, you'd fetch from the contract
            const mockProposal: Proposal = {
                id: proposalId,
                title:
                    proposalId === 1
                        ? "Community Garden Milestone 1"
                        : "Clean Water Initiative Phase 1",
                description:
                    proposalId === 1
                        ? "Funding for initial land preparation and seed purchase. This milestone includes clearing the land, preparing the soil, and purchasing the initial seeds and gardening tools. The community garden will provide fresh produce for local food banks and educational opportunities for schools."
                        : "Equipment purchase for water purification system. This phase includes the acquisition of filters, pumps, and storage containers needed to establish clean water stations in three villages. We've already secured the necessary permits and established relationships with local authorities.",
                amount: proposalId === 1 ? "0.5" : "1.2",
                creator: "0x1234...5678",
                status: "active",
                votesFor: proposalId === 1 ? 8 : 12,
                votesAgainst: proposalId === 1 ? 2 : 3,
                deadline: new Date(Date.now() + 86400000 * 2), // 2 days from now
                fundraiserId: proposalId,
                createdAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
            };

            setProposal(mockProposal);
            setLoading(false);
        };

        if (proposalId) {
            fetchProposal();
        }
    }, [proposalId]);

    // Mock function for voting - would be replaced with actual contract calls
    const handleVote = async (vote: "for" | "against") => {
        if (!proposal) return;

        setVoting(true);
        setVoteType(vote);

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Update the proposal with the new vote
        setProposal((prev) => {
            if (!prev) return null;

            if (vote === "for") {
                return { ...prev, votesFor: prev.votesFor + 1 };
            } else {
                return { ...prev, votesAgainst: prev.votesAgainst + 1 };
            }
        });

        setVoting(false);
        setHasVoted(true);

        // Simple custom notification
        console.log(`You voted ${vote} proposal #${proposalId}`);
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header
                pageTitle="Proposal Details"
                showBackButton={true}
            />

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {!isConnected ? (
                        <div className="text-center py-12">
                            <div className="inline-block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Connect your wallet to participate
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    You need to connect your wallet to view and
                                    vote on this proposal.
                                </p>
                                <ConnectButton />
                            </div>
                        </div>
                    ) : loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : !proposal ? (
                        <div className="text-center py-12">
                            <div className="inline-block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Proposal Not Found
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    We couldn't find the proposal you're looking
                                    for.
                                </p>
                                <Link
                                    href="/governance"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                    Return to Governance
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
                                <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {proposal.title}
                                        </h2>
                                        <span
                                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
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
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Proposal ID: #{proposal.id} • Fundraiser
                                        ID: #{proposal.fundraiserId}
                                    </p>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Amount Requested
                                            </dt>
                                            <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                                                {proposal.amount} ETH
                                            </dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Creator
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {proposal.creator}
                                            </dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Created On
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {proposal.createdAt.toLocaleDateString()}
                                            </dd>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Voting Deadline
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {proposal.deadline.toLocaleDateString()}
                                            </dd>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Description
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-line">
                                                {proposal.description}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
                                <div className="px-4 py-5 sm:px-6">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        Voting Status
                                    </h3>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
                                    <div className="mb-6">
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

                                    {proposal.status === "active" && (
                                        <div className="mt-6">
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                                Cast Your Vote
                                            </h4>
                                            {hasVoted ? (
                                                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                                                    <div className="flex">
                                                        <div className="flex-shrink-0">
                                                            <svg
                                                                className="h-5 w-5 text-blue-400"
                                                                viewBox="0 0 20 20"
                                                                fill="currentColor">
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </div>
                                                        <div className="ml-3">
                                                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                                                You have voted{" "}
                                                                {voteType} this
                                                                proposal. Thank
                                                                you for
                                                                participating in
                                                                governance.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col sm:flex-row sm:justify-end gap-4">
                                                    <button
                                                        onClick={() =>
                                                            handleVote(
                                                                "against"
                                                            )
                                                        }
                                                        disabled={voting}
                                                        className="px-4 py-2 border rounded-md text-sm font-medium border-gray-300 text-gray-700 bg-white hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                                                        {voting &&
                                                        voteType ===
                                                            "against" ? (
                                                            <span className="flex items-center justify-center">
                                                                <svg
                                                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500"
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
                                                        ) : (
                                                            "Vote Against"
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleVote("for")
                                                        }
                                                        disabled={voting}
                                                        className="px-4 py-2 border rounded-md text-sm font-medium border-blue-500 text-white bg-blue-600 hover:bg-blue-700 dark:border-blue-500 dark:text-white dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                                        {voting &&
                                                        voteType === "for" ? (
                                                            <span className="flex items-center justify-center">
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
                                                        ) : (
                                                            "Vote For"
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <Link
                                    href="/governance"
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                                    ← Back to All Proposals
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
