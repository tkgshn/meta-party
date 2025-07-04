import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserProvider, Contract, formatUnits, parseUnits } from 'ethers';
import { NETWORKS, getCurrencySymbol, getCurrencyContract, getCurrencyDecimals } from '@/config/networks';
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
}

interface TokenActions {
  refreshBalance: () => Promise<void>;
  transfer: (to: string, amount: string) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  approve: (spender: string, amount: string) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  // Play Token specific
  claimTokens?: () => Promise<{ success: boolean; txHash?: string; error?: string }>;
  addTokenToMetaMask: () => Promise<boolean>;
}

const DEBUG_MODE = process.env.NODE_ENV === 'development';

export function useToken(account: string | null, networkKey?: string): TokenState & TokenActions {
  const [balance, setBalance] = useState<string>('0');
  const [balanceWei, setBalanceWei] = useState<bigint | null>(null);
  const [symbol, setSymbol] = useState<string>('');
  const [decimals, setDecimals] = useState<number>(18);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasClaimed, setHasClaimed] = useState<boolean>(false);
  
  const providerRef = useRef<BrowserProvider | null>(null);
  const contractRef = useRef<Contract | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get current network or use default
  const currentNetworkKey = networkKey || 'polygon';
  const currentNetwork = NETWORKS[currentNetworkKey];
  const tokenAddress = getCurrencyContract(currentNetworkKey);
  const tokenDecimals = getCurrencyDecimals(currentNetworkKey);
  const tokenSymbol = getCurrencySymbol(currentNetworkKey);

  // Initialize provider and contract
  const initializeProvider = useCallback(async () => {
    if (!window.ethereum || !account || !tokenAddress || !currentNetwork) return null;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      if (Number(network.chainId) !== currentNetwork.chainId) {
        if (DEBUG_MODE) {
          console.log(`Wrong network. Expected: ${currentNetwork.chainId}, Current: ${network.chainId}`);
        }
        return null;
      }

      const contract = new Contract(tokenAddress, ERC20_ABI, provider);
      
      providerRef.current = provider;
      contractRef.current = contract;
      
      return { provider, contract };
    } catch (error) {
      console.error('Failed to initialize provider:', error);
      setError('Failed to initialize provider');
      return null;
    }
  }, [account, tokenAddress, currentNetwork]);

  // Refresh token balance and metadata
  const refreshBalance = useCallback(async () => {
    if (!account) {
      setBalance('0');
      setBalanceWei(BigInt(0));
      setSymbol(tokenSymbol);
      setDecimals(tokenDecimals);
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
          rpcUrl: currentNetwork.rpcUrls[0],
          hasTokenAddress: !!tokenAddress
        });
      }

      // For Polygon mainnet, show native MATIC balance instead of USDC
      if (currentNetworkKey === 'polygon') {
        // Get native MATIC balance
        const balanceWei = await provider.getBalance(account);
        const balanceFormatted = formatUnits(balanceWei, 18); // MATIC has 18 decimals
        
        if (DEBUG_MODE) {
          console.log('🔍 Debug: Native MATIC balance:', {
            balanceWei: balanceWei.toString(),
            balanceFormatted,
            decimals: 18
          });
        }
        
        setBalanceWei(balanceWei);
        setBalance(balanceFormatted);
        setSymbol('MATIC');
        setDecimals(18);
        setLastUpdated(new Date());

        if (DEBUG_MODE) {
          console.log('Native MATIC balance updated:', {
            token: 'MATIC',
            balance: balanceFormatted,
            network: currentNetwork.displayName
          });
        }
        
        return;
      }

      // For other networks with token contracts (like Amoy with Play Token)
      if (!tokenAddress) {
        setBalance('0');
        setBalanceWei(BigInt(0));
        return;
      }

      // Get balance and token metadata
      const [balanceWei, tokenSymbol, tokenDecimals] = await Promise.all([
        contract.balanceOf(account),
        contract.symbol().catch(() => symbol || 'Unknown'),
        contract.decimals().catch(() => tokenDecimals)
      ]);

      if (DEBUG_MODE) {
        console.log('🔍 Debug: Token contract responses:', {
          balanceWei: balanceWei.toString(),
          tokenSymbol,
          tokenDecimals: tokenDecimals.toString(),
          expectedDecimals: tokenDecimals
        });
      }

      const balanceFormatted = formatUnits(balanceWei, tokenDecimals);
      
      setBalanceWei(balanceWei);
      setBalance(balanceFormatted);
      setSymbol(tokenSymbol);
      setDecimals(Number(tokenDecimals));
      setLastUpdated(new Date());

      // Check claim status for Play Token
      if (currentNetworkKey === 'polygonAmoy' && contract.hasClaimed) {
        try {
          const claimed = await contract.hasClaimed(account);
          setHasClaimed(claimed);
        } catch (error) {
          if (DEBUG_MODE) {
            console.log('hasClaimed function not available:', error);
          }
        }
      }

      if (DEBUG_MODE) {
        console.log('Token balance updated:', {
          token: tokenSymbol,
          balance: balanceFormatted,
          network: currentNetwork.displayName
        });
      }

    } catch (error) {
      console.error('Failed to get token balance:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setBalance('0');
      setBalanceWei(BigInt(0));
    } finally {
      setIsLoading(false);
    }
  }, [account, tokenAddress, initializeProvider, currentNetwork, currentNetworkKey, symbol, tokenDecimals, tokenSymbol]);

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
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const amountWei = parseUnits(amount, decimals);
      const tx = await contractWithSigner.transfer(to, amountWei);

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
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const amountWei = parseUnits(amount, decimals);
      const tx = await contractWithSigner.approve(spender, amountWei);

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

  // Claim Play Tokens (only for Amoy testnet)
  const claimTokens = useCallback(async (): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (currentNetworkKey !== 'polygonAmoy') {
      return { success: false, error: 'Claiming is only available on Amoy testnet' };
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
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.claim();

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
    if (!window.ethereum || !tokenAddress) return false;

    try {
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: [{
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: symbol,
            decimals: decimals,
            image: '',
          },
        }],
      });

      return Boolean(wasAdded);
    } catch (error) {
      console.error('Failed to add token to MetaMask:', error);
      return false;
    }
  }, [tokenAddress, symbol, decimals]);

  // Set up real-time updates
  useEffect(() => {
    if (!account || !window.ethereum) {
      setBalance('0');
      setBalanceWei(null);
      setSymbol(tokenSymbol);
      setDecimals(tokenDecimals);
      setHasClaimed(false);
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

      // Listen for new blocks for real-time updates
      const blockListener = () => {
        if (mounted) {
          refreshBalance();
        }
      };

      provider.on('block', blockListener);

      // Listen for account changes
      const accountChangeListener = (accounts: string[]) => {
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

      window.ethereum.on('accountsChanged', accountChangeListener);
      window.ethereum.on('chainChanged', networkChangeListener);

      // Set up periodic refresh as backup
      intervalRef.current = setInterval(() => {
        if (mounted) {
          refreshBalance();
        }
      }, 30000); // Every 30 seconds

      return () => {
        provider.removeAllListeners();
        window.ethereum?.removeListener('accountsChanged', accountChangeListener);
        window.ethereum?.removeListener('chainChanged', networkChangeListener);
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
  }, [account, refreshBalance, initializeProvider, tokenSymbol, tokenDecimals]);

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
    canClaim: currentNetworkKey === 'polygonAmoy' && !hasClaimed,

    // Actions
    refreshBalance,
    transfer,
    approve,
    claimTokens: currentNetworkKey === 'polygonAmoy' ? claimTokens : undefined,
    addTokenToMetaMask
  };
}