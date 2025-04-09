"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { useAccount, usePublicClient } from "wagmi";
import { FUND_ALLOCATION_ADDRESS } from "@/lib/constants";
import { fundAllocationABI } from "@/contracts/abis";
import { isFundraiserCreator } from "@/lib/validators";

// Types
export interface MilestoneType {
    id: number;
    description: string;
    amount: bigint;
    proof: string;
    proofSubmitted: boolean;
    approved: boolean;
    fundsReleased: boolean;
    requiresProof: boolean;
    yesVotes: number;
    noVotes: number;
    fundraiserId: number;
}

export interface FundraiserType {
    id: number;
    name: string;
    description: string;
    targetAmount: bigint;
    raisedAmount: bigint;
    active: boolean;
    milestoneCount: number;
    currentMilestoneIndex: number;
    creator: string;
}

interface FundRequestContextType {
    fundraisers: FundraiserType[];
    milestones: MilestoneType[];
    pendingApprovals: MilestoneType[];
    isLoading: boolean;
    error: string | null;
    refreshData: () => Promise<void>;
}

// Create context
const FundRequestContext = createContext<FundRequestContextType>({
    fundraisers: [],
    milestones: [],
    pendingApprovals: [],
    isLoading: false,
    error: null,
    refreshData: async () => {},
});

// Provider component
export function FundRequestProvider({ children }: { children: ReactNode }) {
    const [fundraisers, setFundraisers] = useState<FundraiserType[]>([]);
    const [milestones, setMilestones] = useState<MilestoneType[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<MilestoneType[]>(
        []
    );
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();

    // Function to fetch all data
    const fetchData = async () => {
        if (!publicClient || !isConnected) {
            console.log("Client not ready or wallet not connected");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Get the total number of fundraisers
            const count = await publicClient.readContract({
                address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "getFundraiserCount",
            });

            console.log(`Total fundraiser count: ${Number(count)}`);

            const userFundraisers: FundraiserType[] = [];
            const allMilestones: MilestoneType[] = [];
            const approvalNeeded: MilestoneType[] = [];

            // Loop through all fundraisers
            for (let i = 0; i < Number(count); i++) {
                try {
                    const fundraiser = (await publicClient.readContract({
                        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                        abi: fundAllocationABI,
                        functionName: "getFundraiserDetails",
                        args: [i],
                    })) as any[];

                    const creatorAddress = fundraiser[0]; // creator is first in the returned array
                    const isOwner = isFundraiserCreator(
                        creatorAddress,
                        address
                    );
                    const isValidator = await publicClient.readContract({
                        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                        abi: fundAllocationABI,
                        functionName: "isValidator",
                        args: [i, address],
                    });

                    // Save fundraiser data if user is owner or validator
                    if (isOwner || isValidator) {
                        const fundraiserData: FundraiserType = {
                            id: i,
                            name: fundraiser[1], // title
                            description: fundraiser[2],
                            targetAmount: fundraiser[3],
                            raisedAmount: fundraiser[4],
                            active: fundraiser[5],
                            milestoneCount: Number(fundraiser[6]),
                            currentMilestoneIndex: Number(fundraiser[7]),
                            creator: creatorAddress,
                        };

                        userFundraisers.push(fundraiserData);

                        // Fetch milestones for this fundraiser
                        for (
                            let j = 0;
                            j < fundraiserData.milestoneCount;
                            j++
                        ) {
                            try {
                                const milestone =
                                    (await publicClient.readContract({
                                        address:
                                            FUND_ALLOCATION_ADDRESS as `0x${string}`,
                                        abi: fundAllocationABI,
                                        functionName: "getMilestone",
                                        args: [i, j],
                                    })) as any[];

                                const milestoneData: MilestoneType = {
                                    id: j,
                                    description: milestone[0],
                                    amount: milestone[1],
                                    proof: milestone[2],
                                    proofSubmitted: milestone[3],
                                    approved: milestone[4],
                                    fundsReleased: milestone[5],
                                    requiresProof: milestone[6],
                                    yesVotes: Number(milestone[7]),
                                    noVotes: Number(milestone[8]),
                                    fundraiserId: i,
                                };

                                allMilestones.push(milestoneData);

                                // Check if this milestone needs approval and the user is a validator
                                if (
                                    isValidator &&
                                    j ===
                                        fundraiserData.currentMilestoneIndex &&
                                    !milestoneData.approved &&
                                    !milestoneData.fundsReleased
                                ) {
                                    // Check if user has already voted
                                    const hasVoted =
                                        await publicClient.readContract({
                                            address:
                                                FUND_ALLOCATION_ADDRESS as `0x${string}`,
                                            abi: fundAllocationABI,
                                            functionName: "hasVoted",
                                            args: [i, j, address],
                                        });

                                    if (!hasVoted) {
                                        approvalNeeded.push(milestoneData);
                                    }
                                }
                            } catch (error) {
                                console.error(
                                    `Error fetching milestone ${j} for fundraiser ${i}:`,
                                    error
                                );
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error fetching fundraiser ${i}:`, error);
                }
            }

            setFundraisers(userFundraisers);
            setMilestones(allMilestones);
            setPendingApprovals(approvalNeeded);

            console.log(
                `Found ${userFundraisers.length} fundraisers for user ${address}`
            );
            console.log(`Found ${allMilestones.length} milestones total`);
            console.log(`Found ${approvalNeeded.length} pending approvals`);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Failed to load fund requests. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch data when wallet connects or changes
    useEffect(() => {
        try {
            if (isConnected && publicClient) {
                fetchData();
            }
        } catch (error) {
            console.error("Error in initial data fetch:", error);
            setError("Failed to initialize data fetching");
        }
    }, [isConnected, publicClient, address]);

    return (
        <FundRequestContext.Provider
            value={{
                fundraisers,
                milestones,
                pendingApprovals,
                isLoading,
                error,
                refreshData: fetchData,
            }}>
            {children}
        </FundRequestContext.Provider>
    );
}

// Custom hook to use the fund request context
export function useFundRequests() {
    return useContext(FundRequestContext);
}
