const hre = require("hardhat");

async function main() {
    // Get all test accounts
    const [owner, validator1, validator2, validator3, validator4] =
        await hre.ethers.getSigners();

    console.log("\n=== Available Accounts ===");
    console.log("Owner/Deployer:", owner.address);
    console.log("Validator 1:", validator1.address);
    console.log("Validator 2:", validator2.address);
    console.log("Validator 3:", validator3.address);
    console.log("Validator 4:", validator4.address);

    console.log("\nDeploying EnhancedFunding...");
    const EnhancedFunding = await hre.ethers.getContractFactory(
        "EnhancedFunding"
    );
    const enhancedFunding = await EnhancedFunding.deploy();
    await enhancedFunding.waitForDeployment();

    const contractAddress = await enhancedFunding.getAddress();
    console.log("EnhancedFunding contract deployed to:", contractAddress);

    // Add validators
    console.log("\nAdding validators...");
    await enhancedFunding.addValidator(validator1.address);
    await enhancedFunding.addValidator(validator2.address);
    await enhancedFunding.addValidator(validator3.address);

    // Set voting power for validators
    await enhancedFunding.setValidatorVotingPower(validator1.address, 2); // Higher voting power
    await enhancedFunding.setValidatorVotingPower(validator2.address, 1);
    await enhancedFunding.setValidatorVotingPower(validator3.address, 1);

    console.log("\n=== Setup Complete ===");
    console.log("Contract Address:", contractAddress);
    console.log("\nValidator Addresses:");
    console.log("1:", validator1.address, "(Voting Power: 2)");
    console.log("2:", validator2.address, "(Voting Power: 1)");
    console.log("3:", validator3.address, "(Voting Power: 1)");

    console.log("\nTo test the system:");
    console.log("1. Create a fundraiser or project with milestones");
    console.log("2. Make donations or fund the project");
    console.log("3. Have validators validate the project");
    console.log("4. Create and vote on milestone proposals");
    console.log("5. Approve withdrawals with multi-sig process");
}

main().catch((error) => {
    console.error("\nError:", error);
    process.exit(1);
});
