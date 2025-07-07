// Utility to load Anvil contract addresses dynamically
import { NETWORKS } from '../config/networks';

interface DeployedAddresses {
  network: string;
  chainId: number;
  deployer: string;
  playToken: string;
  conditionalTokens: string;
  marketFactory: string;
  testMarket?: string;
}

export async function loadAnvilContracts(): Promise<void> {
  try {
    // Only load for Anvil network
    if (typeof window === 'undefined') return;
    
    // Check if we're on Anvil network
    const chainId = await window.ethereum?.request({ method: 'eth_chainId' });
    if (parseInt(chainId, 16) !== 31337) return;
    
    // Try to load deployed addresses for Anvil
    const response = await fetch('/api/anvil-contracts');
    if (!response.ok) {
      console.log('No Anvil contracts found, using default configuration');
      return;
    }
    
    const addresses: DeployedAddresses = await response.json();
    
    // Update the Anvil network configuration with deployed addresses
    if (NETWORKS.anvil && addresses.chainId === 31337) {
      NETWORKS.anvil.contracts = {
        playToken: addresses.playToken,
        marketFactory: addresses.marketFactory,
        conditionalTokens: addresses.conditionalTokens
      };
      
      console.log('Loaded Anvil contract addresses:', {
        playToken: addresses.playToken,
        marketFactory: addresses.marketFactory,
        conditionalTokens: addresses.conditionalTokens
      });
    }
  } catch (error) {
    console.log('Failed to load Anvil contracts:', error);
  }
}

// Helper function to check if contracts are deployed on Anvil
export function areAnvilContractsDeployed(): boolean {
  const anvilNetwork = NETWORKS.anvil;
  return !!(
    anvilNetwork?.contracts.playToken &&
    anvilNetwork?.contracts.marketFactory &&
    anvilNetwork?.contracts.conditionalTokens
  );
}