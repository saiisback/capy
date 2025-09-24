# Capy Smart Contract Deployment Guide

## Prerequisites

1. **Install Aptos CLI**
```bash
curl -fsSL https://aptos.dev/scripts/install_cli.py | python3
```

2. **Initialize Aptos Account for Testnet**
```bash
aptos init --network testnet
```

## Deploy Contract

1. **Navigate to aptos directory**
```bash
cd aptos
```

2. **Compile the contract (this will automatically use your account address)**
```bash
aptos move compile --named-addresses capy=default
```

3. **Run tests (optional)**
```bash
aptos move test --named-addresses capy=default
```

4. **Deploy to testnet**
```bash
aptos move publish --named-addresses capy=default --profile default
```

5. **Initialize the contract after deployment**
```bash
aptos move run --function-id default::capy::initialize --profile default
```

6. **Get the deployed contract address**
```bash
# The contract address will be your account address
aptos account list --profile default
```

## Update Frontend

1. **Create .env.local file in project root**
```bash
echo "NEXT_PUBLIC_CONTRACT_ADDRESS=YOUR_DEPLOYED_ADDRESS" > ../.env.local
```

2. **Restart your Next.js development server**
```bash
npm run dev
```

## Verify Deployment

Check your contract on Aptos Explorer:
- Go to: https://explorer.aptoslabs.com/
- Search for your contract address
- Verify the contract functions are available

## Contract Functions

After deployment, these functions will be available:
- `send_invitation(to_address: address)`
- `accept_invitation(invitation_id: u64)`
- `reject_invitation(invitation_id: u64)`
- `feed_pet(pair_id: u64)`
- `show_love_to_pet(pair_id: u64)`

## Troubleshooting

- **"Hex string is too short"**: Contract not deployed, use proper address
- **"Function not found"**: Contract not deployed or wrong address
- **"Transaction failed"**: Check gas fees and account balance
