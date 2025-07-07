
# Sepolia Deployment Instructions

## Requirements for Live Deployment:
1. PRIVATE_KEY environment variable with deployer's private key
2. Sepolia ETH for gas fees (get from faucet)
3. Run: npx hardhat run scripts/deploy.ts --network sepolia

## Sepolia Faucets:
- Alchemy Sepolia Faucet: https://sepoliafaucet.com/
- Chainlink Sepolia Faucet: https://faucets.chain.link/sepolia
- QuickNode Sepolia Faucet: https://faucet.quicknode.com/ethereum/sepolia

## Post-Deployment Steps:
1. Update frontend .env with new contract addresses
2. Add backend distributor role to PlayToken contract
3. Configure Reown Paymaster for gasless transactions

## User Onboarding Flow:
1. User signs in with Twitter OAuth
2. For new wallets: Direct to Sepolia faucet for ETH
3. Backend calls distributeBaseAirdrop() for 1,000 PT
4. Optional: distributeVolunteerBonus() for additional 2,000 PT

