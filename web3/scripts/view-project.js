const hre = require("hardhat");

async function main() {
  const [owner] = await hre.ethers.getSigners();
  const FundAllocation = await hre.ethers.getContractFactory("FundAllocation");
  const fundAllocation = await FundAllocation.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3"); // Your contract address

  // Get project count
  const projectCount = await fundAllocation.getProjectCount();
  console.log("\nTotal Projects:", projectCount.toString());

  // Get latest project details
  const projectId = projectCount - 1n;
  const project = await fundAllocation.getProject(projectId);
  
  console.log("\nLatest Project Details:");
  console.log("Name:", project.name);
  console.log("Description:", project.description);
  console.log("Recipient:", project.recipient);
  console.log("Amount:", hre.ethers.formatEther(project.amount), "ETH");
  console.log("Validations:", project.validations.toString());
  console.log("Completed:", project.completed);
  console.log("Released:", project.released);

  // Get validators
  const validators = await fundAllocation.getValidators();
  console.log("\nValidators:", validators);
}

main().catch(console.error); 