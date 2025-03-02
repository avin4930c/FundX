const hre = require("hardhat");

async function main() {
  const fundAllocation = await hre.ethers.getContractFactory("FundAllocation")
    .then(f => f.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3")); // Your contract address

  const projectId = 0; // The project you want to monitor

  // Get project details
  const project = await fundAllocation.getProject(projectId);
  
  // Get all validators
  const validators = await fundAllocation.getValidators();
  
  console.log("\nProject Status:");
  console.log("Validations received:", project.validations.toString());
  console.log("Required validations:", await fundAllocation.requiredValidations());
  console.log("Completed:", project.completed);
  console.log("Released:", project.released);

  console.log("\nValidator Status:");
  for (const validator of validators) {
    const hasValidated = await fundAllocation.hasValidated(projectId, validator);
    console.log(`${validator}: ${hasValidated ? '✓ Validated' : '✗ Not validated'}`);
  }
}

main().catch(console.error); 