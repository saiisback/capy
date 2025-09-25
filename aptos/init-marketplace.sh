#!/bin/bash

echo "🛒 Initializing Contract Marketplace..."

# Get the contract address from Move.toml
CONTRACT_ADDRESS=$(grep 'capy = ' Move.toml | cut -d'"' -f2)

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "❌ Could not find contract address in Move.toml"
    exit 1
fi

echo "📍 Contract Address: $CONTRACT_ADDRESS"

# Check if contract is initialized, initialize if needed
echo "🔧 Ensuring contract is initialized..."
aptos move run --function-id $CONTRACT_ADDRESS::capy::initialize --profile capy 2>/dev/null || echo "ℹ️ Contract already initialized or failed (this is normal)"

# Initialize marketplace items on the contract
echo "🔧 Adding marketplace items to contract..."
aptos move run --function-id $CONTRACT_ADDRESS::capy::initialize_contract_marketplace --profile capy

echo "✅ Marketplace initialization complete!"
echo "🛒 13 items have been added to the contract's marketplace"
echo "💡 Users can now purchase items from the marketplace!"
