const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Copying contract artifacts to frontend...");

    // Source paths
    const contractsDir = path.join(__dirname, "../artifacts/contracts");
    const sourceAbiDir = path.join(contractsDir, "Fundtracking.sol");

    // Destination paths
    const destDir = path.join(__dirname, "../../webclient/src/contracts/abis");

    try {
        // Create destination directory if it doesn't exist
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        // Read the contract artifact
        const artifactPath = path.join(sourceAbiDir, "FundAllocation.json");
        const artifact = require(artifactPath);

        // Write the ABI to the frontend
        const abiFileContent = `export const fundAllocationABI = ${JSON.stringify(
            artifact.abi,
            null,
            2
        )} as const;`;
        fs.writeFileSync(path.join(destDir, "index.ts"), abiFileContent);

        console.log("Successfully copied contract ABI to frontend!");
    } catch (error) {
        console.error("Error copying artifacts:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
