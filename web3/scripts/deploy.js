const hre = require("hardhat");

async function main() {
  // Get all test accounts
  const [owner, validator1, validator2, validator3, validator4] = await hre.ethers.getSigners();

  console.log("\n=== Available Accounts ===");
  console.log("Owner/Deployer:", owner.address);
  console.log("Validator 1:", validator1.address);
  console.log("Validator 2:", validator2.address);
  console.log("Validator 3:", validator3.address);
  console.log("Validator 4:", validator4.address);

  console.log("\nDeploying FundAllocation...");
  const FundAllocation = await hre.ethers.getContractFactory("FundAllocation");
  const fundAllocation = await FundAllocation.deploy();
  await fundAllocation.waitForDeployment();

  const contractAddress = await fundAllocation.getAddress();
  console.log("Contract deployed to:", contractAddress);

  // Add validators
  console.log("\nAdding validators...");
  await fundAllocation.addValidator(validator1.address);
  await fundAllocation.addValidator(validator2.address);
  await fundAllocation.addValidator(validator3.address);

  console.log("\n=== Setup Complete ===");
  console.log("Contract Address:", contractAddress);
  console.log("\nValidator Addresses:");
  console.log("1:", validator1.address);
  console.log("2:", validator2.address);
  console.log("3:", validator3.address);

  console.log("\nTo test the system:");
  console.log("1. Use the owner account to allocate funds");
  console.log("2. Switch to validator accounts to validate projects");
  console.log("3. Use the owner account to release funds after validation");
}

main().catch((error) => {
  console.error("\nError:", error);
  process.exit(1);
});
