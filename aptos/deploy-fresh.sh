#!/bin/bash

echo "🚀 Starting Fresh Contract Deployment..."

# Step 1: Create new profile
echo "📝 Creating new profile..."
aptos init --profile capy-fresh --network testnet

# Get the new address
NEW_ADDRESS=$(aptos account list --profile capy-fresh | grep -o '0x[a-f0-9]\{64\}' | head -1)
echo "📍 New address: $NEW_ADDRESS"

# Step 2: Fund the account
echo "💰 Funding account..."
aptos account fund-with-faucet --profile capy-fresh --amount 100000000

# Step 3: Update Move.toml
echo "🔧 Updating Move.toml..."
sed -i.bak "s/capy = \".*\"/capy = \"$NEW_ADDRESS\"/" Move.toml

# Step 4: Deploy the contract
echo "📦 Deploying contract..."
aptos move publish --profile capy-fresh

# Step 5: Initialize the contract
echo "🔧 Initializing contract..."
aptos move run --function-id $NEW_ADDRESS::capy::initialize --profile capy-fresh

echo "🔧 Initializing global invitations..."
aptos move run --function-id $NEW_ADDRESS::capy::initialize_global_invitations --profile capy-fresh

echo "🔧 Initializing NFT collection..."
aptos move run --function-id $NEW_ADDRESS::capy::initialize_nft_collection --profile capy-fresh

echo "🔧 Initializing contract marketplace..."
aptos move run --function-id $NEW_ADDRESS::capy::initialize_contract_marketplace --profile capy-fresh

echo "✅ Deployment complete!"
echo "📍 Contract Address: $NEW_ADDRESS"
echo "🔧 Update your .env.local with:"
echo "NEXT_PUBLIC_CONTRACT_ADDRESS=$NEW_ADDRESS"
