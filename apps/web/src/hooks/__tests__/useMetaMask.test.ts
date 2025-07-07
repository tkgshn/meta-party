/**
 * Comprehensive tests for useMetaMask hook
 * 
 * Based on testing patterns from Uniswap, Compound, and other major DApps
 * Tests wallet connection, session management, error handling, and edge cases
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useMetaMask } from '../useMetaMask';
import {
  setupEthereumMock,
  setupLocalStorageMock,
  simulateUserActions,
  MOCK_ADDRESSES,
  MOCK_CHAIN_IDS,
  MOCK_ERRORS,
  type MockEthereumProvider,
} from '../../utils/testUtils';

// Mock the session manager
jest.mock('../../utils/walletSession', () => ({
  createWalletSession: jest.fn(),
  clearWalletSession: jest.fn(),
  validateWalletSession: jest.fn(() => false),
  subscribeToSession: jest.fn(() => jest.fn()),
}));

describe('useMetaMask', () => {
  let mockProvider: MockEthereumProvider;
  let mockLocalStorage: Storage;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup browser mocks
    mockProvider = setupEthereumMock();
    mockLocalStorage = setupLocalStorageMock();
    
    // Mock console methods to reduce noise in tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore console
    jest.restoreAllMocks();
    
    // Clean up global mocks
    delete (window as Record<string, unknown>).ethereum;
  });

  describe('Initialization', () => {
    it('should initialize with correct default state', async () => {
      const { result } = renderHook(() => useMetaMask());

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.account).toBe(MOCK_ADDRESSES.ACCOUNT_1);
      expect(result.current.chainId).toBe(80002); // Polygon Amoy
      expect(result.current.isConnected).toBe(true);
      expect(result.current.isCorrectNetwork).toBe(true);
      expect(result.current.isMetaMaskAvailable).toBe(true);
    });

    it('should detect when MetaMask is not available', async () => {
      delete (window as Record<string, unknown>).ethereum;

      const { result } = renderHook(() => useMetaMask());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.isMetaMaskAvailable).toBe(false);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.account).toBe(null);
    });

    it('should handle initialization with no accounts', async () => {
      mockProvider._state.accounts = [];
      mockProvider._state.isConnected = false;

      const { result } = renderHook(() => useMetaMask());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.account).toBe(null);
    });
  });

  describe('Connection', () => {
    it('should connect to MetaMask successfully', async () => {
      // Start with disconnected state
      mockProvider._state.accounts = [];
      mockProvider._state.isConnected = false;

      const { result } = renderHook(() => useMetaMask());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Mock successful connection
      mockProvider._state.accounts = [MOCK_ADDRESSES.ACCOUNT_1];
      mockProvider._state.isConnected = true;

      let connectResult: boolean = false;
      await act(async () => {
        connectResult = await result.current.connect();
      });

      expect(connectResult).toBe(true);
      expect(result.current.isConnected).toBe(true);
      expect(result.current.account).toBe(MOCK_ADDRESSES.ACCOUNT_1);
      expect(mockProvider.request).toHaveBeenCalledWith({
        method: 'eth_requestAccounts',
      });
    });

    it('should handle user rejection during connection', async () => {
      mockProvider._state.accounts = [];
      mockProvider._state.isConnected = false;

      const { result } = renderHook(() => useMetaMask());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Mock user rejection
      mockProvider.request.mockRejectedValueOnce(MOCK_ERRORS.USER_REJECTED);

      let connectResult: boolean = true;
      await act(async () => {
        connectResult = await result.current.connect();
      });

      expect(connectResult).toBe(false);
      expect(result.current.isConnected).toBe(false);
      expect(result.current.account).toBe(null);
    });

    it('should handle connection without MetaMask', async () => {
      delete (window as Record<string, unknown>).ethereum;

      const { result } = renderHook(() => useMetaMask());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let connectResult: boolean = true;
      await act(async () => {
        connectResult = await result.current.connect();
      });

      expect(connectResult).toBe(false);
    });
  });

  describe('Disconnection', () => {
    it('should disconnect successfully', async () => {
      const { result } = renderHook(() => useMetaMask());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
        expect(result.current.isConnected).toBe(true);
      });

      await act(async () => {
        await result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.account).toBe(null);
      expect(result.current.chainId).toBe(null);
      
      // Should attempt to revoke permissions
      expect(mockProvider.request).toHaveBeenCalledWith({
        method: 'wallet_revokePermissions',
        params: [{ eth_accounts: {} }],
      });
    });

    it('should handle permission revocation failure gracefully', async () => {
      const { result } = renderHook(() => useMetaMask());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Mock permission revocation failure
      mockProvider.request.mockImplementation(async ({ method }) => {
        if (method === 'wallet_revokePermissions') {
          throw new Error('Permission revocation not supported');
        }
        // Return default mock behavior for other methods
        return '0x0';
      });

      await act(async () => {
        await result.current.disconnect();
      });

      // Should still clear local state despite revocation failure
      expect(result.current.isConnected).toBe(false);
      expect(result.current.account).toBe(null);
    });
  });

  describe('Network Management', () => {
    it('should switch to Polygon Amoy network', async () => {
      // Start with different network
      mockProvider._state.chainId = MOCK_CHAIN_IDS.ETHEREUM;

      const { result } = renderHook(() => useMetaMask());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let switchResult: boolean = false;
      await act(async () => {
        switchResult = await result.current.switchToAmoy();
      });

      expect(switchResult).toBe(true);
      expect(mockProvider.request).toHaveBeenCalledWith({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x13882' }],
      });
    });

    it('should add Polygon Amoy network', async () => {
      const { result } = renderHook(() => useMetaMask());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      let addResult: boolean = false;
      await act(async () => {
        addResult = await result.current.addAmoyNetwork();
      });

      expect(addResult).toBe(true);
      expect(mockProvider.request).toHaveBeenCalledWith({
        method: 'wallet_addEthereumChain',
        params: [expect.objectContaining({
          chainId: '0x13882',
          chainName: 'Polygon Amoy Testnet',
        })],
      });
    });

    it('should detect correct network', async () => {
      const { result } = renderHook(() => useMetaMask());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.isCorrectNetwork).toBe(true);

      // Change to wrong network
      act(() => {
        simulateUserActions.changeNetwork(mockProvider, MOCK_CHAIN_IDS.ETHEREUM);
      });

      await waitFor(() => {
        expect(result.current.isCorrectNetwork).toBe(false);
      });
    });
  });

  describe('Event Handling', () => {
    it('should handle account changes', async () => {
      const { result } = renderHook(() => useMetaMask());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Simulate account change
      act(() => {
        simulateUserActions.changeAccount(mockProvider, MOCK_ADDRESSES.ACCOUNT_2);
      });

      await waitFor(() => {
        expect(result.current.account).toBe(MOCK_ADDRESSES.ACCOUNT_2);
      });
    });

    it('should handle account disconnection', async () => {
      const { result } = renderHook(() => useMetaMask());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
        expect(result.current.isConnected).toBe(true);
      });

      // Simulate disconnection
      act(() => {
        simulateUserActions.disconnectWallet(mockProvider);
      });

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
        expect(result.current.account).toBe(null);
      });
    });

    it('should handle chain changes', async () => {
      const { result } = renderHook(() => useMetaMask());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      const initialChainId = result.current.chainId;

      // Simulate chain change
      act(() => {
        simulateUserActions.changeNetwork(mockProvider, MOCK_CHAIN_IDS.ARBITRUM);
      });

      await waitFor(() => {
        expect(result.current.chainId).not.toBe(initialChainId);
        expect(result.current.chainId).toBe(parseInt(MOCK_CHAIN_IDS.ARBITRUM, 16));
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle RPC errors gracefully', async () => {
      mockProvider.request.mockRejectedValue(MOCK_ERRORS.INTERNAL_ERROR);

      const { result } = renderHook(() => useMetaMask());

      // Should not crash despite RPC errors
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });
    });

    it('should handle missing ethereum object', async () => {
      delete (window as Record<string, unknown>).ethereum;

      const { result } = renderHook(() => useMetaMask());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.isMetaMaskAvailable).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should create session on successful connection', async () => {
      const { createWalletSession } = await import('../../utils/walletSession');
      
      mockProvider._state.accounts = [];
      const { result } = renderHook(() => useMetaMask());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      mockProvider._state.accounts = [MOCK_ADDRESSES.ACCOUNT_1];

      await act(async () => {
        await result.current.connect();
      });

      expect(createWalletSession).toHaveBeenCalledWith(
        MOCK_ADDRESSES.ACCOUNT_1,
        80002
      );
    });

    it('should clear session on disconnect', async () => {
      const { clearWalletSession } = await import('../../utils/walletSession');
      
      const { result } = renderHook(() => useMetaMask());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.disconnect();
      });

      expect(clearWalletSession).toHaveBeenCalled();
    });
  });

  describe('Local Storage', () => {
    it('should persist connection state', async () => {
      const { result } = renderHook(() => useMetaMask());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
        expect(result.current.isConnected).toBe(true);
      });

      // Should store connection state
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'walletConnected',
        'true'
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'lastConnectedAccount',
        MOCK_ADDRESSES.ACCOUNT_1
      );
    });

    it('should clear storage on disconnect', async () => {
      const { result } = renderHook(() => useMetaMask());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      await act(async () => {
        await result.current.disconnect();
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('walletConnected');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('lastConnectedAccount');
    });
  });
});