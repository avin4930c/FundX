import { NextRequest, NextResponse } from "next/server";
import { parseEther } from "viem";

// Mock database of fundraisers
const fundraisers = [
  {
    id: 0,
    name: "Community Garden Project",
    description: "Creating a garden for the local community to grow fresh produce",
    creator: "0x1234...5678",
    targetAmount: parseEther("2.5"),
    currentAmount: parseEther("1.2"),
    deadline: BigInt(Math.floor(Date.now() / 1000) + 86400 * 7), // 7 days from now
    active: true,
    progress: 48, // 1.2 / 2.5 = 0.48 = 48%
    timeLeft: "7 days left",
  },
  {
    id: 1,
    name: "Tech Education for Kids",
    description: "Providing coding classes for underprivileged children",
    creator: "0x2345...6789",
    targetAmount: parseEther("3.0"),
    currentAmount: parseEther("2.4"),
    deadline: BigInt(Math.floor(Date.now() / 1000) + 86400 * 3), // 3 days from now
    active: true,
    progress: 80, // 2.4 / 3.0 = 0.8 = 80%
    timeLeft: "3 days left",
  },
  {
    id: 2,
    name: "Clean Water Initiative",
    description: "Installing water purification systems in rural areas",
    creator: "0x3456...7890",
    targetAmount: parseEther("5.0"),
    currentAmount: parseEther("1.5"),
    deadline: BigInt(Math.floor(Date.now() / 1000) + 86400 * 14), // 14 days from now
    active: true,
    progress: 30, // 1.5 / 5.0 = 0.3 = 30%
    timeLeft: "14 days left",
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    // Check if the ID is valid
    if (isNaN(id) || id < 0) {
      return NextResponse.json(
        { error: "Invalid fundraiser ID" },
        { status: 400 }
      );
    }
    
    // In a real application, you would fetch the fundraiser from your contract or database
    // For now, generate a fundraiser based on ID
    const fundraiser = id < fundraisers.length 
      ? fundraisers[id]
      : {
          id,
          name: `Fundraiser #${id}`,
          description: `This is fundraiser number ${id} created through the contract`,
          creator: "0x1234...5678",
          targetAmount: parseEther(`${2 + id * 0.5}`),
          currentAmount: parseEther(`${0.5 + id * 0.2}`),
          deadline: BigInt(Math.floor(Date.now() / 1000) + 86400 * (7 + id)), 
          active: true,
          progress: 20 + id * 10, 
          timeLeft: `${7 + id} days left`,
        };
    
    // Convert BigInt to strings for JSON serialization
    const serializedFundraiser = {
      ...fundraiser,
      targetAmount: fundraiser.targetAmount.toString(),
      currentAmount: fundraiser.currentAmount.toString(),
      deadline: fundraiser.deadline.toString(),
    };
    
    return NextResponse.json(serializedFundraiser);
  } catch (error) {
    console.error("Error fetching fundraiser:", error);
    return NextResponse.json(
      { error: "Failed to fetch fundraiser" },
      { status: 500 }
    );
  }
} 