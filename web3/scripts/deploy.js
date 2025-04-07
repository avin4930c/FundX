// Modify this file: web3/scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
    console.log("Starting deployment process...");

    // Get the contract factory
    const FundAllocation = await ethers.getContractFactory("FundAllocation");

    // Get signers for multisig setup
    const [deployer, owner2, owner3] = await ethers.getSigners();

    // Set up multisig owners (first 3 accounts)
    const owners = [deployer.address, owner2.address, owner3.address];

    // Required confirmations for multisig
    const requiredConfirmations = 2;

    console.log("Deploying FundAllocation contract...");
    const fundAllocation = await FundAllocation.deploy(
        owners,
        requiredConfirmations
    );
    await fundAllocation.deployed();

    console.log(`FundAllocation deployed to: ${fundAllocation.address}`);
    console.log(`Multi-sig owners: ${owners}`);
    console.log(`Required confirmations: ${requiredConfirmations}`);

    // Seed the contract with initial fundraisers
    console.log("\nSeeding contract with initial fundraisers...");

    const fundraisers = [
        {
            name: "Clean Water Initiative",
            description: "Providing clean water access to rural communities",
            goal: ethers.utils.parseEther("5"),
        },
        {
            name: "Education for All",
            description:
                "Supporting education in underprivileged communities with supplies",
            goal: ethers.utils.parseEther("3"),
        },
        {
            name: "Healthcare Outreach",
            description:
                "Mobile clinics for remote villages without hospital access",
            goal: ethers.utils.parseEther("10"),
        },
        {
            name: "Renewable Energy Project",
            description: "Installing solar panels in off-grid communities",
            goal: ethers.utils.parseEther("8"),
        },
        {
            name: "Food Security Program",
            description:
                "Supporting local farmers and distributing food to families in need",
            goal: ethers.utils.parseEther("4"),
        },
    ];

    // Create all fundraisers
    for (const f of fundraisers) {
        console.log(`Creating fundraiser: ${f.name}`);
        const tx = await fundAllocation.createFundraiser(
            f.name,
            f.description,
            f.goal
        );
        await tx.wait();
    }

    // Get fundraiser count to verify
    const count = await fundAllocation.getFundraiserCount();
    console.log(`\nTotal fundraisers created: ${count}`);

    // Add some sample donations
    console.log("\nMaking sample donations...");

    // Donate to first fundraiser
    await fundAllocation.donate(0, { value: ethers.utils.parseEther("2.5") });
    console.log("Donated 2.5 ETH to fundraiser #0");

    // Donate to second fundraiser
    await fundAllocation.donate(1, { value: ethers.utils.parseEther("1.5") });
    console.log("Donated 1.5 ETH to fundraiser #1");

    // Create a withdrawal request
    console.log("\nCreating withdrawal request...");
    await fundAllocation.createWithdrawalRequest(
        0,
        "For water purification equipment",
        ethers.utils.parseEther("1")
    );
    console.log("Created withdrawal request for fundraiser #0");

    // Update the .env file programmatically
    const fs = require("fs");
    const path = require("path");
    const envPath = path.join(__dirname, "../../webclient/.env");

    try {
        // Read the current .env file
        let envContent = fs.readFileSync(envPath, "utf8");

        // Replace the contract address line
        envContent = envContent.replace(
            /NEXT_PUBLIC_CONTRACT_ADDRESS=.*/,
            `NEXT_PUBLIC_CONTRACT_ADDRESS=${fundAllocation.address}`
        );

        // Write back the updated .env file
        fs.writeFileSync(envPath, envContent);
        console.log(
            `\nUpdated contract address in .env file: ${fundAllocation.address}`
        );
    } catch (err) {
        console.error("Error updating .env file:", err);
    }

    console.log("\nDeployment and setup complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error in deployment:", error);
        process.exit(1);
    });
