# Fresh Contract Deployment Guide

## Step 1: Create New Profile

```bash
# Create a completely new profile
aptos init --profile capy-fresh --network testnet

# This will generate a new address and private key
```

## Step 2: Fund the New Account

```bash
# Fund the new account with testnet tokens
aptos account fund-with-faucet --profile capy-fresh --amount 100000000
```

## Step 3: Update Move.toml

Replace the address in `Move.toml` with the new address from step 1:

```toml
[addresses]
capy = "YOUR_NEW_ADDRESS_HERE"
```

## Step 4: Deploy the Contract

```bash
# Deploy with the new profile
aptos move publish --profile capy-fresh
```

## Step 5: Initialize the Contract

```bash
# Initialize global invitations
aptos move run --function-id YOUR_NEW_ADDRESS::capy::initialize_global_invitations --profile capy-fresh

# Initialize NFT collection
aptos move run --function-id YOUR_NEW_ADDRESS::capy::initialize_nft_collection --profile capy-fresh
```

## Step 6: Update Frontend

Update your `.env.local` file:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=YOUR_NEW_ADDRESS_HERE
```

## Step 7: Test the Flow

1. Go to your frontend
2. Connect wallet
3. Send invitation to another address
4. Accept invitation from another wallet
5. Check that NFT metadata is created

## Quick Commands Summary

```bash
# 1. Create new profile
aptos init --profile capy-fresh --network testnet

# 2. Fund account
aptos account fund-with-faucet --profile capy-fresh --amount 100000000

# 3. Update Move.toml with new address

# 4. Deploy
aptos move publish --profile capy-fresh

# 5. Initialize
aptos move run --function-id YOUR_NEW_ADDRESS::capy::initialize --profile capy-fresh
aptos move run --function-id YOUR_NEW_ADDRESS::capy::initialize_global_invitations --profile capy-fresh
aptos move run --function-id YOUR_NEW_ADDRESS::capy::initialize_nft_collection --profile capy-fresh
aptos move run --function-id YOUR_NEW_ADDRESS::capy::initialize_contract_marketplace --profile capy-fresh
```

## Notes

- The new profile will have a completely fresh address
- No conflicts with existing deployments
- All NFT functionality will work from scratch
- Remember to update your frontend environment variables
