// Test script to verify Sepolia network configuration
import { NETWORKS } from './apps/web/src/config/networks.js';

console.log('Sepolia Network Configuration:');
console.log('Chain ID:', NETWORKS.sepolia.chainId);
console.log('Play Token Address:', NETWORKS.sepolia.contracts.playToken);
console.log('Is Testnet:', NETWORKS.sepolia.isTestnet);

// Check if Play Token address is defined
if (!NETWORKS.sepolia.contracts.playToken) {
  console.log('\n⚠️  WARNING: Play Token address is not defined for Sepolia network');
  console.log('This will cause the "could not decode result data" error when trying to interact with the contract.');
  console.log('\nTo fix this:');
  console.log('1. Deploy Play Token contract to Sepolia');
  console.log('2. Set NEXT_PUBLIC_SEPOLIA_PLAY_TOKEN_ADDRESS environment variable');
  console.log('3. Or update the contractsDeployed flag to false in usePlayToken hook');
}