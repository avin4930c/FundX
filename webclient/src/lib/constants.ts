// Contract addresses
export const FUND_ALLOCATION_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Default Hardhat deployment address

// Logging contract address for debugging
if (typeof window !== 'undefined') {
  console.log("Using contract address:", FUND_ALLOCATION_ADDRESS);
  
  // Warn if using default address
  if (FUND_ALLOCATION_ADDRESS === '0x5FbDB2315678afecb367f032d93F642f64180aa3') {
    console.warn("Using default contract address. Make sure your local Hardhat node is running.");
  }
  
  // Validate address format
  if (!FUND_ALLOCATION_ADDRESS || !FUND_ALLOCATION_ADDRESS.startsWith('0x') || FUND_ALLOCATION_ADDRESS.length !== 42) {
    console.error("Contract address is in invalid format:", FUND_ALLOCATION_ADDRESS);
  }
} 