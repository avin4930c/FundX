import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, hardhat } from 'wagmi/chains';
import { fallback, http as viemHttp } from 'viem';

// Contract ABI and addresses
export const FUND_ALLOCATION_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

export const wagmiConfig = getDefaultConfig({
  appName: 'FundX - Transparent Fund Tracking',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID || '',
  chains: [sepolia, hardhat],
  transports: {
    [sepolia.id]: fallback([
      viemHttp(process.env.NEXT_PUBLIC_ALCHEMY_RPC),
      viemHttp()
    ]),
    [hardhat.id]: viemHttp('http://127.0.0.1:8545')
  },
  ssr: true,
});