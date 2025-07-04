import { useState, useEffect, useCallback } from 'react';
import '@/types/ethereum';

interface MetaMaskState {
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  isMetaMaskAvailable: boolean;
  isInitialized: boolean;
}

interface MetaMaskActions {
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  switchToAmoy: () => Promise<boolean>;
  addAmoyNetwork: () => Promise<boolean>;
  refreshConnection: () => Promise<void>;
}

const POLYGON_AMOY_CHAIN_ID = 80002;
const POLYGON_AMOY_CHAIN_ID_HEX = '0x13882';

export function useMetaMask(): MetaMaskState & MetaMaskActions {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const isCorrectNetwork = chainId === POLYGON_AMOY_CHAIN_ID;

  // Check if MetaMask is available
  const checkMetaMaskAvailability = useCallback(() => {
    const available = typeof window !== 'undefined' && 
                     Boolean(window.ethereum) && 
                     Boolean(window.ethereum?.isMetaMask);
    setIsMetaMaskAvailable(available);
    return available;
  }, []);

  // Get current account
  const getCurrentAccount = useCallback(async (): Promise<string | null> => {
    if (!window.ethereum) return null;

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      });
      return (accounts as string[])?.[0] || null;
    } catch (error) {
      console.error('Failed to get current account:', error);
      return null;
    }
  }, []);

  // Get current chain ID
  const getCurrentChainId = useCallback(async (): Promise<number | null> => {
    if (!window.ethereum) return null;

    try {
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });
      return parseInt(chainId as string, 16);
    } catch (error) {
      console.error('Failed to get current chain ID:', error);
      return null;
    }
  }, []);

  // Connect to MetaMask
  const connect = useCallback(async (): Promise<boolean> => {
    if (!window.ethereum) {
      console.error('MetaMask not available');
      return false;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const currentAccount = (accounts as string[])?.[0];
      if (currentAccount) {
        setAccount(currentAccount);
        setIsConnected(true);
        
        // Also get chain ID
        const currentChainId = await getCurrentChainId();
        setChainId(currentChainId);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to connect to MetaMask:', error);
      return false;
    }
  }, [getCurrentChainId]);

  // Disconnect from MetaMask
  const disconnect = useCallback(async () => {
    try {
      // Try to revoke permissions from MetaMask
      if (window.ethereum) {
        await window.ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{
            eth_accounts: {}
          }]
        });
      }
    } catch (error) {
      console.log('Permission revocation not supported or failed:', error);
    }
    
    // Clear local state
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    
    // Clear any stored connection state
    if (typeof window !== 'undefined') {
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('lastConnectedAccount');
      
      // Force reload to ensure MetaMask provider state is reset
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  }, []);

  // Switch to Polygon Amoy network
  const switchToAmoy = useCallback(async (): Promise<boolean> => {
    if (!window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_AMOY_CHAIN_ID_HEX }],
      });
      return true;
    } catch (error) {
      console.error('Failed to switch to Amoy network:', error);
      return false;
    }
  }, []);

  // Add Polygon Amoy network
  const addAmoyNetwork = useCallback(async (): Promise<boolean> => {
    if (!window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: POLYGON_AMOY_CHAIN_ID_HEX,
            chainName: 'Polygon Amoy Testnet',
            nativeCurrency: {
              name: 'POL',
              symbol: 'POL',
              decimals: 18,
            },
            rpcUrls: ['https://polygon-amoy.g.alchemy.com/v2/Jmm9344uth8TJQi0gNCbs'],
            blockExplorerUrls: ['https://amoy.polygonscan.com/'],
          },
        ],
      });
      return true;
    } catch (error) {
      console.error('Failed to add Amoy network:', error);
      return false;
    }
  }, []);

  // Refresh connection state
  const refreshConnection = useCallback(async () => {
    if (!checkMetaMaskAvailability()) return;

    const currentAccount = await getCurrentAccount();
    const currentChainId = await getCurrentChainId();

    setAccount(currentAccount);
    setChainId(currentChainId);
    setIsConnected(Boolean(currentAccount));
  }, [checkMetaMaskAvailability, getCurrentAccount, getCurrentChainId]);

  // Handle account changes
  const handleAccountsChanged = useCallback((accounts: unknown) => {
    const accountList = accounts as string[];
    console.log('Accounts changed:', accountList);
    
    if (accountList.length === 0) {
      // User disconnected
      disconnect();
    } else {
      // User switched account
      setAccount(accountList[0]);
      setIsConnected(true);
      
      // Store connection state
      if (typeof window !== 'undefined') {
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('lastConnectedAccount', accountList[0]);
      }
    }
  }, [disconnect]);

  // Handle chain changes
  const handleChainChanged = useCallback((chainId: unknown) => {
    const newChainId = parseInt(chainId as string, 16);
    console.log('Chain changed:', newChainId);
    setChainId(newChainId);
  }, []);

  // Handle disconnect events
  const handleDisconnect = useCallback(() => {
    console.log('MetaMask disconnected');
    disconnect();
  }, [disconnect]);

  // Initialize MetaMask connection and set up event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initializeMetaMask = async () => {
      const available = checkMetaMaskAvailability();
      
      if (available) {
        // Check if user was previously connected
        const wasConnected = localStorage.getItem('walletConnected') === 'true';
        const lastAccount = localStorage.getItem('lastConnectedAccount');
        
        if (wasConnected && lastAccount) {
          await refreshConnection();
        }

        // Set up event listeners
        if (window.ethereum?.on) {
          window.ethereum.on('accountsChanged', handleAccountsChanged);
          window.ethereum.on('chainChanged', handleChainChanged);
          window.ethereum.on('disconnect', handleDisconnect);
        }
      }
      
      setIsInitialized(true);
    };

    initializeMetaMask();

    // Cleanup event listeners
    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [
    checkMetaMaskAvailability,
    refreshConnection,
    handleAccountsChanged,
    handleChainChanged,
    handleDisconnect,
  ]);

  // Store connection state when connected
  useEffect(() => {
    if (typeof window !== 'undefined' && account && isConnected) {
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('lastConnectedAccount', account);
    }
  }, [account, isConnected]);

  return {
    // State
    account,
    chainId,
    isConnected,
    isCorrectNetwork,
    isMetaMaskAvailable,
    isInitialized,
    
    // Actions
    connect,
    disconnect,
    switchToAmoy,
    addAmoyNetwork,
    refreshConnection,
  };
}