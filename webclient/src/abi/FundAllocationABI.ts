// Hardcoded ABI for FundAllocation contract
// Import from the generated ABI
import FundAllocationJson from "@/constants/FundAllocation.json";

export const FundAllocationABI = FundAllocationJson.abi;

// Hardcoded ABI for FundAllocation contract
// This avoids the build error with importing from outside the webclient directory
export const FundAllocationABI_Hardcoded = [
  // Basic ERC20 functions
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  
  // Multi-sig related functions
  {
    inputs: [],
    name: "getOwners",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "required",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getWithdrawalRequestCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_requestId", type: "uint256" }],
    name: "getWithdrawalRequest",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "fundraiserId", type: "uint256" },
          { internalType: "address", name: "to", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "string", name: "reason", type: "string" },
          { internalType: "bool", name: "executed", type: "bool" }
        ],
        internalType: "struct FundAllocation.WithdrawalRequest",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_requestId", type: "uint256" }],
    name: "getApprovers",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_requestId", type: "uint256" }],
    name: "approveWithdrawalRequest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_requestId", type: "uint256" }],
    name: "executeWithdrawalRequest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  
  // Fundraiser related functions
  {
    inputs: [
      { internalType: "uint256", name: "_fundraiserId", type: "uint256" },
      { internalType: "string", name: "_reason", type: "string" },
      { internalType: "uint256", name: "_amount", type: "uint256" }
    ],
    name: "createWithdrawalRequest",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "fundraisers",
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "string", name: "name", type: "string" },
      { internalType: "string", name: "description", type: "string" },
      { internalType: "uint256", name: "goal", type: "uint256" },
      { internalType: "uint256", name: "raised", type: "uint256" },
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "enum FundAllocation.FundraiserStatus", name: "status", type: "uint8" }
    ],
    stateMutability: "view",
    type: "function",
  }
]; 