"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    useReadContract,
    useWriteContract,
} from "wagmi";
import { useAccount } from "wagmi";
import { Card, Button, Alert, Spinner, Badge, Tabs, Label, Textarea } from "flowbite-react";
import Image from "next/image";
import contractAbi from "@/abi/FundAllocation.json";
import { formatDate } from "@/lib/utils";
import { formatEther } from "viem";
import { HiCheckCircle, HiXCircle, HiDocumentText, HiClock } from "react-icons/hi";
import Link from "next/link";

interface MilestoneDetails {
    name: string;
    description: string;
    amount: bigint;
    deadline: number;
    status: number;
    proofUrl: string;
    proofNotes: string;
    proofSubmissionTimestamp: number;
}

interface FundraiserDetails {
    name: string;
    description: string;
    owner: string;
    milestones: MilestoneDetails[];
}

export default function ValidateMilestonePage() {
    const params = useParams();
    const router = useRouter();
    const { address, isConnected } = useAccount();
    const [isLoading, setIsLoading] = useState(true);
    const [isValidator, setIsValidator] = useState(false);
    const [error, setError] = useState("");
    const [fundraiser, setFundraiser] = useState<FundraiserDetails | null>(null);
    const [milestone, setMilestone] = useState<MilestoneDetails | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [actionSuccess, setActionSuccess] = useState("");

    const fundraiserId = params.fundraiserId as string;
    const milestoneId = parseInt(params.milestoneId as string);
    
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

    // Check if user is a validator
    const { data: validatorData } = useContractRead({
        address: contractAddress,
        abi: contractAbi.abi,
        functionName: "isValidator",
        args: [address],
        enabled: !!address,
    });

    useEffect(() => {
        if (validatorData !== undefined) {
            setIsValidator(validatorData);
        }
    }, [validatorData]);

    // Fetch fundraiser and milestone details
    useEffect(() => {
        const fetchData = async () => {
            if (!fundraiserId || !isValidator) return;
            
            try {
                const response = await fetch(`/api/fundraisers/${fundraiserId}`);
                if (!response.ok) throw new Error("Failed to fetch fundraiser data");
                
                const data = await response.json();
                setFundraiser(data);
                
                if (data.milestones && data.milestones[milestoneId]) {
                    setMilestone(data.milestones[milestoneId]);
                } else {
                    setError("Milestone not found");
                }
                
                setIsLoading(false);
            } catch (err) {
                console.error("Error fetching milestone data:", err);
                setError("Failed to load milestone data");
                setIsLoading(false);
            }
        };

        fetchData();
    }, [fundraiserId, milestoneId, isValidator]);

    // Contract write function for approving a withdrawal
    const { isLoading: isApprovingLoading, write: approveWithdrawal } = useContractWrite({
        address: contractAddress,
        abi: contractAbi.abi,
        functionName: "validateWithdrawalRequest",
    });

    // Contract write function for rejecting a withdrawal
    const { isLoading: isRejectingLoading, write: rejectWithdrawal } = useContractWrite({
        address: contractAddress,
        abi: contractAbi.abi,
        functionName: "rejectWithdrawalRequest",
    });

    const handleApprove = () => {
        if (!fundraiserId || !milestone) return;
        
        approveWithdrawal({
            args: [fundraiserId, milestoneId, true],
            onSuccess: () => {
                setActionSuccess("Withdrawal request approved successfully!");
                setTimeout(() => router.push('/validate-dashboard'), 2000);
            },
            onError: (error) => {
                setError(`Failed to approve: ${error.message}`);
            }
        });
    };

    const handleReject = () => {
        if (!fundraiserId || !milestone || !rejectionReason.trim()) {
            setError("Please provide a reason for rejection");
            return;
        }
        
        rejectWithdrawal({
            args: [fundraiserId, milestoneId, false, rejectionReason],
            onSuccess: () => {
                setActionSuccess("Withdrawal request rejected successfully!");
                setTimeout(() => router.push('/validate-dashboard'), 2000);
            },
            onError: (error) => {
                setError(`Failed to reject: ${error.message}`);
            }
        });
    };

    if (!isConnected) {
        return (
            <div className="container mx-auto p-4">
                <Alert color="info">Please connect your wallet to validate fund withdrawal requests.</Alert>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 flex justify-center">
                <Spinner size="xl" />
            </div>
        );
    }

    if (!isValidator) {
        return (
            <div className="container mx-auto p-4">
                <Alert color="warning">
                    You are not registered as a validator. Only validators can validate fund withdrawal requests.
                </Alert>
            </div>
        );
    }

    if (!milestone || !fundraiser) {
        return (
            <div className="container mx-auto p-4">
                <Alert color="failure">{error || "Milestone or fundraiser not found"}</Alert>
                <div className="mt-4">
                    <Button onClick={() => router.push('/validate-dashboard')}>Back to Dashboard</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <div className="mb-4 flex items-center gap-2">
                <Link href="/validate-dashboard">
                    <Button color="light" size="sm">Back to Dashboard</Button>
                </Link>
                <h1 className="text-2xl font-bold">Validate Fund Withdrawal Request</h1>
            </div>

            {error && <Alert color="failure" className="mb-4">{error}</Alert>}
            {actionSuccess && <Alert color="success" className="mb-4">{actionSuccess}</Alert>}

            <Card className="mb-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Fundraiser Details</h2>
                        <p className="text-sm text-gray-500 mb-1">Fundraiser Name</p>
                        <p className="font-bold text-lg mb-3">{fundraiser.name}</p>
                        
                        <p className="text-sm text-gray-500 mb-1">Description</p>
                        <p className="mb-3">{fundraiser.description}</p>
                        
                        <p className="text-sm text-gray-500 mb-1">Owner</p>
                        <p className="font-mono text-sm">{fundraiser.owner}</p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold mb-4">Milestone Details</h2>
                        
                        <div className="flex items-center mb-3">
                            <p className="text-sm text-gray-500 mr-2">Status:</p>
                            <Badge 
                                color={milestone.status === 1 ? "purple" : "gray"} 
                                icon={milestone.status === 1 ? HiClock : undefined}
                            >
                                {milestone.status === 1 ? "Pending Validation" : "Unknown Status"}
                            </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-1">Milestone Name</p>
                        <p className="font-bold text-lg mb-3">{milestone.name}</p>
                        
                        <p className="text-sm text-gray-500 mb-1">Description</p>
                        <p className="mb-3">{milestone.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Amount Requested</p>
                                <p className="font-bold">{formatEther(milestone.amount)} ETH</p>
                            </div>
                            
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Deadline</p>
                                <p>{formatDate(milestone.deadline)}</p>
                            </div>
                            
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Proof Submitted</p>
                                <p>{formatDate(milestone.proofSubmissionTimestamp)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Proof Review</h2>
                
                <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Proof URL</p>
                    {milestone.proofUrl ? (
                        <div className="flex items-center">
                            <HiDocumentText className="mr-2 text-blue-600" />
                            <a 
                                href={milestone.proofUrl} 
                                target="_blank" 
    // Check if milestone is in the right state for validation
    if (milestone.status !== 1) {
        // Not in PROOF_SUBMITTED state
        return (
            <div className="container mx-auto p-4">
                <Alert color="warning">
                    This milestone is not currently awaiting validation. Current
                    status:{" "}
                    {milestone.status === 0
                        ? "Pending"
                        : milestone.status === 2
                        ? "Approved"
                        : milestone.status === 3
                        ? "Rejected"
                        : milestone.status === 4
                        ? "Funds Released"
                        : "Unknown"}
                </Alert>
                <Button
                    className="mt-4"
                    onClick={() => router.push("/validate-dashboard")}>
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <Button
                className="mb-4"
                onClick={() => router.push("/validate-dashboard")}>
                ← Back to Dashboard
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="mb-6">
                        <h1 className="text-2xl font-bold mb-2">
                            {fundraiser.name}
                        </h1>
                        <Badge
                            color="purple"
                            className="mb-4">
                            Milestone: {milestone.name}
                        </Badge>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Request Amount
                                </p>
                                <p className="font-bold">
                                    {formatEther(milestone.amount)} ETH
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">
                                    Deadline
                                </p>
                                <p className="font-bold">
                                    {formatDate(milestone.deadline)}
                                </p>
                            </div>
                        </div>

                        <h2 className="text-lg font-semibold mb-2">
                            Milestone Description
                        </h2>
                        <p className="mb-4">{milestone.description}</p>
                    </Card>

                    <Card className="mb-6">
                        <h2 className="text-lg font-semibold mb-4">
                            Submitted Proof
                        </h2>
                        <p className="mb-4">{proofDetails.description}</p>

                        {proofDetails.proofUrl && (
                            <div className="mb-4">
                                <h3 className="text-md font-medium mb-2">
                                    Attached Files/Evidence:
                                </h3>
                                <div className="flex flex-col space-y-2">
                                    <a
                                        href={proofDetails.proofUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline flex items-center">
                                        <svg
                                            className="w-4 h-4 mr-2"
                                            fill="currentColor"
                                            viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        View Submitted Evidence
                                    </a>
                                </div>
                            </div>
                        )}

                        {proofDetails.submittedAt && (
                            <p className="text-sm text-gray-500">
                                Submitted on:{" "}
                                {formatDate(proofDetails.submittedAt)}
                            </p>
                        )}
                    </Card>
                </div>

                <div className="lg:col-span-1">
                    <Card className="mb-6">
                        <h2 className="text-lg font-semibold mb-4">
                            Validation Actions
                        </h2>

                        {error && (
                            <Alert
                                color="failure"
                                className="mb-4">
                                {error}
                            </Alert>
                        )}
                        {(approveError || rejectError) && (
                            <Alert
                                color="failure"
                                className="mb-4">
                                {approveError?.message ||
                                    rejectError?.message ||
                                    "Transaction error"}
                            </Alert>
                        )}

                        <div className="space-y-4">
                            <Button
                                color="green"
                                className="w-full"
                                onClick={handleApprove}
                                disabled={
                                    isApproving || isRejecting || isWaitingTx
                                }>
                                {isApproving || (isWaitingTx && approveData) ? (
                                    <>
                                        <Spinner
                                            size="sm"
                                            className="mr-2"
                                        />
                                        Processing...
                                    </>
                                ) : (
                                    "Approve Milestone"
                                )}
                            </Button>

                            <Button
                                color="red"
                                className="w-full"
                                onClick={handleReject}
                                disabled={
                                    isApproving || isRejecting || isWaitingTx
                                }>
                                {isRejecting || (isWaitingTx && rejectData) ? (
                                    <>
                                        <Spinner
                                            size="sm"
                                            className="mr-2"
                                        />
                                        Processing...
                                    </>
                                ) : (
                                    "Reject Milestone"
                                )}
                            </Button>
                        </div>

                        <div className="mt-4 text-sm text-gray-500">
                            <p className="mb-2">
                                <strong>Note:</strong> Your validation decision
                                cannot be undone after submission.
                            </p>
                            <p>
                                Please carefully review all evidence before
                                making a decision.
                            </p>
                        </div>
                    </Card>

                    <Card>
                        <h2 className="text-lg font-semibold mb-4">
                            Fundraiser Info
                        </h2>
                        <div className="space-y-2">
                            <p>
                                <span className="font-medium">Creator:</span>{" "}
                                {fundraiser.organizer}
                            </p>
                            <p>
                                <span className="font-medium">Target:</span>{" "}
                                {formatEther(fundraiser.targetAmount)} ETH
                            </p>
                            <p>
                                <span className="font-medium">Raised:</span>{" "}
                                {formatEther(fundraiser.raisedAmount)} ETH
                            </p>
                            <p>
                                <span className="font-medium">Status:</span>{" "}
                                {fundraiser.isActive ? (
                                    <Badge color="green">Active</Badge>
                                ) : (
                                    <Badge color="gray">Inactive</Badge>
                                )}
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
