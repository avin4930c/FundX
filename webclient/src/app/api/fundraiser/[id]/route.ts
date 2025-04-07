import { NextRequest, NextResponse } from "next/server";
import { parseEther } from "viem";

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
    
    // In a real application, you would fetch the fundraiser from your contract
    // For now, return an error as we don't want to use mock data
    return NextResponse.json(
      { error: "Fundraiser not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching fundraiser:", error);
    return NextResponse.json(
      { error: "Failed to fetch fundraiser" },
      { status: 500 }
    );
  }
} 