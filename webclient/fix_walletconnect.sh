#!/bin/bash

# Fix WalletConnect dependencies
echo "Fixing WalletConnect dependencies..."

# Remove node_modules and package-lock.json
rm -rf node_modules
rm -f package-lock.json

# Install dependencies
npm install

echo "Dependencies fixed! Please restart your development server with 'npm run dev'" 