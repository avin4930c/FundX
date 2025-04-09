// Modify this file: web3/scripts/deploy.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

async function main() {
    console.log("Starting deployment process...");

    // Get the contract factory
    const FundAllocation = await ethers.getContractFactory("FundAllocation");

    console.log("Deploying FundAllocation contract...");
    const fundAllocation = await FundAllocation.deploy();

    // Wait for deployment to complete
    await fundAllocation.waitForDeployment();

    const contractAddress = await fundAllocation.getAddress();
    console.log(`FundAllocation deployed to: ${contractAddress}`);

    // Update the .env file programmatically
    const envPath = path.join(__dirname, "../../webclient/.env");

    try {
        // Read the current .env file
        let envContent = fs.readFileSync(envPath, "utf8");

        // Replace the contract address line
        envContent = envContent.replace(
            /NEXT_PUBLIC_CONTRACT_ADDRESS=.*/,
            `NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`
        );

        // Write back the updated .env file
        fs.writeFileSync(envPath, envContent);
        console.log(
            `\nUpdated contract address in .env file: ${contractAddress}`
        );
    } catch (err) {
        console.error("Error updating .env file:", err);
    }

    console.log("\nDeployment complete! The contract is ready for use.");

    // Copy contract artifacts to frontend
    console.log("\nCopying contract artifacts to frontend...");
    const copyArtifacts = spawn("node", ["scripts/copy-artifacts.js"], {
        stdio: "inherit",
        shell: true,
    });

    copyArtifacts.on("close", (code) => {
        if (code === 0) {
            console.log("Successfully copied contract artifacts to frontend!");
            console.log(
                "You can now create fundraisers through the application."
            );
        } else {
            console.error("Failed to copy contract artifacts to frontend.");
        }
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error in deployment:", error);
        process.exit(1);
    });
