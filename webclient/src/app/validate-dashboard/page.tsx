"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useContractRead } from "wagmi";
import { useAccount } from "wagmi";
import { Card, Button, Alert, Spinner, Badge, Table } from "flowbite-react";
import contractAbi from "@/abi/FundAllocation.json";
import { formatDate } from "@/lib/utils";
import { formatEther } from "viem";
import { HiClock, HiEye } from "react-icons/hi";

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
    id: string;
    name: string;
    description: string;
    owner: string;
    milestones: MilestoneDetails[];
}

export default function ValidatorDashboardPage() {
    const router = useRouter();
    const { address, isConnected } = useAccount();

    const [isLoading, setIsLoading] = useState(true);
    const [isValidator, setIsValidator] = useState(false);
    const [error, setError] = useState("");
    const [pendingRequests, setPendingRequests] = useState<
        {
            fundraiserId: string;
            fundraiserName: string;
            milestoneId: number;
            milestoneName: string;
            amount: bigint;
            submissionDate: number;
        }[]
    >([]);

    const contractAddress = process.env
        .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

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
            setIsValidator(validatorData as boolean);

            if (validatorData as boolean) {
                fetchPendingRequests();
            } else {
                setIsLoading(false);
            }
        }
    }, [validatorData, address]);

    const fetchPendingRequests = async () => {
        try {
            // Fetch all fundraisers
            const response = await fetch("/api/fundraisers");
            if (!response.ok) throw new Error("Failed to fetch fundraisers");

            const fundraisers: FundraiserDetails[] = await response.json();
            const requests = [];

            // Filter fundraisers with pending milestones (status = 1)
            for (const fundraiser of fundraisers) {
                if (!fundraiser.milestones) continue;

                for (let i = 0; i < fundraiser.milestones.length; i++) {
                    const milestone = fundraiser.milestones[i];

                    if (milestone.status === 1) {
                        // Status 1 is pending validation
                        requests.push({
                            fundraiserId: fundraiser.id,
                            fundraiserName: fundraiser.name,
                            milestoneId: i,
                            milestoneName: milestone.name,
                            amount: milestone.amount,
                            submissionDate: milestone.proofSubmissionTimestamp,
                        });
                    }
                }
            }

            setPendingRequests(requests);
            setIsLoading(false);
        } catch (err) {
            console.error("Error fetching pending requests:", err);
            setError("Failed to load pending validation requests");
            setIsLoading(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="container mx-auto p-4">
                <Alert color="info">
                    Please connect your wallet to view your validator dashboard.
                </Alert>
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
                    You are not registered as a validator. Only validators can
                    access this dashboard.
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Validator Dashboard</h1>

            {error && (
                <Alert
                    color="failure"
                    className="mb-4">
                    {error}
                </Alert>
            )}

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">
                        Pending Validation Requests
                    </h2>
                    <Button
                        color="light"
                        size="sm"
                        onClick={() => fetchPendingRequests()}>
                        Refresh
                    </Button>
                </div>

                {pendingRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No pending validation requests at this time.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <Table.Head>
                                <Table.HeadCell>Fundraiser</Table.HeadCell>
                                <Table.HeadCell>Milestone</Table.HeadCell>
                                <Table.HeadCell>Amount</Table.HeadCell>
                                <Table.HeadCell>Submission Date</Table.HeadCell>
                                <Table.HeadCell>Status</Table.HeadCell>
                                <Table.HeadCell>Action</Table.HeadCell>
                            </Table.Head>
                            <Table.Body className="divide-y">
                                {pendingRequests.map((request, index) => (
                                    <Table.Row
                                        key={index}
                                        className="bg-white">
                                        <Table.Cell className="whitespace-nowrap font-medium text-gray-900">
                                            {request.fundraiserName}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {request.milestoneName}
                                        </Table.Cell>
                                        <Table.Cell>
                                            {formatEther(request.amount)} ETH
                                        </Table.Cell>
                                        <Table.Cell>
                                            {formatDate(request.submissionDate)}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge
                                                color="purple"
                                                icon={HiClock}>
                                                Pending
                                            </Badge>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Button
                                                size="xs"
                                                onClick={() =>
                                                    router.push(
                                                        `/validate/${request.fundraiserId}/${request.milestoneId}`
                                                    )
                                                }>
                                                <HiEye className="mr-2 h-4 w-4" />
                                                Review
                                            </Button>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    </div>
                )}
            </Card>
        </div>
    );
}
