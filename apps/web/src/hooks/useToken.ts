import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserProvider, Contract, formatUnits, parseUnits } from 'ethers';
import { NETWORKS, getCurrencySymbol, getCurrencyContract, getCurrencyDecimals } from '@/config/networks';
import { useAccount, useConnectorClient } from 'wagmi';
import type { Account, Chain, Client, Transport } from 'viem';
import '@/types/ethereum';

// ERC-20 ABI for token functions
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  // USDC specific functions
  'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)',
  // Play Token specific functions (for Amoy testnet)
  'function claim()',
  'function hasClaimed(address) view returns (bool)'
] as const;

interface TokenState {
  balance: string;
  balanceWei: bigint | null;
  symbol: string;
  decimals: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  // Play Token specific
  hasClaimed?: boolean;
  canClaim?: boolean;
  isTokenAddedToMetaMask?: boolean;
}

interface TokenActions {
  refreshBalance: () => Promise<void>;
  transfer: (to: string, amount: string) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  approve: (spender: string, amount: string) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  // Play Token specific
  claimTokens?: () => Promise<{ success: boolean; txHash?: string; error?: string }>;
  addTokenToMetaMask: () => Promise<boolean>;
}

const DEBUG_MODE = process.env.NODE_ENV === 'development'; // Re-enable for debugging

// Utility function to convert wagmi client to ethers provider
function clientToProvider(client: Client<Transport, Chain, Account>) {
  const { chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  if (transport.type === 'fallback') {
    return new BrowserProvider(
      (transport.transports as any)[0].value,
      network
    );
  }
  return new BrowserProvider(transport, network);
}

export function useToken(account: string | null, networkKey?: string): TokenState & TokenActions {
  const [balance, setBalance] = useState<string>('0');
  const [balanceWei, setBalanceWei] = useState<bigint | null>(null);
  const [symbol, setSymbol] = useState<string>('');
  const [decimals, setDecimals] = useState<number>(18);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasClaimed, setHasClaimed] = useState<boolean>(false);
  const [isTokenAddedToMetaMask, setIsTokenAddedToMetaMask] = useState<boolean>(false);
  
  const { isConnected } = useAccount();
  const { data: connectorClient } = useConnectorClient();
  const providerRef = useRef<BrowserProvider | null>(null);
  const contractRef = useRef<Contract | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get current network or use default
  const currentNetworkKey = networkKey || 'sepolia';
  const currentNetwork = NETWORKS[currentNetworkKey];
  const tokenAddress = getCurrencyContract(currentNetworkKey);
  // const tokenDecimals = getCurrencyDecimals(currentNetworkKey);
  const tokenSymbol = getCurrencySymbol(currentNetworkKey);

  if (DEBUG_MODE) {
    console.log('🔍 Debug: Network config:', {
      currentNetworkKey,
      tokenAddress,
      tokenSymbol,
      isPolygon: currentNetworkKey === 'polygon',
      isAmoy: currentNetworkKey === 'polygonAmoy',
      isSepolia: currentNetworkKey === 'sepolia',
      shouldHaveContract: currentNetworkKey === 'polygonAmoy' || currentNetworkKey === 'sepolia',
      networkConfig: currentNetwork
    });
  }

  // Initialize provider and contract
  const initializeProvider = useCallback(async () => {
    if (!account || !currentNetwork || !isConnected) return null;

    try {
      let provider: BrowserProvider;

      // Try wagmi connector client first (for Reown/WalletConnect)
      if (connectorClient) {
        provider = clientToProvider(connectorClient);
        if (DEBUG_MODE) {
          console.log('Using wagmi connector client (Reown/WalletConnect)');
        }
      }
      // Fallback to window.ethereum (for MetaMask)
      else if (window.ethereum) {
        provider = new BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        
        if (Number(network.chainId) !== currentNetwork.chainId) {
          if (DEBUG_MODE) {
            console.log(`Wrong network. Expected: ${currentNetwork.chainId}, Current: ${network.chainId}`);
          }
          return null;
        }
        if (DEBUG_MODE) {
          console.log('Using window.ethereum (MetaMask)');
        }
      }
      else {
        if (DEBUG_MODE) {
          console.log('No wallet provider available');
        }
        return null;
      }

      // For token contracts, initialize contract only if tokenAddress exists
      let contract = null;
      if (tokenAddress) {
        contract = new Contract(tokenAddress, ERC20_ABI, provider);
        contractRef.current = contract;
      }
      
      providerRef.current = provider;
      
      return { provider, contract };
    } catch (error) {
      console.error('Failed to initialize provider:', error);
      setError('Failed to initialize provider');
      return null;
    }
  }, [account, tokenAddress, currentNetwork, isConnected, connectorClient]);

  // Refresh token balance and metadata
  const refreshBalance = useCallback(async () => {
    if (!account) {
      setBalance('0');
      setBalanceWei(BigInt(0));
      setSymbol(getCurrencySymbol(currentNetworkKey));
      setDecimals(getCurrencyDecimals(currentNetworkKey));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const initialized = await initializeProvider();
      if (!initialized) {
        setBalance('0');
        setBalanceWei(BigInt(0));
        return;
      }

      const { contract, provider } = initialized;

      if (DEBUG_MODE) {
        console.log('🔍 Debug: Balance check details:', {
          account,
          tokenAddress,
          network: currentNetwork.displayName,
          chainId: currentNetwork.chainId,
          currentNetworkKey,
          hasTokenAddress: !!tokenAddress,
          hasContract: !!contract
        });
      }

      // Get actual chain ID to ensure we're on the correct network
      const actualNetwork = await provider.getNetwork();
      const actualChainId = Number(actualNetwork.chainId);
      
      if (DEBUG_MODE) {
        console.log('🔍 Debug: Network verification:', {
          expectedChainId: currentNetwork.chainId,
          actualChainId,
          networkMatch: actualChainId === currentNetwork.chainId,
          networkKey: currentNetworkKey
        });
      }

      // Only proceed if we're on the expected network
      if (actualChainId !== currentNetwork.chainId) {
        if (DEBUG_MODE) {
          console.log('🔍 Debug: Network mismatch, skipping balance fetch');
        }
        setBalance('0');
        setBalanceWei(BigInt(0));
        setError('Network mismatch detected');
        return;
      }

      // For Polygon mainnet (Chain ID 137), show native MATIC balance
      if (actualChainId === 137) {
        // Get native MATIC balance
        const balanceWei = await provider.getBalance(account);
        const balanceFormatted = formatUnits(balanceWei, 18); // MATIC has 18 decimals
        
        setBalanceWei(balanceWei);
        setBalance(balanceFormatted);
        setSymbol('MATIC');
        setDecimals(18);
        setLastUpdated(new Date());
        
        return;
      }

      // For Amoy testnet (Chain ID 80002) with Play Token
      if (actualChainId === 80002) {
        if (!contract) {
          if (DEBUG_MODE) {
            console.log('🔍 Debug: No contract available for Amoy testnet');
          }
          setError('Play Token contract not available');
          return;
        }
        if (DEBUG_MODE) {
          console.log('🔍 Debug: Fetching Play Token balance on Amoy');
        }
        
        try {
          // Get Play Token balance
          const [balanceWei, tokenSymbol, tokenDecimals] = await Promise.all([
            contract.balanceOf(account),
            contract.symbol().catch(() => 'PT'),
            contract.decimals().catch(() => 18)
          ]);

          if (DEBUG_MODE) {
            console.log('🔍 Debug: Play Token responses:', {
              balanceWei: balanceWei.toString(),
              tokenSymbol,
              tokenDecimals: tokenDecimals.toString()
            });
          }

          const balanceFormatted = formatUnits(balanceWei, tokenDecimals);
          
          setBalanceWei(balanceWei);
          setBalance(balanceFormatted);
          setSymbol(tokenSymbol);
          setDecimals(Number(tokenDecimals));
          setLastUpdated(new Date());

          // Check claim status for Play Token
          try {
            const claimed = await contract.hasClaimed(account);
            setHasClaimed(claimed);
          } catch (error) {
            if (DEBUG_MODE) {
              console.log('🔍 Debug: hasClaimed function error:', error);
            }
          }

          if (DEBUG_MODE) {
            console.log('Play Token balance updated:', {
              token: tokenSymbol,
              balance: balanceFormatted,
              network: currentNetwork.displayName
            });
          }
          
          return;
        } catch (error) {
          console.error('Failed to get Play Token balance:', error);
          setError(error instanceof Error ? error.message : 'Failed to get Play Token balance');
          return;
        }
      }

      // For Sepolia testnet (Chain ID 11155111) with Play Token
      if (actualChainId === 11155111) {
        if (!contract) {
          if (DEBUG_MODE) {
            console.log('🔍 Debug: No contract available for Sepolia testnet');
          }
          setError('Play Token contract not available');
          return;
        }
        if (DEBUG_MODE) {
          console.log('🔍 Debug: Fetching Play Token balance on Sepolia');
        }
        
        try {
          // Get Play Token balance
          const [balanceWei, tokenSymbol, tokenDecimals] = await Promise.all([
            contract.balanceOf(account),
            contract.symbol().catch(() => 'PT'),
            contract.decimals().catch(() => 18)
          ]);

          if (DEBUG_MODE) {
            console.log('🔍 Debug: Play Token responses (Sepolia):', {
              balanceWei: balanceWei.toString(),
              tokenSymbol,
              tokenDecimals: tokenDecimals.toString()
            });
          }

          const balanceFormatted = formatUnits(balanceWei, tokenDecimals);
          
          setBalanceWei(balanceWei);
          setBalance(balanceFormatted);
          setSymbol(tokenSymbol);
          setDecimals(Number(tokenDecimals));
          setLastUpdated(new Date());

          // Check claim status for Play Token
          try {
            const claimed = await contract.hasClaimed(account);
            setHasClaimed(claimed);
          } catch (error) {
            if (DEBUG_MODE) {
              console.log('🔍 Debug: hasClaimed function error (Sepolia):', error);
            }
          }

          if (DEBUG_MODE) {
            console.log('Play Token balance updated (Sepolia):', {
              token: tokenSymbol,
              balance: balanceFormatted,
              network: currentNetwork.displayName
            });
          }
          
          return;
        } catch (error) {
          console.error('Failed to get Play Token balance (Sepolia):', error);
          setError(error instanceof Error ? error.message : 'Failed to get Play Token balance');
          return;
        }
      }

      // For other networks or when no specific handling, show 0 balance
      if (DEBUG_MODE) {
        console.log('🔍 Debug: No specific handler for chainId:', actualChainId);
      }
      setBalance('0');
      setBalanceWei(BigInt(0));

    } catch (error) {
      console.error('Failed to get token balance:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setBalance('0');
      setBalanceWei(BigInt(0));
    } finally {
      setIsLoading(false);
    }
  }, [account, tokenAddress, initializeProvider, currentNetwork, currentNetworkKey]);

  // Transfer tokens
  const transfer = useCallback(async (to: string, amount: string): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!account || !tokenAddress) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const initialized = await initializeProvider();
      if (!initialized) {
        return { success: false, error: 'Failed to initialize provider' };
      }

      const { contract, provider } = initialized;
      if (!contract) throw new Error('Contract not initialized');
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const amountWei = parseUnits(amount, decimals);
      const tx = await (contractWithSigner as unknown as { transfer: (to: string, amount: bigint) => Promise<{ hash: string; wait: () => Promise<unknown> }> }).transfer(to, amountWei);

      if (DEBUG_MODE) {
        console.log('Transfer transaction submitted:', tx.hash);
      }

      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Transfer failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Transfer failed' 
      };
    }
  }, [account, tokenAddress, initializeProvider, decimals]);

  // Approve tokens
  const approve = useCallback(async (spender: string, amount: string): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!account || !tokenAddress) {
      return { success: false, error: 'Wallet not connected' };
    }

    try {
      const initialized = await initializeProvider();
      if (!initialized) {
        return { success: false, error: 'Failed to initialize provider' };
      }

      const { contract, provider } = initialized;
      if (!contract) throw new Error('Contract not initialized');
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const amountWei = parseUnits(amount, decimals);
      const tx = await (contractWithSigner as unknown as { approve: (spender: string, amount: bigint) => Promise<{ hash: string; wait: () => Promise<unknown> }> }).approve(spender, amountWei);

      if (DEBUG_MODE) {
        console.log('Approval transaction submitted:', tx.hash);
      }

      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Approval failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Approval failed' 
      };
    }
  }, [account, tokenAddress, initializeProvider, decimals]);

  // Claim Play Tokens (for supported testnets with deployed contracts)
  const claimTokens = useCallback(async (): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (currentNetworkKey !== 'polygonAmoy' && currentNetworkKey !== 'sepolia') {
      return { success: false, error: 'Claiming is only available on supported testnets (Polygon Amoy or Sepolia)' };
    }

    if (!account || !tokenAddress) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (hasClaimed) {
      return { success: false, error: 'Tokens already claimed for this address' };
    }

    try {
      const initialized = await initializeProvider();
      if (!initialized) {
        return { success: false, error: 'Failed to initialize provider' };
      }

      const { contract, provider } = initialized;
      if (!contract) throw new Error('Contract not initialized');
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await (contractWithSigner as unknown as { claim: () => Promise<{ hash: string; wait: () => Promise<unknown> }> }).claim();

      if (DEBUG_MODE) {
        console.log('Claim transaction submitted:', tx.hash);
      }

      return { success: true, txHash: tx.hash };
    } catch (error) {
      console.error('Claim failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Claim failed' 
      };
    }
  }, [account, tokenAddress, initializeProvider, currentNetworkKey, hasClaimed]);

  // Add token to MetaMask
  const addTokenToMetaMask = useCallback(async (): Promise<boolean> => {
    if (!tokenAddress) return false;
    
    // Check if window.ethereum exists (browser wallet)
    if (!window.ethereum) {
      if (DEBUG_MODE) {
        console.log('Cannot add token to wallet - no browser wallet detected');
      }
      return false;
    }

    try {
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: symbol,
            decimals: decimals,
            image: '',
          },
        },
      });

      if (wasAdded) {
        setIsTokenAddedToMetaMask(true);
        // Store in localStorage for persistence
        const storageKey = `token_added_${tokenAddress}_${account}`;
        localStorage.setItem(storageKey, 'true');
      }

      return Boolean(wasAdded);
    } catch (error) {
      console.error('Failed to add token to MetaMask:', error);
      return false;
    }
  }, [tokenAddress, symbol, decimals, account]);

  // Check if token is already added to MetaMask on component mount
  useEffect(() => {
    if (account && tokenAddress) {
      const storageKey = `token_added_${tokenAddress}_${account}`;
      const isAdded = localStorage.getItem(storageKey) === 'true';
      setIsTokenAddedToMetaMask(isAdded);
    }
  }, [account, tokenAddress]);

  // Set up real-time updates
  useEffect(() => {
    if (!account || !window.ethereum) {
      setBalance('0');
      setBalanceWei(null);
      setSymbol(getCurrencySymbol(currentNetworkKey));
      setDecimals(getCurrencyDecimals(currentNetworkKey));
      setHasClaimed(false);
      setIsTokenAddedToMetaMask(false);
      setError(null);
      return;
    }

    let mounted = true;

    const setupListeners = async () => {
      const initialized = await initializeProvider();
      if (!initialized || !mounted) return;

      const { provider } = initialized;

      // Initial balance fetch
      await refreshBalance();

      // Throttled block listener to reduce excessive calls
      let lastBlockUpdate = 0;
      const BLOCK_UPDATE_THROTTLE = 30000; // 30 seconds minimum between block updates
      
      const blockListener = () => {
        if (mounted) {
          const now = Date.now();
          if (now - lastBlockUpdate > BLOCK_UPDATE_THROTTLE) {
            lastBlockUpdate = now;
            refreshBalance();
          }
        }
      };

      provider.on('block', blockListener);

      // Listen for account changes
      const accountChangeListener = (...args: unknown[]) => {
        const accounts = args[0] as string[];
        if (mounted) {
          if (accounts.length === 0) {
            setBalance('0');
            setBalanceWei(null);
            setHasClaimed(false);
          } else {
            setTimeout(() => {
              if (mounted) {
                refreshBalance();
              }
            }, 500);
          }
        }
      };

      // Listen for network changes
      const networkChangeListener = () => {
        if (mounted) {
          refreshBalance();
        }
      };

      if (window.ethereum?.on) {
        window.ethereum.on('accountsChanged', accountChangeListener);
        window.ethereum.on('chainChanged', networkChangeListener);
      }

      // Set up periodic refresh as backup
      intervalRef.current = setInterval(() => {
        if (mounted) {
          refreshBalance();
        }
      }, 120000); // Every 2 minutes

      return () => {
        provider.removeAllListeners();
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener('accountsChanged', accountChangeListener);
          window.ethereum.removeListener('chainChanged', networkChangeListener);
        }
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    };

    setupListeners();

    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [account, refreshBalance, initializeProvider, currentNetworkKey]);

  return {
    // State
    balance,
    balanceWei,
    symbol,
    decimals,
    isLoading,
    error,
    lastUpdated,
    hasClaimed,
    canClaim: (currentNetworkKey === 'polygonAmoy' || currentNetworkKey === 'sepolia') && !hasClaimed,
    isTokenAddedToMetaMask,

    // Actions
    refreshBalance,
    transfer,
    approve,
    claimTokens: (currentNetworkKey === 'polygonAmoy' || currentNetworkKey === 'sepolia') ? claimTokens : undefined,
    addTokenToMetaMask
  };
}