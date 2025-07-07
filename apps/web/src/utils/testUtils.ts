/**
 * Test Utilities for Wallet Integration
 * 
 * Based on testing patterns from Uniswap, Compound, and other major DApps
 * Provides mocks and utilities for testing wallet interactions
 */

import { jest, expect } from '@jest/globals';

// Mock Ethereum Provider Interface
export interface MockEthereumProvider {
  isMetaMask: boolean;
  request: jest.MockedFunction<(args: { method: string; params?: unknown[] }) => Promise<unknown>>;
  on: jest.MockedFunction<(event: string, handler: (...args: unknown[]) => void) => void>;
  removeListener: jest.MockedFunction<(event: string, handler: (...args: unknown[]) => void) => void>;
  removeAllListeners: jest.MockedFunction<(event?: string) => void>;
  _state: {
    accounts: string[];
    chainId: string;
    isConnected: boolean;
    isUnlocked: boolean;
  };
}

// Mock wallet addresses for testing
export const MOCK_ADDRESSES = {
  ACCOUNT_1: '0x742d35Cc6634C0532925a3b8D937C5f0b0c5e41c',
  ACCOUNT_2: '0x8ba1f109551bD432803012645Hac136c34e2',
  INVALID: '0xinvalid',
};

// Mock chain IDs
export const MOCK_CHAIN_IDS = {
  ETHEREUM: '0x1',
  POLYGON: '0x89',
  POLYGON_AMOY: '0x13882', // 80002
  ARBITRUM: '0xa4b1',
};

// Mock transaction responses
export const MOCK_TRANSACTIONS = {
  SUCCESS: {
    hash: '0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef123456',
    status: '0x1',
    blockNumber: '0x123456',
    gasUsed: '0x5208',
  },
  PENDING: {
    hash: '0x987654321fedcba987654321fedcba987654321fedcba987654321fedcba987654',
  },
  FAILED: {
    hash: '0x111111111111111111111111111111111111111111111111111111111111111',
    status: '0x0',
  },
};

// Common error responses
export const MOCK_ERRORS = {
  USER_REJECTED: {
    code: 4001,
    message: 'User rejected the request.',
  },
  UNAUTHORIZED: {
    code: 4100,
    message: 'The requested account and/or method has not been authorized by the user.',
  },
  UNSUPPORTED_METHOD: {
    code: 4200,
    message: 'The requested method is not supported by this Ethereum provider.',
  },
  DISCONNECTED: {
    code: 4900,
    message: 'The provider is disconnected from all chains.',
  },
  CHAIN_DISCONNECTED: {
    code: 4901,
    message: 'The provider is disconnected from the specified chain.',
  },
  INTERNAL_ERROR: {
    code: -32603,
    message: 'Internal JSON-RPC error.',
  },
};

/**
 * Create a mock Ethereum provider
 */
export function createMockEthereumProvider(
  initialState: Partial<MockEthereumProvider['_state']> = {}
): MockEthereumProvider {
  const defaultState = {
    accounts: [MOCK_ADDRESSES.ACCOUNT_1],
    chainId: MOCK_CHAIN_IDS.POLYGON_AMOY,
    isConnected: true,
    isUnlocked: true,
    ...initialState,
  };

  const mockProvider: MockEthereumProvider = {
    isMetaMask: true,
    request: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    _state: defaultState,
  };

  // Setup default request handlers
  mockProvider.request.mockImplementation(async ({ method, params }: { method: string; params?: unknown[] }) => {
    switch (method) {
      case 'eth_accounts':
        return mockProvider._state.accounts;
      
      case 'eth_requestAccounts':
        if (!mockProvider._state.isUnlocked) {
          throw MOCK_ERRORS.UNAUTHORIZED;
        }
        return mockProvider._state.accounts;
      
      case 'eth_chainId':
        return mockProvider._state.chainId;
      
      case 'wallet_switchEthereumChain':
        if (params?.[0] && typeof params[0] === 'object' && params[0] !== null && 'chainId' in params[0]) {
          mockProvider._state.chainId = (params[0] as { chainId: string }).chainId;
        }
        return null;
      
      case 'wallet_addEthereumChain':
        if (params?.[0] && typeof params[0] === 'object' && params[0] !== null && 'chainId' in params[0]) {
          mockProvider._state.chainId = (params[0] as { chainId: string }).chainId;
        }
        return null;
      
      case 'eth_getBalance':
        return '0x1bc16d674ec80000'; // 2 ETH in wei
      
      case 'eth_call':
        // Mock contract calls
        if (params?.[0] && typeof params[0] === 'object' && params[0] !== null && 'data' in params[0] && 
            typeof (params[0] as { data: unknown }).data === 'string' && 
            (params[0] as { data: string }).data.startsWith('0x70a08231')) {
          // balanceOf call
          return '0x3635c9adc5dea00000'; // 1000 tokens with 18 decimals
        }
        return '0x0';
      
      case 'eth_sendTransaction':
        return MOCK_TRANSACTIONS.SUCCESS.hash;
      
      case 'eth_getTransactionReceipt':
        return MOCK_TRANSACTIONS.SUCCESS;
      
      case 'wallet_revokePermissions':
        mockProvider._state.accounts = [];
        return null;
      
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  });

  return mockProvider;
}

/**
 * Setup global window.ethereum mock
 */
export function setupEthereumMock(
  providerState?: Partial<MockEthereumProvider['_state']>
): MockEthereumProvider {
  const mockProvider = createMockEthereumProvider(providerState);
  
  Object.defineProperty(window, 'ethereum', {
    writable: true,
    value: mockProvider,
  });

  return mockProvider;
}

/**
 * Setup localStorage mock
 */
export function setupLocalStorageMock(): Storage {
  const store: Record<string, string> = {};

  const mockStorage = {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    length: 0,
    key: jest.fn((index: number): string | null => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };

  Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: mockStorage,
  });

  Object.defineProperty(window, 'sessionStorage', {
    writable: true,
    value: mockStorage,
  });

  return mockStorage;
}

/**
 * Simulate user actions
 */
export const simulateUserActions = {
  /**
   * Simulate user rejecting a transaction
   */
  rejectTransaction: (mockProvider: MockEthereumProvider) => {
    mockProvider.request.mockRejectedValueOnce(MOCK_ERRORS.USER_REJECTED);
  },

  /**
   * Simulate user disconnecting wallet
   */
  disconnectWallet: (mockProvider: MockEthereumProvider) => {
    mockProvider._state.accounts = [];
    mockProvider._state.isConnected = false;
    
    // Simulate accountsChanged event
    const accountsChangedHandler = mockProvider.on.mock.calls.find(
      call => call[0] === 'accountsChanged'
    )?.[1];
    
    if (accountsChangedHandler) {
      accountsChangedHandler([]);
    }
  },

  /**
   * Simulate network change
   */
  changeNetwork: (mockProvider: MockEthereumProvider, chainId: string) => {
    mockProvider._state.chainId = chainId;
    
    // Simulate chainChanged event
    const chainChangedHandler = mockProvider.on.mock.calls.find(
      call => call[0] === 'chainChanged'
    )?.[1];
    
    if (chainChangedHandler) {
      chainChangedHandler(chainId);
    }
  },

  /**
   * Simulate account change
   */
  changeAccount: (mockProvider: MockEthereumProvider, account: string) => {
    mockProvider._state.accounts = [account];
    
    // Simulate accountsChanged event
    const accountsChangedHandler = mockProvider.on.mock.calls.find(
      call => call[0] === 'accountsChanged'
    )?.[1];
    
    if (accountsChangedHandler) {
      accountsChangedHandler([account]);
    }
  },
};

/**
 * Wait for async updates in tests
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Test wallet connection flow
 */
export async function testWalletConnection(
  connectFunction: () => Promise<boolean>,
  mockProvider: MockEthereumProvider
): Promise<void> {
  // Test successful connection
  const result = await connectFunction();
  expect(result).toBe(true);
  expect(mockProvider.request).toHaveBeenCalledWith({
    method: 'eth_requestAccounts',
  });

  // Test user rejection
  simulateUserActions.rejectTransaction(mockProvider);
  const rejectedResult = await connectFunction();
  expect(rejectedResult).toBe(false);
}

/**
 * Custom jest matchers for wallet testing
 */
export const walletMatchers = {
  toBeValidAddress: (received: string) => {
    const isValid = /^0x[a-fA-F0-9]{40}$/.test(received);
    return {
      message: () => `expected ${received} to be a valid Ethereum address`,
      pass: isValid,
    };
  },
  
  toBeValidChainId: (received: number) => {
    const isValid = Number.isInteger(received) && received > 0;
    return {
      message: () => `expected ${received} to be a valid chain ID`,
      pass: isValid,
    };
  },
};

// Export for use in jest setup
const testUtils = {
  createMockEthereumProvider,
  setupEthereumMock,
  setupLocalStorageMock,
  simulateUserActions,
  waitForAsync,
  testWalletConnection,
  walletMatchers,
};

export default testUtils;