const { ethers } = require("hardhat");

async function main() {
    console.log("Seeding contract with initial data...");

    // Get contract instance
    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);

    // Get the deployed contract
    const FundAllocation = await ethers.getContractFactory("FundAllocation");
    const contract = await FundAllocation.attach(
        "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"
    );

    console.log("Connected to contract:", await contract.getAddress());

    // Create some fundraisers
    console.log("\nCreating fundraisers...");

    const fundraisers = [
        {
            name: "Clean Water Initiative",
            description: "Providing clean water access to rural communities",
            goal: ethers.parseEther("5"),
        },
        {
            name: "Education for All",
            description:
                "Supporting education in underprivileged communities with books and supplies",
            goal: ethers.parseEther("3"),
        },
        {
            name: "Healthcare Outreach",
            description:
                "Mobile clinics for remote villages without hospital access",
            goal: ethers.parseEther("10"),
        },
    ];

    for (const f of fundraisers) {
        console.log(`Creating fundraiser: ${f.name}`);
        const tx = await contract.createFundraiser(
            f.name,
            f.description,
            f.goal
        );
        await tx.wait();
        console.log("Transaction hash:", tx.hash);
    }

    // Get fundraiser count
    const count = await contract.getFundraiserCount();
    console.log(`\nTotal fundraisers created: ${count}`);

    // Add some donations
    console.log("\nMaking donations...");

    // Donate to first fundraiser
    let tx = await contract.donate(0, { value: ethers.parseEther("2.5") });
    await tx.wait();
    console.log("Donated 2.5 ETH to fundraiser #0");

    // Donate to second fundraiser
    tx = await contract.donate(1, { value: ethers.parseEther("1.5") });
    await tx.wait();
    console.log("Donated 1.5 ETH to fundraiser #1");

    // Donate to third fundraiser
    tx = await contract.donate(2, { value: ethers.parseEther("3") });
    await tx.wait();
    console.log("Donated 3 ETH to fundraiser #2");

    // Create a withdrawal request
    console.log("\nCreating withdrawal request...");
    tx = await contract.createWithdrawalRequest(
        0,
        "For water purification equipment",
        ethers.parseEther("1")
    );
    await tx.wait();
    console.log("Created withdrawal request for fundraiser #0");

    // Get contract balance
    const balance = await ethers.provider.getBalance(
        await contract.getAddress()
    );
    console.log(`\nContract balance: ${ethers.formatEther(balance)} ETH`);

    console.log("\nSeed data added successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error seeding data:", error);
        process.exit(1);
    });
