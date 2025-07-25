import { useState, useEffect, useCallback } from 'react';
import { createWalletSession, clearWalletSession, validateWalletSession } from '@/utils/walletSession';
import { NETWORKS, isSupportedChainId } from '@/config/networks';
import { loadAnvilContracts } from '@/utils/anvil-contracts';
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
  switchNetwork: (chainId: number) => Promise<boolean>;
  addNetwork: (networkKey: string) => Promise<boolean>;
  getCurrentChainId: () => Promise<number | null>;
  refreshConnection: () => Promise<void>;
}

// const POLYGON_AMOY_CHAIN_ID = 80002;
const POLYGON_AMOY_CHAIN_ID_HEX = '0x13882';

export function useMetaMask(): MetaMaskState & MetaMaskActions {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const isCorrectNetwork = chainId ? isSupportedChainId(chainId) : false;

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
    // Double-check MetaMask availability
    if (!window.ethereum || !window.ethereum.isMetaMask) {
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
        
        // Create wallet session for persistent login
        if (currentChainId) {
          createWalletSession(currentAccount, currentChainId);
        }
        
        return true;
      }
      return false;
    } catch (error: unknown) {
      console.error('Failed to connect to MetaMask:', error);
      
      // Return false for user rejection and other errors instead of throwing
      return false;
    }
  }, [getCurrentChainId]);

  // Enhanced disconnect with proper cleanup (no page reload needed)
  const disconnect = useCallback(async () => {
    try {
      // Try to revoke permissions from MetaMask (EIP-2255)
      if (window.ethereum && window.ethereum.request) {
        try {
          await window.ethereum.request({
            method: 'wallet_revokePermissions',
            params: [{
              eth_accounts: {}
            }]
          });
        } catch (revokeError) {
          // wallet_revokePermissions not supported in all wallets, continue with cleanup
          console.log('Permission revocation not supported:', revokeError);
        }
      }
    } catch (error) {
      console.log('MetaMask permission revocation failed:', error);
    }
    
    // Clear local component state immediately
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    
    // Clear wallet session
    clearWalletSession();
    
    // Clear persistent storage and cached data
    if (typeof window !== 'undefined') {
      // Clear wallet connection state
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('lastConnectedAccount');
      
      // Clear any WalletConnect related storage (if present)
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('wc@') || key.startsWith('walletconnect')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear wagmi-style storage (if present)
      localStorage.removeItem('wagmi.store');
      localStorage.removeItem('wagmi.cache');
      localStorage.removeItem('wagmi.wallet');
      
      // Clear session storage
      sessionStorage.removeItem('walletConnected');
      sessionStorage.removeItem('wallet-address');
    }
    
    console.log('Wallet disconnected successfully');
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

  // Generic network adding function
  const addNetwork = useCallback(async (networkKey: string): Promise<boolean> => {
    if (!window.ethereum) return false;

    const network = NETWORKS[networkKey];
    if (!network) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: network.chainIdHex,
            chainName: network.displayName,
            nativeCurrency: network.nativeCurrency,
            rpcUrls: network.rpcUrls,
            blockExplorerUrls: network.blockExplorerUrls,
          },
        ],
      });
      return true;
    } catch (error: any) {
      console.error(`Failed to add ${network.displayName}:`, {
        error: error.message || error,
        code: error.code,
        networkKey,
        network: network.displayName
      });
      return false;
    }
  }, []);

  // Generic network switching function
  const switchNetwork = useCallback(async (chainId: number): Promise<boolean> => {
    if (!window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
      return true;
    } catch (error: any) {
      console.error('Failed to switch network:', {
        error: error.message || error,
        code: error.code,
        chainId,
        chainIdHex: `0x${chainId.toString(16)}`
      });
      
      // If the chain is not added to MetaMask, try to add it
      if (error.code === 4902) {
        const networkKey = Object.keys(NETWORKS).find(
          key => NETWORKS[key].chainId === chainId
        );
        if (networkKey) {
          console.log(`Chain ${chainId} not added to MetaMask, attempting to add ${networkKey}`);
          return await addNetwork(networkKey);
        }
      }
      return false;
    }
  }, [addNetwork]);

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
    
    // Load Anvil contracts if switched to Anvil network
    if (newChainId === 31337) {
      loadAnvilContracts().catch(console.error);
    }
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
      // Add a small delay to ensure window.ethereum is properly available
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const available = checkMetaMaskAvailability();
      
      if (available) {
        // Check session and auto-restore connection
        const currentAccount = await getCurrentAccount();
        const currentChainId = await getCurrentChainId();
        
        // Validate existing session
        if (validateWalletSession(currentAccount, currentChainId)) {
          setAccount(currentAccount);
          setChainId(currentChainId);
          setIsConnected(Boolean(currentAccount));
        } else if (currentAccount) {
          // Account exists but no valid session, create new session
          if (currentChainId) {
            createWalletSession(currentAccount, currentChainId);
            setAccount(currentAccount);
            setChainId(currentChainId);
            setIsConnected(true);
          }
        }
        
        // Load Anvil contracts if on Anvil network
        if (currentChainId === 31337) {
          loadAnvilContracts().catch(console.error);
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
    getCurrentAccount,
    getCurrentChainId,
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
    switchNetwork,
    addNetwork,
    getCurrentChainId,
    refreshConnection,
  };
}