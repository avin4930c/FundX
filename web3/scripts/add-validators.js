const hre = require("hardhat");

async function main() {
  const [owner, validator1, validator2, validator3] = await hre.ethers.getSigners();
  const FundAllocation = await hre.ethers.getContractFactory("FundAllocation");
  const fundAllocation = await FundAllocation.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3"); // Your contract address

  console.log("\nChecking and adding validators...");
  
  // Helper function to add validator safely
  async function addValidatorSafely(validator, index) {
    try {
      // Check if already a validator
      const validatorInfo = await fundAllocation.validators(validator.address);
      if (validatorInfo.isActive) {
        console.log(`Validator ${index} (${validator.address}) is already registered`);
        return;
      }

      // Add new validator
      await fundAllocation.addValidator(validator.address);
      console.log(`Added validator ${index}:`, validator.address);
    } catch (error) {
      console.error(`Error processing validator ${index}:`, error.message);
    }
  }

  // Add validators with checks
  await addValidatorSafely(validator1, 1);
  await addValidatorSafely(validator2, 2);
  await addValidatorSafely(validator3, 3);

  // List all current validators
  const validators = await fundAllocation.getValidators();
  console.log("\nCurrent validators:", validators);

  // Show validator details
  console.log("\nValidator Details:");
  for (const addr of validators) {
    const info = await fundAllocation.validators(addr);
    console.log(`Address: ${addr}`);
    console.log(`Active: ${info.isActive}`);
    console.log(`Validations: ${info.validationsCount}`);
    console.log("------------------------");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 