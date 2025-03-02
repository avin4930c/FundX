const hre = require("hardhat");

async function main() {
  const [owner, validator1, validator2, validator3] = await hre.ethers.getSigners();
  const FundAllocation = await hre.ethers.getContractFactory("FundAllocation");
  const fundAllocation = await FundAllocation.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3"); // Your contract address

  const projectId = 0; // The project you want to validate

  console.log("\nValidating Project", projectId);
  console.log("Using validators:", {
    validator1: validator1.address,
    validator2: validator2.address,
    validator3: validator3.address
  });

  // Validator 1 validates
  await fundAllocation.connect(validator1).validateProject(projectId);
  console.log("Validator 1 validated");

  // Validator 2 validates
  await fundAllocation.connect(validator2).validateProject(projectId);
  console.log("Validator 2 validated");

  // Check project status
  const project = await fundAllocation.getProject(projectId);
  console.log("\nProject Status:", {
    validations: project.validations.toString(),
    completed: project.completed,
    released: project.released
  });

  // If completed, owner can release funds
  if (project.completed && !project.released) {
    console.log("\nReleasing funds...");
    await fundAllocation.connect(owner).releaseFunds(projectId);
    console.log("Funds released!");
  }
}

main().catch(console.error); 