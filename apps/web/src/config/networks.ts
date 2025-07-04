// Network configurations for multi-chain support
export interface NetworkConfig {
  chainId: number;
  chainIdHex: string;
  name: string;
  displayName: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts: {
    usdc?: string;
    playToken?: string;
    marketFactory?: string;
    conditionalTokens?: string;
  };
  isTestnet: boolean;
  gasSettings: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
  };
}

export const NETWORKS: Record<string, NetworkConfig> = {
  // Polygon Mainnet with USDC
  polygon: {
    chainId: 137,
    chainIdHex: '0x89',
    name: 'polygon',
    displayName: 'Polygon Mainnet',
    rpcUrls: [
      'https://polygon-rpc.com',
      'https://rpc.ankr.com/polygon',
      'https://polygon-bor.publicnode.com'
    ],
    blockExplorerUrls: ['https://polygonscan.com'],
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    contracts: {
      // Native Circle USDC on Polygon Mainnet
      usdc: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      // TODO: Deploy market contracts to Polygon Mainnet
      marketFactory: undefined,
      conditionalTokens: undefined
    },
    isTestnet: false,
    gasSettings: {
      // Based on July 2025 Polygon gas recommendations
      maxFeePerGas: '0x82DDA9C00', // 35 gwei (35 * 10^9)
      maxPriorityFeePerGas: '0x6FC23AC00' // 30 gwei (30 * 10^9)
    }
  },
  
  // Polygon Amoy Testnet with Play Token (existing)
  polygonAmoy: {
    chainId: 80002,
    chainIdHex: '0x13882',
    name: 'polygonAmoy',
    displayName: 'Polygon Amoy Testnet',
    rpcUrls: [
      'https://rpc-amoy.polygon.technology',
      'https://polygon-amoy.publicnode.com'
    ],
    blockExplorerUrls: ['https://amoy.polygonscan.com'],
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    contracts: {
      playToken: process.env.NEXT_PUBLIC_PLAY_TOKEN_ADDRESS || '0x237B9E4EEE4AeAf712B5B240Ab03C973310B6bD1',
      marketFactory: process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS || '0x9f1C3f06B201FFa385a4BB3695f78cB1c17c12db',
      conditionalTokens: process.env.NEXT_PUBLIC_CONDITIONAL_TOKENS_ADDRESS || '0x0416a4757062c1e61759ADDb6d68Af145919F045'
    },
    isTestnet: true,
    gasSettings: {
      maxFeePerGas: '0x1DCD6500', // 500000000 wei (0.5 gwei) - testnet
      maxPriorityFeePerGas: '0x1DCD6500' // 500000000 wei (0.5 gwei)
    }
  }
};

// Default network (can be changed via UI)
export const DEFAULT_NETWORK = 'polygon';

// Get network config by chain ID
export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  return Object.values(NETWORKS).find(network => network.chainId === chainId);
}

// Get supported chain IDs
export function getSupportedChainIds(): number[] {
  return Object.values(NETWORKS).map(network => network.chainId);
}

// Check if chain ID is supported
export function isSupportedChainId(chainId: number): boolean {
  return getSupportedChainIds().includes(chainId);
}

// Get currency symbol for network
export function getCurrencySymbol(networkKey: string): string {
  const network = NETWORKS[networkKey];
  if (!network) return 'Unknown';
  
  // For Polygon Amoy testnet, show Play Token
  if (networkKey === 'polygonAmoy' && network.contracts.playToken) {
    return 'PT';
  }
  
  // For Polygon mainnet, show native MATIC instead of USDC
  if (networkKey === 'polygon') {
    return 'MATIC';
  }
  
  return network.nativeCurrency.symbol;
}

// Get currency contract address
export function getCurrencyContract(networkKey: string): string | undefined {
  const network = NETWORKS[networkKey];
  if (!network) return undefined;
  
  // For Polygon mainnet, don't return any contract address (use native MATIC)
  if (networkKey === 'polygon') {
    return undefined;
  }
  
  // For Amoy testnet, return Play Token address
  if (networkKey === 'polygonAmoy') {
    return network.contracts.playToken;
  }
  
  // For other networks, return appropriate contract
  return network.contracts.usdc || network.contracts.playToken;
}

// Get currency decimals
export function getCurrencyDecimals(networkKey: string): number {
  const network = NETWORKS[networkKey];
  if (!network) return 18;
  
  // All tokens (MATIC, PT) have 18 decimals
  return 18;
}