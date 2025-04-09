import { parseEther } from "viem";
import { fundAllocationABI } from "@/contracts/abis";
import { formatEther } from "ethers";

/**
 * Utility function to add milestones to a fundraiser
 * 
 * @param writeContract - The write contract function from wagmi
 * @param contractAddress - The contract address
 * @param fundraiserId - The newly created fundraiser ID
 * @param milestones - Array of milestone objects with description and amount
 * @returns Promise that resolves when all milestones are added
 */
export async function addMilestonesToFundraiser(
    writeContract: any,
    contractAddress: string,
    fundraiserId: bigint,
    milestones: { description: string; amount: string }[]
): Promise<string[]> {
    const hashes: string[] = [];
    
    // Add milestones sequentially
    for (const milestone of milestones) {
        try {
            // Convert amount to wei
            const amountInWei = parseEther(milestone.amount);
            
            // Clean the description to remove problematic characters
            const cleanDescription = milestone.description.replace(/[,\.\/\\]/g, " ");
            console.log(`Adding milestone with cleaned description: ${cleanDescription}`);

            // Call the contract to add the milestone
            const hash = await writeContract({
                address: contractAddress as `0x${string}`,
                abi: fundAllocationABI,
                functionName: "addMilestone",
                args: [fundraiserId, cleanDescription, amountInWei],
            });
            
            hashes.push(hash);
            
            // Wait a bit before sending the next transaction to avoid nonce issues
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.error("Error adding milestone:", error, milestone);
            throw error;
        }
    }
    
    return hashes;
}

/**
 * Format ETH amount with appropriate precision
 */
export function formatEthAmount(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(num)) return '0 ETH';
    
    // Format small numbers with more precision to avoid showing 0
    if (num < 0.001) return `${num.toFixed(6)} ETH`;
    if (num < 0.01) return `${num.toFixed(4)} ETH`;
    
    return `${num.toFixed(3)} ETH`;
}

/**
 * Helper to calculate progress percentage
 */
export function calculateProgress(raised: bigint, target: bigint): number {
    if (target === BigInt(0)) return 0;
    return Number((raised * BigInt(100)) / target);
}

/**
 * Helper to calculate total amount from milestones
 */
export function calculateTotalMilestoneAmount(milestones: { amount: string }[]): number {
    return milestones.reduce((sum, milestone) => sum + (parseFloat(milestone.amount) || 0), 0);
}

// Placeholder type for fundraiser data
export interface Fundraiser {
    id: bigint;
    creator: string;
    name: string;
    description: string;
    goal: bigint;
    raised: bigint;
    endDate: bigint;
    status: number;
    formattedGoal?: string;
    formattedRaised?: string;
    endDateString?: string;
    progress?: number;
}

export function formatFundraiser(fundraiser: Fundraiser): Fundraiser {
    const formattedGoal = formatEther(fundraiser.goal);
    const formattedRaised = formatEther(fundraiser.raised);
    const endDateString = new Date(
        Number(fundraiser.endDate) * 1000
    ).toLocaleDateString();
    
    // Calculate progress (raised/goal as percentage)
    const progress = 
        fundraiser.raised > BigInt(0) 
            ? (Number(fundraiser.raised) * 100) / Number(fundraiser.goal) 
            : 0;

    return {
        ...fundraiser,
        formattedGoal,
        formattedRaised,
        endDateString,
        progress,
    };
}

export function getFundraiserStatus(status: number): string {
    switch (status) {
        case 0:
            return "Active";
        case 1:
            return "Completed";
        case 2:
            return "Expired";
        case 3:
            return "Cancelled";
        default:
            return "Unknown";
    }
}

export function getStatusClass(status: number): string {
    switch (status) {
        case 0:
            return "bg-green-100 text-green-800";
        case 1:
            return "bg-blue-100 text-blue-800";
        case 2:
            return "bg-yellow-100 text-yellow-800";
        case 3:
            return "bg-red-100 text-red-800";
        default:
            return "bg-gray-100 text-gray-800";
    }
} 