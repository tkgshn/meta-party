# Anvil Local Development Guide

This guide explains how to use Anvil for robust local development of the Ultrathink Futarchy Platform.

## Overview

Anvil is a local Ethereum development node that's part of Foundry. It provides:
- Fast local blockchain for development
- Deterministic testing environment
- Fork mode for mainnet testing
- Easy account management with test ETH

## Prerequisites

1. Install Foundry (includes Anvil):
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. Ensure you have Node.js 18+ and npm installed

## Quick Start

### 1. Start Anvil

From the contracts directory:
```bash
cd packages/contracts
npm run anvil
```

This starts Anvil with:
- Chain ID: 31337
- 10 test accounts with 10,000 ETH each
- RPC URL: http://127.0.0.1:8545

### 2. Deploy Contracts

In a new terminal:
```bash
cd packages/contracts
npm run deploy:local
```

This deploys all smart contracts to your local Anvil node and saves addresses to `deployed-addresses-31337.json`.

### 3. Seed Test Data

Create sample markets and distribute tokens:
```bash
npm run seed:local
```

This will:
- Distribute PlayTokens to 5 test accounts
- Create 5 sample prediction markets
- Simulate trading activity on 3 markets

### 4. Start Frontend

From the root directory:
```bash
npm run dev
```

The frontend will automatically detect and load Anvil contract addresses when you connect to the Anvil network.

## Network Configuration

### MetaMask Setup

1. Open MetaMask
2. Add Custom RPC:
   - Network Name: Anvil Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

### Import Test Accounts

Anvil provides deterministic test accounts. Import the first account to MetaMask:

**Account #0** (10,000 ETH)
- Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

See all test accounts by running `anvil` in the terminal.

## Development Workflow

### Basic Development Cycle

1. Make contract changes
2. Run tests: `npm test`
3. Deploy to Anvil: `npm run deploy:local`
4. Test in frontend with MetaMask connected to Anvil

### Using Fork Mode

Test against mainnet state:
```bash
npm run anvil:fork
```

Then deploy to fork:
```bash
npm run deploy:local-fork
```

This is useful for:
- Testing against real mainnet contracts
- Simulating mainnet transactions
- Debugging production issues

## Advanced Features

### Custom Anvil Configuration

Create a custom Anvil instance:
```bash
anvil \
  --accounts 20 \           # 20 test accounts
  --balance 1000 \          # 1000 ETH each
  --block-time 5 \          # 5 second blocks
  --gas-limit 30000000 \    # 30M gas limit
  --port 8546               # Custom port
```

### Programmatic Testing

The seed script demonstrates programmatic interaction:
```typescript
// Load deployed addresses
const addresses = JSON.parse(
  fs.readFileSync('deployed-addresses-31337.json', 'utf8')
);

// Connect to contracts
const playToken = await ethers.getContractAt(
  "PlayToken", 
  addresses.playToken
);
```

### Network-Specific Deployments

Deployment addresses are saved per network:
- Anvil: `deployed-addresses-31337.json`
- Amoy: `deployed-addresses-80002.json`
- Mainnet: `deployed-addresses-137.json`

### Debugging Transactions

Anvil provides detailed transaction traces:
```bash
# Get transaction trace
cast run --rpc-url http://127.0.0.1:8545 <TX_HASH>

# Decode transaction data
cast 4byte-decode <CALLDATA>
```

## Troubleshooting

### Common Issues

1. **"Nonce too high" errors**
   - Reset MetaMask account: Settings → Advanced → Reset Account

2. **Contract addresses not loading**
   - Ensure you've run `npm run deploy:local`
   - Check browser console for errors
   - Verify you're connected to Anvil network

3. **Transaction failures**
   - Check account has sufficient ETH
   - Verify gas settings in MetaMask
   - Look for revert reasons in console

### Reset Everything

To start fresh:
```bash
# Stop Anvil (Ctrl+C)
# Clean build artifacts
cd packages/contracts
npm run clean

# Restart Anvil
npm run anvil

# Redeploy
npm run deploy:local
npm run seed:local
```

## Best Practices

1. **Deterministic Testing**
   - Use fixed timestamps in tests
   - Control block progression with `evm_mine`
   - Use consistent test data

2. **Gas Optimization**
   - Monitor gas usage with hardhat-gas-reporter
   - Test with realistic gas prices
   - Optimize before mainnet deployment

3. **Security Testing**
   - Test edge cases with large amounts
   - Verify access controls
   - Test reentrancy scenarios

4. **CI/CD Integration**
   - Run Anvil in GitHub Actions
   - Automated deployment testing
   - Gas usage benchmarking

## Integration with Frontend

The frontend automatically:
- Detects Anvil network (chain ID 31337)
- Loads deployed contract addresses via API
- Updates UI to show "Anvil Local" network
- Handles PlayToken operations seamlessly

No manual configuration needed - just connect MetaMask to Anvil!

## Next Steps

- Review the [Smart Contracts Documentation](./smart-contracts.md)
- Explore the [Frontend Architecture](./frontend-architecture.md)
- Learn about [Testing Strategies](./testing.md)
- Understand [Market Mechanics](./market-mechanics.md)

## Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [Anvil Reference](https://book.getfoundry.sh/anvil/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethereum Development Best Practices](https://consensys.github.io/smart-contract-best-practices/)