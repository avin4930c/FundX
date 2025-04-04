const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    const [owner, validator1, validator2, validator3, recipient] =
        await hre.ethers.getSigners();

    console.log("\n=== Deploying Contract for Testing ===");
    const EnhancedFunding = await hre.ethers.getContractFactory(
        "EnhancedFunding"
    );
    const enhancedFunding = await EnhancedFunding.deploy();
    await enhancedFunding.waitForDeployment();

    const contractAddress = await enhancedFunding.getAddress();
    console.log("Contract deployed to:", contractAddress);

    // Add validators
    console.log("\nAdding validators...");
    await enhancedFunding.addValidator(validator1.address);
    await enhancedFunding.addValidator(validator2.address);

    // Set voting power for validators
    await enhancedFunding.setValidatorVotingPower(owner.address, 2); // Owner has higher voting power
    await enhancedFunding.setValidatorVotingPower(validator1.address, 1);
    await enhancedFunding.setValidatorVotingPower(validator2.address, 1);

    console.log("\n=== TEST 1: Donation & Fundraiser Flow ===");

    // Create a fundraiser
    console.log("\n1. Creating fundraiser...");
    const createTx = await enhancedFunding.createFundraiser(
        "Community Garden Project",
        "Building a garden for the local community",
        ethers.parseEther("1.0"),
        30 // 30 days duration
    );
    await createTx.wait();
    console.log("Fundraiser created");

    // Donate to fundraiser
    console.log("\n2. Making donations...");
    const donateTx1 = await enhancedFunding
        .connect(validator1)
        .donate(0, { value: ethers.parseEther("0.5") });
    await donateTx1.wait();
    console.log("Validator1 donated 0.5 ETH");

    const donateTx2 = await enhancedFunding
        .connect(validator2)
        .donate(0, { value: ethers.parseEther("0.5") });
    await donateTx2.wait();
    console.log("Validator2 donated 0.5 ETH");

    // Fundraiser should have converted to a project
    console.log("\nFundraiser should now be converted to a project");

    // Validate the project
    console.log("\n3. Validating project...");
    const validateTx1 = await enhancedFunding.connect(owner).validateProject(0);
    await validateTx1.wait();
    console.log("Owner validated the project");

    const validateTx2 = await enhancedFunding
        .connect(validator1)
        .validateProject(0);
    await validateTx2.wait();
    console.log("Validator1 validated the project");

    // Project should now be completed and first milestone proposal created
    console.log(
        "\nProject should now be completed and first milestone proposal created"
    );

    // Vote on the proposal
    console.log("\n4. Voting on milestone proposal...");
    const voteTx1 = await enhancedFunding.connect(owner).vote(0, true);
    await voteTx1.wait();
    console.log("Owner voted FOR the proposal");

    const voteTx2 = await enhancedFunding.connect(validator1).vote(0, true);
    await voteTx2.wait();
    console.log("Validator1 voted FOR the proposal");

    // Proposal should be executed and withdrawal request created
    console.log("\nProposal should be executed and withdrawal request created");

    // Approve withdrawal
    console.log("\n5. Approving withdrawal request...");
    const approveTx1 = await enhancedFunding
        .connect(owner)
        .approveWithdrawal(0);
    await approveTx1.wait();
    console.log("Owner approved the withdrawal");

    const approveTx2 = await enhancedFunding
        .connect(validator1)
        .approveWithdrawal(0);
    await approveTx2.wait();
    console.log("Validator1 approved the withdrawal");

    // Funds should be released to the fundraiser creator
    console.log("\nFunds should be released to the fundraiser creator");

    console.log("\n=== TEST 2: Direct Project with Milestones ===");

    // Create a project with milestones
    console.log("\n1. Creating project with milestones...");
    const milestoneDescriptions = [
        "Research Phase",
        "Development Phase",
        "Deployment Phase",
    ];
    const milestoneAmounts = [
        ethers.parseEther("0.3"),
        ethers.parseEther("0.4"),
        ethers.parseEther("0.3"),
    ];

    const createProjectTx = await enhancedFunding.createProjectWithMilestones(
        "Tech Innovation Project",
        "Developing a new technology solution",
        recipient.address,
        milestoneDescriptions,
        milestoneAmounts,
        { value: ethers.parseEther("1.0") }
    );
    await createProjectTx.wait();
    console.log("Project created with 3 milestones");

    // Add approvers (Multi-sig component)
    console.log("\n2. Adding approvers for multi-sig...");
    const addApproverTx = await enhancedFunding
        .connect(recipient)
        .addProjectApprover(1, validator3.address);
    await addApproverTx.wait();
    console.log("Validator3 added as an approver");

    const setApprovalsTx = await enhancedFunding
        .connect(recipient)
        .setProjectRequiredApprovals(1, 1);
    await setApprovalsTx.wait();
    console.log("Required approvals set to 1");

    // Validate the project
    console.log("\n3. Validating project...");
    const validateTx3 = await enhancedFunding.connect(owner).validateProject(1);
    await validateTx3.wait();
    console.log("Owner validated the project");

    const validateTx4 = await enhancedFunding
        .connect(validator2)
        .validateProject(1);
    await validateTx4.wait();
    console.log("Validator2 validated the project");

    // Project should now be completed and first milestone proposal created
    console.log(
        "\nProject should now be completed and first milestone proposal created"
    );

    // Vote on the proposal
    console.log("\n4. Voting on milestone proposal...");
    const voteTx3 = await enhancedFunding.connect(owner).vote(1, true);
    await voteTx3.wait();
    console.log("Owner voted FOR the proposal");

    const voteTx4 = await enhancedFunding.connect(validator2).vote(1, true);
    await voteTx4.wait();
    console.log("Validator2 voted FOR the proposal");

    // Approve withdrawal - using multi-sig this time
    console.log("\n5. Approving withdrawal through multi-sig...");
    const approveTx3 = await enhancedFunding
        .connect(validator3)
        .approveWithdrawal(1);
    await approveTx3.wait();
    console.log("Validator3 approved the withdrawal through multi-sig");

    // First milestone funds should be released
    console.log("\nFirst milestone funds should be released");

    // Print final balances
    const balance = await enhancedFunding.getBalance();
    console.log("\nContract balance:", ethers.formatEther(balance), "ETH");

    console.log("\n=== Test Completed Successfully ===");
}

main().catch((error) => {
    console.error("\nError:", error);
    process.exit(1);
});
