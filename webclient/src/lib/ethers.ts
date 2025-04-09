import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

// Create a public client for Ethereum operations
export const getPublicClient = async () => {
  try {
    // Create a new public client
    const publicClient = createPublicClient({
      chain: mainnet,
      transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo'),
    });
    
    return publicClient;
  } catch (error) {
    console.error('Failed to create public client:', error);
    return null;
  }
}; 