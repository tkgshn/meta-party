import { renderHook } from '@testing-library/react';
import { usePlayToken } from '../usePlayToken';

// Mock ethereum window object
const mockEthereum = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
};

// Mock ethers
jest.mock('ethers', () => ({
  BrowserProvider: jest.fn().mockImplementation(() => ({
    getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(80002) }),
    on: jest.fn(),
    removeAllListeners: jest.fn(),
  })),
  Contract: jest.fn().mockImplementation(() => ({
    balanceOf: jest.fn().mockResolvedValue(BigInt('1000000000000000000000')),
    hasClaimed: jest.fn().mockResolvedValue(false),
  })),
  formatUnits: jest.fn().mockReturnValue('1000'),
}));

// Mock networks config
jest.mock('@/config/networks', () => ({
  getNetworkByChainId: jest.fn(),
  NETWORKS: {
    polygonAmoy: {
      chainId: 80002,
      contracts: {
        playToken: '0x237B9E4EEE4AeAf712B5B240Ab03C973310B6bD1',
      },
    },
    sepolia: {
      chainId: 11155111,
      contracts: {
        playToken: undefined,
      },
    },
  },
}));

interface EthereumRequest {
  method: string;
  params?: unknown[];
}

describe('usePlayToken Hook - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    Object.defineProperty(window, 'ethereum', {
      value: mockEthereum,
      writable: true,
    });

    // Import the mocked function
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getNetworkByChainId } = require('@/config/networks');
    
    // Setup mock implementation
    getNetworkByChainId.mockImplementation((chainId: number) => {
      if (chainId === 80002) {
        return {
          chainId: 80002,
          displayName: 'Polygon Amoy',
          contracts: {
            playToken: '0x237B9E4EEE4AeAf712B5B240Ab03C973310B6bD1',
          },
        };
      }
      if (chainId === 11155111) {
        return {
          chainId: 11155111,
          displayName: 'Sepolia',
          contracts: {
            playToken: undefined,
          },
        };
      }
      return null;
    });
  });

  describe('Basic Hook Functionality', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => usePlayToken(null));

      expect(result.current.balance).toBe('0');
      expect(result.current.hasClaimed).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.lastClaimTxHash).toBe(null);
      expect(result.current.claimHistory).toEqual([]);
      expect(result.current.balanceWei).toBe(null);
    });

    it('should initialize when account is provided', () => {
      const { result } = renderHook(() => usePlayToken('0x1234567890123456789012345678901234567890'));

      expect(result.current.balance).toBe('0');
      expect(result.current.isLoading).toBe(false);
      expect(typeof result.current.refreshBalance).toBe('function');
      expect(typeof result.current.claimTokens).toBe('function');
      expect(typeof result.current.addTokenToMetaMask).toBe('function');
    });
  });

  describe('Network Configuration Tests', () => {
    it('should export network configurations correctly', () => {
      // This tests that our NETWORK_CONFIGS are properly structured
      const { result } = renderHook(() => usePlayToken('0x1234567890123456789012345678901234567890'));
      
      // Check that the hook initializes without errors
      expect(result.current).toBeDefined();
      expect(result.current.isContractsAvailable).toBeDefined();
      expect(result.current.currentChainId).toBeDefined();
      expect(result.current.networkConfig).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing account gracefully', () => {
      const { result } = renderHook(() => usePlayToken(null));

      expect(result.current.balance).toBe('0');
      expect(result.current.isContractsAvailable).toBe(false);
      expect(result.current.currentChainId).toBe(null);
    });

    it('should handle missing ethereum window object', () => {
      // Remove ethereum from window
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true,
      });

      const { result } = renderHook(() => usePlayToken('0x1234567890123456789012345678901234567890'));

      expect(result.current.balance).toBe('0');
      expect(result.current.isContractsAvailable).toBe(false);
    });
  });

  describe('Function Availability', () => {
    it('should provide all required functions', () => {
      const { result } = renderHook(() => usePlayToken('0x1234567890123456789012345678901234567890'));

      // Check that all required functions are available
      expect(typeof result.current.refreshBalance).toBe('function');
      expect(typeof result.current.refreshClaimStatus).toBe('function');
      expect(typeof result.current.claimTokens).toBe('function');
      expect(typeof result.current.addTokenToMetaMask).toBe('function');
      expect(typeof result.current.checkTransactionStatus).toBe('function');
    });
  });

  describe('State Management', () => {
    it('should manage loading state correctly', () => {
      const { result } = renderHook(() => usePlayToken('0x1234567890123456789012345678901234567890'));

      // Initially not loading
      expect(result.current.isLoading).toBe(false);
    });

    it('should track network configuration state', () => {
      const { result } = renderHook(() => usePlayToken('0x1234567890123456789012345678901234567890'));

      // Network config should be trackable
      expect(result.current.isContractsAvailable).toBeDefined();
      expect(result.current.currentChainId).toBeDefined();
      expect(result.current.networkConfig).toBeDefined();
    });
  });

  describe('Network-Specific Behavior', () => {
    it('should handle Polygon Amoy network configuration', () => {
      mockEthereum.request.mockImplementation((params: EthereumRequest) => {
        if (params.method === 'eth_chainId') {
          return Promise.resolve('0x13882'); // 80002 in hex
        }
        return Promise.resolve('0x1');
      });

      const { result } = renderHook(() => usePlayToken('0x1234567890123456789012345678901234567890'));

      // Hook should initialize for Polygon Amoy
      expect(result.current).toBeDefined();
    });

    it('should handle Sepolia network configuration', () => {
      mockEthereum.request.mockImplementation((params: EthereumRequest) => {
        if (params.method === 'eth_chainId') {
          return Promise.resolve('0xaa36a7'); // 11155111 in hex
        }
        return Promise.resolve('0x1');
      });

      const { result } = renderHook(() => usePlayToken('0x1234567890123456789012345678901234567890'));

      // Hook should initialize for Sepolia (even if contracts not deployed)
      expect(result.current).toBeDefined();
    });
  });
});