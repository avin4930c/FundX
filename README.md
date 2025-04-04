# FundX - Transparent Fund Tracking System

A decentralized application for transparent fund allocation and validation using blockchain technology.

## Prerequisites

-   Node.js (v16 or later)
-   npm or yarn
-   MetaMask browser extension

## Project Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd fundx
```

2. Install dependencies:

```bash
# Install web3 (smart contract) dependencies
cd web3
npm install

# Install webclient dependencies
cd ../webclient
npm install
```

## Running the Project

### 1. Start Local Blockchain

```bash
cd web3
npx hardhat node
```

Keep this terminal running. Note down the private keys for testing.

### 2. Deploy Smart Contract

In a new terminal:

```bash
cd web3
npx hardhat run scripts/deploy.js --network local
```

Note down the deployed contract address.

### 3. Add Validators

```bash
npx hardhat run scripts/add-validators.js --network local
```

### 4. Start Web Client

In a new terminal:

```bash
cd webclient
npm run dev
```

Visit http://localhost:3000

## Testing Flow

1. **Setup MetaMask**

    - Open MetaMask
    - Add network:
        - Network Name: Hardhat Local
        - RPC URL: http://127.0.0.1:8545
        - Chain ID: 31337
        - Currency Symbol: ETH
    - Import accounts using private keys from hardhat node output
        - Import owner account
        - Import validator accounts (at least 2)

2. **Fund Allocation Process**

    - Connect wallet using owner account
    - Go to "Allocate Funds" panel
    - Fill in project details:
        - Project Name
        - Description
        - Amount in ETH
    - Click "Allocate Funds"
    - Confirm transaction in MetaMask

3. **Validation Process**

    - Switch to validator account in MetaMask
    - Go to "Validator Panel"
    - Enter Project ID (starts from 0)
    - Click "Validate Project"
    - Confirm transaction in MetaMask
    - Repeat with different validator account
    - Project is completed after required validations (default: 2)

4. **View Project Status**

    - "Pending Projects" panel shows unvalidated projects
    - Progress bar indicates validation status
    - Projects disappear when fully validated

5. **Optional: Adjust Validator Weights**
    - Connect with owner account
    - Use "Validator Weights" panel
    - Select validator
    - Set new weight (1-100)
    - Higher weights give validators more influence

## Smart Contract Features

-   **Fund Allocation**: Track fund allocations with project details
-   **Multi-validator System**: Require multiple validations for project completion
-   **Weighted Validation**: Validators can have different influence levels
-   **Time-bound Validation**: Optional validation window
-   **Transparent History**: All transactions and validations are on-chain

## Project Structure

```
fundx/
├── web3/                 # Smart contract & blockchain
│   ├── contracts/        # Solidity contracts
│   ├── scripts/          # Deployment & test scripts
│   └── test/            # Contract tests
└── webclient/           # Frontend application
    ├── src/
    │   ├── components/  # React components
    │   ├── config/      # Configuration files
    │   └── contracts/   # Contract ABIs
    └── public/          # Static assets
```

## Common Issues & Solutions

1. **MetaMask Connection Issues**

    - Ensure correct network (Hardhat Local)
    - Reset account if nonce issues occur

2. **Transaction Failures**

    - Check account has enough ETH
    - Ensure correct account role (owner/validator)

3. **Contract Interaction Issues**
    - Verify contract address in config
    - Check ABI matches deployed contract

## Development Notes

-   Contract address needs to be updated in `webclient/src/config/wagmi.ts`
-   Default validation requirement is 2 validators
-   Owner can adjust validation parameters
-   All amounts are in Wei (1 ETH = 10^18 Wei)

# Fund Allocation Tracking System

## 🚀 Getting Started for Local Development

### 📋 Prerequisites

#### System Requirements

-   Node.js (compatible version)
-   **Backend Setup**: Ensure the backend server is running locally at `http://localhost:8000`

### 🛠 First-Time Setup

#### Environment Configuration

1. Rename `.env.example` to `.env`
2. Configure the following key environment variables:

| Variable          | Purpose                                    | Required | Example                                  |
| ----------------- | ------------------------------------------ | -------- | ---------------------------------------- |
| SEPOLIA_RPC_URL   | Ethereum Sepolia Testnet RPC URL           | Yes      | https://eth-sepolia.g.alchemy.com/v2/... |
| PRIVATE_KEY       | Wallet Private Key for Contract Deployment | Yes      | 0xabc...                                 |
| ETHERSCAN_API_KEY | API Key for Etherscan Verification         | Optional | your-api-key                             |

#### Development Tools

-   **Code Formatting**: Install Prettier for automatic code formatting
-   **VS Code Setup**: Follow the guide for auto-formatting with Prettier

### 🖥 Running the Development Server

#### Install Dependencies

```bash
npm install
```

#### Start Development Server

```bash
npm run dev
```

🌐 Access the application at `http://localhost:3000`

### 🧪 Smart Contract Deployment

#### Deploying Smart Contracts to Sepolia

```bash
cd web3
npx hardhat run scripts/deploy.js --network sepolia
```

### 📝 Development Workflow

-   Edit pages in `app/page.tsx`
-   Pages auto-update during development
-   Ensure all environment variables are correctly configured

### 🔍 Troubleshooting

-   Verify the backend server is running
-   Check the console for any configuration or dependency errors
-   Ensure Node.js versions are compatible

---

## 🎯 Best Practices

### GitHub Pull Request Best Practices

#### Before Creating a Pull Request

1. **Branch Naming Convention**

    - Use clear, descriptive branch names
    - Follow a consistent format: `[type]/[description]`
    - Examples:
        - `feature/add-user-authentication`
        - `bugfix/resolve-login-error`
        - `docs/update-readme`

2. **Pre-PR Checklist**
    - Code follows project coding standards
    - All tests pass locally
    - New features have appropriate test coverage
    - Documentation is updated
    - No unnecessary files or debug code included

#### Creating the Pull Request

3. **Commit Message Guidelines**
    - Use imperative mood: "Add" not "Added"
    - Limit the first line to 50 characters
    - Separate subject from body with a blank line
    - Explain what and why, not how (code shows how)
    - Reference related issues when appropriate

##### Good Commit Message Examples

**Single Line, Imperative Mood**

```
Add user login authentication
```

**Detailed Commit Message with Body**

```
Implement OAuth2 authentication for user login

- Integrate Google Sign-In strategy
- Add password complexity validation
- Implement secure token management
- Resolve security vulnerabilities in previous auth method

Fixes #124 and closes #125
```

##### Refactoring Commit Example

```
Refactor authentication service for improved modularity

- Extract authentication logic into separate module
- Implement dependency injection for auth providers
- Improve testability of authentication flow
- Reduce cyclomatic complexity of auth methods
```

4. **PR Description Best Practices**

    - Clearly describe the purpose of the changes
    - Reference related issues using GitHub keywords:
        - `Fixes #123`
        - `Resolves #456`
        - `Closes #789`
    - Include screenshots or GIFs for visual changes
    - Explain the approach and any significant decisions

5. **PR Size and Scope**
    - Keep PRs small and focused
    - Aim for single responsibility principle
    - Break large changes into smaller, manageable PRs
    - Avoid mixing unrelated changes in one PR

#### Review Process

6. **Code Review Etiquette**
    - Be constructive and respectful in comments
    - Explain reasoning behind suggested changes
    - Use GitHub's suggestion feature for inline edits
    - Respond promptly to reviewer feedback

#### Merging Guidelines

7. **Merge Strategy**

    - Prefer **"Squash and Merge"** for a clean commit history
    - Use **"Rebase and Merge"** for maintaining original commits
    - Avoid **"Merge"** for repositories requiring linear history

8. **Post-Merge Cleanup**
    - Delete the feature branch after merging
    - Close associated issues
    - Update relevant documentation

### Additional Tips

-   Keep your branch updated with the main branch
-   Use **draft PRs** for work in progress
-   Communicate with the team about significant changes
-   Continuously improve the PR process based on team feedback

---

## 📜 License

MIT License. See `LICENSE` file for details.

## 🤝 Contributing

Feel free to open **issues** or **pull requests** to improve this project!

## Local Development and Deployment

### Prerequisites

-   Node.js (v16+)
-   npm or yarn

### Set up blockchain (web3) component

1. Navigate to the web3 directory:

    ```
    cd web3
    ```

2. Install dependencies:

    ```
    npm install
    ```

3. Compile smart contracts:

    ```
    npm run compile
    ```

4. Start a local blockchain node and deploy the contract:

    ```
    npm run run:local
    ```

    This will start a Hardhat node and deploy the contract to it.

5. Alternatively, to run tests on the local network:
    ```
    npm run test:local
    ```

### Deploy to Sepolia testnet (optional)

1. Configure your `.env` file with the required values:

    ```
    SEPOLIA_RPC_URL="your-sepolia-rpc-url"
    PRIVATE_KEY="your-wallet-private-key"
    ETHERSCAN_API_KEY="your-etherscan-api-key"
    ```

2. Deploy to Sepolia testnet:

    ```
    npm run deploy:sepolia
    ```

3. Verify contract on Etherscan:
    ```
    npm run verify "DEPLOYED_CONTRACT_ADDRESS"
    ```

## Project Structure

-   `/web3` - Smart contract code, deployment scripts and tests
-   `/webclient` - Frontend application for interacting with the contracts
-   `/server` - Backend services (if applicable)

## License

ISC

# Enhanced Funding Features

The project now includes an enhanced smart contract (`EnhancedFunding.sol`) that implements the following features:

## Key Components

1. **Donation Contract**: Allows users to create fundraisers and donate funds.

    - Create fundraisers with target amounts and deadlines
    - Accept donations from multiple contributors
    - Track donation history per fundraiser

2. **Fund Allocation Contract**: Holds funds in escrow until community approval.

    - Transparent allocation and tracking of funds
    - Conversion of fundraisers to projects once funded
    - Weighted validation system

3. **DAO Governance Contract**: Implements a voting mechanism for fund release.

    - Proposal creation for milestone validation
    - Weighted voting system based on validator power
    - Automatic execution of approved proposals

4. **Multi-Signature Wallet Contract**: Ensures withdrawals require multiple approvals.

    - Customizable number of required approvals per project
    - Project-specific approvers list
    - Secure withdrawal process

5. **Proof-of-Impact (PoI) Fund Release**: A milestone-based system that releases funds in steps based on governance votes.
    - Create projects with multiple milestones
    - Milestone-based fund allocation
    - Sequential release of funds as milestones are completed

## Using the Enhanced Contract

### Deployment

```bash
# Compile the contracts
npm run compile

# Deploy to local network
npm run deploy:enhanced

# Deploy to Sepolia testnet
npm run deploy:enhanced:sepolia

# Build and copy ABI to frontend
npm run build:enhanced
```

### Testing

```bash
# Run tests on local network
npm run test:enhanced
```

### Contract Workflow

1. **Fundraising Phase**

    - Creator starts a fundraiser with target amount
    - Donors contribute to the fundraiser
    - Once target is reached, fundraiser converts to a project

2. **Validation Phase**

    - Validators review and validate the project
    - Once enough weighted validations are received, project is marked complete

3. **Governance Phase**

    - Proposals are created for milestone validation
    - Validators vote on proposals
    - If approved, milestone is validated

4. **Multi-sig Release Phase**

    - Withdrawal requests are created for validated milestones
    - Approvers review and approve withdrawal requests
    - Once enough approvals are received, funds are released to recipient

5. **Milestone Progression**
    - Project moves to next milestone after current one is completed
    - Process repeats until all milestones are completed
