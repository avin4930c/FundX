const hre = require("hardhat");

async function main() {
  // Get the contract to deploy
  const FundAllocation = await hre.ethers.getContractFactory("FundAllocation");
  const fundAllocation = await FundAllocation.deploy();

  await fundAllocation.waitForDeployment();

  console.log(`✅ Contract deployed at: ${await fundAllocation.getAddress()}`);
}

// Run the script
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
