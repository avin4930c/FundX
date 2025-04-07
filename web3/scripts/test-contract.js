const hre = require("hardhat");

async function main() {
    console.log("Testing FundAllocation contract...");

    // Get signers
    const [deployer, user1, user2, user3] = await hre.ethers.getSigners();

    // Contract address from deployment
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    // Load the contract
    const FundAllocation = await hre.ethers.getContractFactory(
        "FundAllocation"
    );
    const fundAllocation = FundAllocation.attach(contractAddress);

    console.log("Contract loaded at address:", contractAddress);

    // Check contract basics
    const name = await fundAllocation.name();
    const symbol = await fundAllocation.symbol();
    const required = await fundAllocation.required();
    const count = await fundAllocation.getFundraiserCount();

    console.log("Token Name:", name);
    console.log("Token Symbol:", symbol);
    console.log("Required Approvals:", required.toString());
    console.log("Current Fundraiser Count:", count.toString());

    // Create a fundraiser
    console.log("\n--- Creating a fundraiser ---");
    const createTx = await fundAllocation.createFundraiser(
        "Test Fundraiser",
        "This is a test fundraiser description",
        hre.ethers.parseEther("2") // 2 ETH goal
    );

    await createTx.wait();
    console.log("Fundraiser created!");

    // Check count again
    const newCount = await fundAllocation.getFundraiserCount();
    console.log("New Fundraiser Count:", newCount.toString());

    // Get fundraiser details
    const fundraiser = await fundAllocation.fundraisers(0);
    console.log("Fundraiser details:", {
        id: fundraiser.id.toString(),
        name: fundraiser.name,
        description: fundraiser.description,
        goal: hre.ethers.formatEther(fundraiser.goal),
        raised: hre.ethers.formatEther(fundraiser.raised),
        creator: fundraiser.creator,
        status: fundraiser.status,
    });

    // Donate to fundraiser
    console.log("\n--- Donating to fundraiser ---");
    const donateTx = await fundAllocation.connect(user1).donate(0, {
        value: hre.ethers.parseEther("0.5"), // 0.5 ETH donation
    });

    await donateTx.wait();
    console.log("Donation successful!");

    // Check fundraiser again after donation
    const updatedFundraiser = await fundAllocation.fundraisers(0);
    console.log("Updated fundraiser:", {
        id: updatedFundraiser.id.toString(),
        raised: hre.ethers.formatEther(updatedFundraiser.raised),
        status: updatedFundraiser.status,
    });

    // Create withdrawal request
    console.log("\n--- Creating withdrawal request ---");
    const withdrawalTx = await fundAllocation.createWithdrawalRequest(
        0, // Fundraiser ID
        "Test withdrawal", // Reason
        hre.ethers.parseEther("0.2") // 0.2 ETH
    );

    await withdrawalTx.wait();
    console.log("Withdrawal request created!");

    // Get withdrawal request count
    const requestCount = await fundAllocation.getWithdrawalRequestCount();
    console.log("Withdrawal Request Count:", requestCount.toString());

    // Get withdrawal request details
    const request = await fundAllocation.getWithdrawalRequest(0);
    console.log("Withdrawal request details:", {
        fundraiserId: request.fundraiserId.toString(),
        to: request.to,
        amount: hre.ethers.formatEther(request.amount),
        reason: request.reason,
        executed: request.executed,
    });

    // Approve the withdrawal request
    console.log("\n--- Approving withdrawal request ---");
    // First owner (deployer) approves
    const approve1Tx = await fundAllocation.approveWithdrawalRequest(0);
    await approve1Tx.wait();
    console.log("First approval successful!");

    // Second owner approves
    const approve2Tx = await fundAllocation
        .connect(user1)
        .approveWithdrawalRequest(0);
    await approve2Tx.wait();
    console.log("Second approval successful!");

    // Get approvers for the request
    const approvers = await fundAllocation.getApprovers(0);
    console.log("Approvers:", approvers);

    // Execute the withdrawal request
    console.log("\n--- Executing withdrawal request ---");
    const executeTx = await fundAllocation.executeWithdrawalRequest(0);
    await executeTx.wait();
    console.log("Withdrawal request executed!");

    // Check request again
    const updatedRequest = await fundAllocation.getWithdrawalRequest(0);
    console.log("Updated request:", {
        fundraiserId: updatedRequest.fundraiserId.toString(),
        amount: hre.ethers.formatEther(updatedRequest.amount),
        executed: updatedRequest.executed,
    });

    console.log("\nTest completed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
