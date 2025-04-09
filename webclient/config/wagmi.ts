import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, hardhat } from 'wagmi/chains';
import { http as viemHttp } from 'viem';

// Contract ABI and addresses
export const FUND_ALLOCATION_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

// Ensure we have a valid RPC URL with a fallback
const ALCHEMY_RPC = process.env.NEXT_PUBLIC_ALCHEMY_RPC || 'http://127.0.0.1:8545';

// CRITICAL: WalletConnect requires a valid project ID
// Use a default value or the one from env
const WALLET_CONNECT_ID = process.env.NEXT_PUBLIC_WALLET_CONNECT_ID || 'f75c284288f3bd47665ff375e109126f';

// Log the configuration values for debugging once
if (typeof window !== 'undefined') {
  console.log('FUND_ALLOCATION_ADDRESS', FUND_ALLOCATION_ADDRESS);
  console.log('ALCHEMY_RPC', ALCHEMY_RPC);
  console.log('Using WalletConnect ID:', WALLET_CONNECT_ID.substring(0, 6) + '...');
}

// Create the wagmi config with minimal options to avoid issues
export const wagmiConfig = getDefaultConfig({
  appName: 'FundX',
  projectId: WALLET_CONNECT_ID,
  chains: [sepolia, hardhat],
  transports: {
    [sepolia.id]: viemHttp(ALCHEMY_RPC),
    [hardhat.id]: viemHttp('http://127.0.0.1:8545')
  },
  // Don't use SSR for WalletConnect to prevent hydration issues
  ssr: false
});