import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { hardhat } from 'viem/chains';

// Configure the client with the correct chain
const client = createPublicClient({
  chain: hardhat,
  transport: http('http://127.0.0.1:8545'),
});

export async function POST(request: Request) {
  try {
    const { address, abi, functionName, args } = await request.json();

    // Validate required parameters
    if (!address || !abi || !functionName) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Call the contract function
    const data = await client.readContract({
      address: address as `0x${string}`,
      abi,
      functionName,
      args: args || [],
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Contract read error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to read contract' },
      { status: 500 }
    );
  }
} 