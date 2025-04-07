"use client";

import { useEffect, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { fundAllocationABI } from "@/contracts/abis";

interface MilestoneListProps {
    fundraiserId: bigint;
    milestoneCount: number;
}

export function MilestoneList({
    fundraiserId,
    milestoneCount,
}: MilestoneListProps) {
    const [milestones, setMilestones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [proofInput, setProofInput] = useState("");
    const [pendingTx, setPendingTx] = useState<`0x${string}` | undefined>(
        undefined
    );

    const { writeContract: vote } = useWriteContract();
    const { writeContract: submitProof } = useWriteContract();
    const { writeContract: release } = useWriteContract();

    const { isLoading: isConfirming } = useWaitForTransactionReceipt({
        hash: pendingTx,
    });

    useEffect(() => {
        const loadMilestones = async () => {
            setLoading(true);
            try {
                const loadedMilestones = [];
                for (let i = 0; i < milestoneCount; i++) {
                    // Load milestone details from contract
                    // This will need to be implemented based on your contract's structure
                    loadedMilestones.push({
                        id: i,
                        description: `Milestone ${i + 1}`,
                        amount: 0n,
                        proofSubmitted: false,
                        approved: false,
                        fundsReleased: false,
                        yesVotes: 0,
                        noVotes: 0,
                    });
                }
                setMilestones(loadedMilestones);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load milestones"
                );
            } finally {
                setLoading(false);
            }
        };

        loadMilestones();
    }, [fundraiserId, milestoneCount]);

    const handleVote = async (milestoneId: number, voteYes: boolean) => {
        try {
            const hash = await vote({
                abi: fundAllocationABI,
                address: process.env
                    .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
                functionName: "voteMilestone",
                args: [fundraiserId, BigInt(milestoneId), voteYes],
            });
            if (hash) setPendingTx(hash);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to submit vote"
            );
        }
    };

    const handleSubmitProof = async (milestoneId: number) => {
        if (!proofInput) {
            setError("Please enter proof before submitting");
            return;
        }

        try {
            const hash = await submitProof({
                abi: fundAllocationABI,
                address: process.env
                    .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
                functionName: "submitProof",
                args: [fundraiserId, BigInt(milestoneId), proofInput],
            });
            if (hash) setPendingTx(hash);
            setProofInput("");
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to submit proof"
            );
        }
    };

    const handleReleaseFunds = async (milestoneId: number) => {
        try {
            const hash = await release({
                abi: fundAllocationABI,
                address: process.env
                    .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
                functionName: "releaseFunds",
                args: [fundraiserId, BigInt(milestoneId)],
            });
            if (hash) setPendingTx(hash);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to release funds"
            );
        }
    };

    if (loading) return <div>Loading milestones...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!milestones.length) return <div>No milestones found</div>;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Milestones</h3>
            {milestones.map((milestone) => (
                <div
                    key={milestone.id}
                    className="border p-4 rounded-lg">
                    <h4 className="font-medium">{milestone.description}</h4>
                    <p>Amount: {milestone.amount.toString()} ETH</p>

                    {!milestone.proofSubmitted && (
                        <div className="mt-2">
                            <input
                                type="text"
                                value={proofInput}
                                onChange={(e) => setProofInput(e.target.value)}
                                placeholder="Enter proof URL or text"
                                className="border p-2 rounded mr-2"
                            />
                            <button
                                onClick={() => handleSubmitProof(milestone.id)}
                                disabled={isConfirming}
                                className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                                {isConfirming
                                    ? "Submitting..."
                                    : "Submit Proof"}
                            </button>
                        </div>
                    )}

                    {milestone.proofSubmitted && !milestone.approved && (
                        <div className="mt-2 space-x-2">
                            <button
                                onClick={() => handleVote(milestone.id, true)}
                                disabled={isConfirming}
                                className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                                {isConfirming ? "Voting..." : "Vote Yes"}
                            </button>
                            <button
                                onClick={() => handleVote(milestone.id, false)}
                                disabled={isConfirming}
                                className="bg-red-500 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                                {isConfirming ? "Voting..." : "Vote No"}
                            </button>
                        </div>
                    )}

                    {milestone.approved && !milestone.fundsReleased && (
                        <button
                            onClick={() => handleReleaseFunds(milestone.id)}
                            disabled={isConfirming}
                            className="mt-2 bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                            {isConfirming ? "Releasing..." : "Release Funds"}
                        </button>
                    )}

                    <div className="mt-2 text-sm">
                        <p>Yes votes: {milestone.yesVotes}</p>
                        <p>No votes: {milestone.noVotes}</p>
                        <p>
                            Status:{" "}
                            {milestone.approved
                                ? "Approved"
                                : milestone.proofSubmitted
                                ? "Pending Approval"
                                : "Awaiting Proof"}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
