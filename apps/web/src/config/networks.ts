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
  
  // Ethereum Sepolia Testnet
  sepolia: {
    chainId: 11155111,
    chainIdHex: '0xaa36a7',
    name: 'sepolia',
    displayName: 'Sepolia Testnet',
    rpcUrls: [
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com',
      'https://ethereum-sepolia.publicnode.com',
      'https://sepolia.publicnode.com'
    ],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'SEP',
      decimals: 18
    },
    contracts: {
      playToken: process.env.NEXT_PUBLIC_SEPOLIA_PLAY_TOKEN_ADDRESS || '0x45d1Fb8fD268E3156D00119C6f195f9ad784C6CE',
      marketFactory: process.env.NEXT_PUBLIC_SEPOLIA_MARKET_FACTORY_ADDRESS || '0x68eF1D7Fae3067A9E5FcC7Cb3083F6C15e44537d',
      conditionalTokens: process.env.NEXT_PUBLIC_SEPOLIA_CONDITIONAL_TOKENS_ADDRESS || '0x1d1ddb215F901D0541F588490Aa74f11B09f1e5d'
    },
    isTestnet: true,
    gasSettings: {
      maxFeePerGas: '0x2E90EDD00', // 12.5 gwei
      maxPriorityFeePerGas: '0x1DCD6500' // 0.5 gwei
    }
  },

  
  // Local Anvil Development Network
  anvil: {
    chainId: 31337,
    chainIdHex: '0x7a69',
    name: 'anvil',
    displayName: 'Anvil Local',
    rpcUrls: [
      'http://127.0.0.1:8545',
      'http://localhost:8545'
    ],
    blockExplorerUrls: [],
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    contracts: {
      // Contracts deployed to local Anvil network
      playToken: process.env.NEXT_PUBLIC_ANVIL_PLAY_TOKEN_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      marketFactory: process.env.NEXT_PUBLIC_ANVIL_MARKET_FACTORY_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      conditionalTokens: process.env.NEXT_PUBLIC_ANVIL_CONDITIONAL_TOKENS_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'
    },
    isTestnet: true,
    gasSettings: {
      maxFeePerGas: '0x3B9ACA00', // 1 gwei for local dev
      maxPriorityFeePerGas: '0x3B9ACA00' // 1 gwei
    }
  }
};

// Default network (can be changed via UI)
export const DEFAULT_NETWORK = 'sepolia';

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
  
  // For Sepolia testnet, show Play Token if deployed, otherwise SEP
  if (networkKey === 'sepolia') {
    return network.contracts.playToken ? 'PT' : 'SEP';
  }
  
  
  // For Anvil local network, show Play Token when deployed
  if (networkKey === 'anvil') {
    return network.contracts.playToken ? 'PT' : 'ETH';
  }
  
  
  return network.nativeCurrency.symbol;
}

// Get currency contract address
export function getCurrencyContract(networkKey: string): string | undefined {
  const network = NETWORKS[networkKey];
  if (!network) return undefined;
  
  // For Sepolia testnet, return Play Token address if deployed
  if (networkKey === 'sepolia') {
    return network.contracts.playToken;
  }
  
  // For Anvil local network, return Play Token address if deployed
  if (networkKey === 'anvil') {
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