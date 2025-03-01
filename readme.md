# Fund Allocation Tracking System

## 🚀 Getting Started for Local Development

### 📋 Prerequisites
#### System Requirements
- Node.js (compatible version)
- **Backend Setup**: Ensure the backend server is running locally at `http://localhost:8000`

### 🛠 First-Time Setup
#### Environment Configuration
1. Rename `.env.example` to `.env`
2. Configure the following key environment variables:

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| SEPOLIA_RPC_URL | Ethereum Sepolia Testnet RPC URL | Yes | https://eth-sepolia.g.alchemy.com/v2/... |
| PRIVATE_KEY | Wallet Private Key for Contract Deployment | Yes | 0xabc... |
| ETHERSCAN_API_KEY | API Key for Etherscan Verification | Optional | your-api-key |

#### Development Tools
- **Code Formatting**: Install Prettier for automatic code formatting
- **VS Code Setup**: Follow the guide for auto-formatting with Prettier

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
- Edit pages in `app/page.tsx`
- Pages auto-update during development
- Ensure all environment variables are correctly configured

### 🔍 Troubleshooting
- Verify the backend server is running
- Check the console for any configuration or dependency errors
- Ensure Node.js versions are compatible

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
- Keep your branch updated with the main branch
- Use **draft PRs** for work in progress
- Communicate with the team about significant changes
- Continuously improve the PR process based on team feedback

---

## 📜 License
MIT License. See `LICENSE` file for details.

## 🤝 Contributing
Feel free to open **issues** or **pull requests** to improve this project!