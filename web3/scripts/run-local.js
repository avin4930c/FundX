const { spawn } = require("child_process");
const path = require("path");

// Start a local blockchain node
console.log("\n=== Starting local blockchain node ===");
const nodeProcess = spawn("npx", ["hardhat", "node"], {
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

// Ensure the node is properly terminated on exit
process.on("SIGINT", () => {
    console.log("\n=== Stopping local blockchain node ===");
    // On Windows, child_process.spawn creates a process group, so we need to detach
    // and kill the whole group. On other platforms, just kill the process.
    if (process.platform === "win32") {
        spawn("taskkill", ["/pid", nodeProcess.pid, "/f", "/t"], {
            stdio: "inherit",
        });
    } else {
        process.kill(-nodeProcess.pid);
    }
    process.exit(0);
});
