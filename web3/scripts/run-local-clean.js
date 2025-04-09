const { spawn } = require("child_process");
const path = require("path");

// Start a local blockchain node with clean state
console.log("\n=== Starting local blockchain node with clean state ===");
const nodeProcess = spawn("npx", ["hardhat", "node", "--reset"], {
    stdio: "inherit",
    shell: true,
    detached: true,
});

// Give the node some time to start up
setTimeout(() => {
    console.log("\n=== Deploying contract to local blockchain ===");
    const deployProcess = spawn(
        "npx",
        ["hardhat", "run", "scripts/deploy.js", "--network", "localhost"],
        {
            stdio: "inherit",
            shell: true,
        }
    );

    deployProcess.on("close", (code) => {
        console.log(`\nDeploy process exited with code ${code}`);
        console.log("\n=== Local blockchain node is still running ===");
        console.log("Press Ctrl+C to stop the node when finished");
    });
}, 5000);
