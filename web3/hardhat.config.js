require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // Load .env file

console.log("SEPOLIA RPC URL:", process.env.SEPOLIA_RPC_URL);
console.log("PRIVATE KEY:", process.env.PRIVATE_KEY ? "Loaded" : "Not Loaded");
console.log("ETHERSCAN API KEY:", process.env.ETHERSCAN_API_KEY);

module.exports = {
    solidity: {
        version: "0.8.24",
        settings: {
            optimizer: {
                enabled: true,
                runs: 20, // Lower value optimizes more for contract size at the expense of higher gas costs
            },
            viaIR: true, // Enable IR-based code generation (can help with large contracts)
        },
    },
    networks: {
        sepolia: {
            url: process.env.SEPOLIA_RPC_URL,
            accounts: [process.env.PRIVATE_KEY],
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 31337,
        },
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
    sourcify: {
        enabled: true,
    },
};
