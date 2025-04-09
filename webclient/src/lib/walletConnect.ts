// Simple WalletConnect configuration that works reliably
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http, fallback } from 'viem';
import { hardhat, sepolia } from 'wagmi/chains';

// Get project ID from environment or use a fallback for development
// This should match the project ID from WalletConnect Cloud
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_ID || 'f75c284288f3bd47665ff375e109126f';

console.log("Using WalletConnect Project ID:", projectId ? "✓ Set" : "✗ NOT SET");

// Add error handling to prevent empty error objects
const logError = (error: unknown) => {
  console.error("Wallet connection error:", error || "Unknown error");
  return error; // Pass through the error after logging
};

// Use a more resilient transport configuration with fallbacks
const transports = {
  [hardhat.id]: fallback([
    http('http://127.0.0.1:8545'),
    http()
  ]),
  [sepolia.id]: fallback([
    http('https://eth-sepolia.public.blastapi.io'),
    http()
  ])
};

// Create wagmi config with error handling
const createWagmiConfig = () => {
  try {
    return getDefaultConfig({
      appName: 'FundX',
      projectId,
      chains: [hardhat, sepolia],
      transports,
      ssr: false
    });
  } catch (error) {
    console.error('Failed to initialize wallet config:', error);
    
    // Fallback configuration with minimal options
    try {
      return getDefaultConfig({
        appName: 'FundX',
        projectId,
        chains: [hardhat],
        transports: {
          [hardhat.id]: http('http://127.0.0.1:8545')
        },
        ssr: false
      });
    } catch (fallbackError) {
      console.error('Critical error with wallet configuration:', fallbackError);
      // Return null to let the application handle the absence of config
      return null;
    }
  }
};

// Export the wagmi configuration or null if initialization fails
export const wagmiConfig = createWagmiConfig();

// Add global error handler for wallet connection errors
if (typeof window !== 'undefined') {
  // Handle empty error objects
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && Object.keys(event.reason).length === 0) {
      console.warn('Empty error object caught:', event);
      event.preventDefault(); // Prevent the default error handling
    }
  });
  
  // Handle general window errors
  window.addEventListener('error', (event) => {
    // Prevent blockchain-related errors from crashing the app
    if (event.message && (
      event.message.includes('MetaMask') || 
      event.message.includes('wallet') ||
      event.message.includes('ethereum') ||
      event.message.includes('provider')
    )) {
      console.warn('Blockchain error caught:', event.message);
      event.preventDefault();
    }
  });
} 