const hre = require("hardhat");

async function main() {
  const [owner, validator1, validator2, validator3] = await hre.ethers.getSigners();
  const FundAllocation = await hre.ethers.getContractFactory("FundAllocation");
  const fundAllocation = await FundAllocation.attach("YOUR_DEPLOYED_CONTRACT_ADDRESS");

  console.log("\n=== Testing Fund Allocation Flow ===");

  // 1. Owner allocates funds
  console.log("\n1. Allocating funds...");
  const tx1 = await fundAllocation.connect(owner).allocateFunds(
    "Test Project",
    "Test Description",
    validator3.address,
    { value: hre.ethers.parseEther("1.0") }
  );
  await tx1.wait();
  console.log("Funds allocated");

  // 2. Validators validate the project
  console.log("\n2. Validating project...");
  await fundAllocation.connect(validator1).validateProject(0);
  console.log("Validator 1 validated");
  await fundAllocation.connect(validator2).validateProject(0);
  console.log("Validator 2 validated");

  // 3. Check project status
  const project = await fundAllocation.getProject(0);
  console.log("\nProject status:", {
    completed: project.completed,
    validations: await fundAllocation.getProjectValidations(0)
  });

  // 4. Release funds if completed
  if (project.completed) {
    console.log("\n3. Releasing funds...");
    await fundAllocation.connect(owner).releaseFunds(0);
    console.log("Funds released");
  }
}

main().catch(console.error); 