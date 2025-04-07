// The address of the FundAllocation contract
export const MULTISIG_CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

// For local development (Hardhat)
export const LOCAL_HARDHAT_CHAIN_ID = 31337;

// Network labels
export const NETWORK_LABELS: { [chainId: number]: string } = {
    1: "Ethereum Mainnet",
    5: "Goerli Testnet",
    11155111: "Sepolia Testnet",
    31337: "Hardhat Local"
}; 