require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // Load .env file

console.log("SEPOLIA RPC URL:", process.env.SEPOLIA_RPC_URL);
console.log("PRIVATE KEY:", process.env.PRIVATE_KEY ? "Loaded" : "Not Loaded");
console.log("ETHERSCAN API KEY:", process.env.ETHERSCAN_API_KEY);

module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
    local: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 5  // Creates 5 accounts
      }
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  sourcify: {
    enabled: true,
  },
};
