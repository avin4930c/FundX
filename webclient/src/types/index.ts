export type Milestone = {
    description: string;
    amount: bigint;
    proof: string;
    proofSubmitted: boolean;
    approved: boolean;
    fundsReleased: boolean;
    yesVotes: bigint;
    noVotes: bigint;
};

export type Fundraiser = {
    id: number;
    creator: string;
    title: string;
    description: string;
    targetAmount: bigint;
    raisedAmount: bigint;
    active: boolean;
    milestoneCount: number;
    currentMilestoneIndex: number;
    milestones: Milestone[];
    progress: number;
}; 