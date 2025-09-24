# Simplified Invitation Flow - Deployment Guide

## What Changed

The invitation flow has been simplified so that **only the co-parent (receiver) needs to sign the contract**. The sender doesn't need to sign anything!

### Key Changes:

1. **Smart Contract**: Added global invitation storage that doesn't require sender initialization
2. **Frontend**: Updated to show clear messaging about the simplified flow
3. **User Experience**: Sender just enters co-parent's address and sends invite - no wallet signing required

## How It Works Now

1. **Sender**: Enters co-parent's wallet address and clicks "Send Invite"
   - No wallet connection or signing required for sender
   - Invitation is stored in global contract state

2. **Co-parent**: Receives invitation and signs the contract to accept
   - Only the co-parent needs to connect their wallet and sign
   - Creates the co-parent pair and mints the pet

## Deployment Steps

### 1. Deploy the Smart Contract

```bash
cd aptos
aptos move publish --profile default
```

### 2. Initialize Global Invitations

After deployment, you need to initialize the global invitations state:

```bash
# Replace YOUR_CONTRACT_ADDRESS with the actual deployed address
aptos move run --function-id YOUR_CONTRACT_ADDRESS::capy::initialize_global_invitations
```

### 3. Update Environment Variables

Set the contract address in your `.env.local` file:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=YOUR_CONTRACT_ADDRESS
```

### 4. Test the Flow

1. **Sender**: Go to invitation page, enter co-parent's address, click "Send Invite"
2. **Co-parent**: Go to invitation page, see pending invitation, click "Accept"
3. **Both**: Should now have access to the pet dashboard

## Smart Contract Functions

### New Functions:
- `send_invitation(account: &signer, from_address: address, to_address: address)` - Send invitation (no sender signature needed)
- `initialize_global_invitations(account: &signer)` - Initialize global state (call once after deployment)

### Updated Functions:
- `accept_invitation(account: &signer, invitation_id: u64)` - Accept invitation (only co-parent signs)
- `get_invitation_view(capy_addr: address, invitation_id: u64)` - View invitation from global state
- `get_user_invitations_view(capy_addr: address, user_addr: address)` - Get user invitations from global state

## Benefits

1. **Simpler UX**: Sender doesn't need wallet connection
2. **Faster Onboarding**: No need for sender to initialize account
3. **Better Conversion**: Lower friction for sending invitations
4. **Same Security**: Co-parent still needs to sign to accept

## Testing

The contract compiles successfully and is ready for deployment. The frontend has been updated to reflect the simplified flow with clear messaging to users.
