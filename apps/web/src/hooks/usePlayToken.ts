import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserProvider, Contract, formatUnits } from 'ethers';
import { NETWORKS, getNetworkByChainId } from '@/config/networks';
import '@/types/ethereum';

interface PlayTokenState {
  balance: string;
  hasClaimed: boolean;
  isLoading: boolean;
  lastClaimTxHash: string | null;
  claimHistory: string[];
  balanceWei: bigint | null;
  isContractsAvailable: boolean;
  currentChainId: number | null;
  networkConfig: typeof NETWORK_CONFIGS[keyof typeof NETWORK_CONFIGS] | null;
}

interface PlayTokenActions {
  refreshBalance: () => Promise<void>;
  refreshClaimStatus: () => Promise<void>;
  claimTokens: () => Promise<{ success: boolean; txHash?: string; error?: string }>;
  addTokenToMetaMask: () => Promise<boolean>;
  checkTransactionStatus: (txHash: string) => Promise<{ confirmed: boolean; success: boolean }>;
}

const CLAIM_FUNCTION_SELECTOR = '0x4e71d92d';
const AIRDROP_AMOUNT = BigInt('1000000000000000000000'); // 1000 * 10^18

// ERC-20 ABI for balance and claim functions
const PLAY_TOKEN_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function hasClaimed(address) view returns (bool)',
  'function claim()'
] as const;

// Supported networks for Play Token
const SUPPORTED_CHAIN_IDS = [80002, 11155111]; // Polygon Amoy, Sepolia

// Network-specific configurations
const NETWORK_CONFIGS = {
  80002: { // Polygon Amoy
    name: 'Polygon Amoy',
    contractsDeployed: true,
    faucetUrl: 'https://faucet.polygon.technology/',
    blockExplorerUrl: 'https://amoy.polygonscan.com',
  },
  11155111: { // Sepolia
    name: 'Sepolia',
    contractsDeployed: false, // TODO: Set to true once contracts are deployed
    faucetUrl: 'https://sepoliafaucet.com/',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
  }
};

// Get Play Token address for current network
const getPlayTokenAddress = (chainId: number): string | undefined => {
  const network = getNetworkByChainId(chainId);
  return network?.contracts.playToken;
};

// Check if contracts are deployed and available on network
const areContractsAvailable = (chainId: number): boolean => {
  const config = NETWORK_CONFIGS[chainId as keyof typeof NETWORK_CONFIGS];
  const playTokenAddress = getPlayTokenAddress(chainId);
  return Boolean(config?.contractsDeployed && playTokenAddress);
};

// Get network configuration
const getNetworkConfig = (chainId: number) => {
  return NETWORK_CONFIGS[chainId as keyof typeof NETWORK_CONFIGS];
};

// Debug flag - set to false in production
const DEBUG_MODE = process.env.NODE_ENV === 'development';

// Debug log to check environment variables
if (DEBUG_MODE) {
  console.log('PlayToken Hook Environment Check:', {
    supportedChains: SUPPORTED_CHAIN_IDS,
    amoyAddress: NETWORKS.polygonAmoy?.contracts.playToken,
    sepoliaAddress: NETWORKS.sepolia?.contracts.playToken,
    nodeEnv: process.env.NODE_ENV,
  });
}

export function usePlayToken(account: string | null): PlayTokenState & PlayTokenActions {
  const [balance, setBalance] = useState<string>('0');
  const [balanceWei, setBalanceWei] = useState<bigint | null>(null);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastClaimTxHash, setLastClaimTxHash] = useState<string | null>(null);
  const [claimHistory, setClaimHistory] = useState<string[]>([]);
  const [isContractsAvailable, setIsContractsAvailable] = useState(false);
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [networkConfig, setNetworkConfig] = useState<typeof NETWORK_CONFIGS[keyof typeof NETWORK_CONFIGS] | null>(null);
  
  const providerRef = useRef<BrowserProvider | null>(null);
  const contractRef = useRef<Contract | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize provider and contract
  const initializeProvider = useCallback(async () => {
    if (!window.ethereum || !account) return null;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      
      // Check if current network is supported
      if (!SUPPORTED_CHAIN_IDS.includes(chainId)) {
        if (DEBUG_MODE) {
          console.log('Network not supported for Play Token:', chainId);
        }
        return null;
      }

      // Check if contracts are deployed and available
      if (!areContractsAvailable(chainId)) {
        const networkConfig = getNetworkConfig(chainId);
        if (DEBUG_MODE) {
          console.log(`Play Token not available on ${networkConfig?.name || 'network'}:`, chainId);
        }
        return null;
      }

      // Get Play Token address for current network
      const playTokenAddress = getPlayTokenAddress(chainId);
      if (!playTokenAddress) {
        if (DEBUG_MODE) {
          console.log('Play Token address not configured for network:', chainId);
        }
        return null;
      }

      const contract = new Contract(playTokenAddress, PLAY_TOKEN_ABI, provider);
      
      providerRef.current = provider;
      contractRef.current = contract;
      
      // Update state with current network info
      setCurrentChainId(chainId);
      setNetworkConfig(getNetworkConfig(chainId));
      setIsContractsAvailable(true);
      
      return { provider, contract, chainId, networkConfig: getNetworkConfig(chainId) };
    } catch (error) {
      console.error('Failed to initialize provider:', error);
      // Reset state on error
      setCurrentChainId(null);
      setNetworkConfig(null);
      setIsContractsAvailable(false);
      return null;
    }
  }, [account]);

  /**
   * PlayToken残高を取得し、状態を更新する。ethers v6を使用してより安定した実装
   */
  const refreshBalance = useCallback(async () => {
    if (!account) {
      if (DEBUG_MODE) {
        console.log('Missing account for balance check');
      }
      setBalance('0');
      setBalanceWei(BigInt(0));
      return;
    }

    try {
      const initialized = await initializeProvider();
      if (!initialized) {
        if (DEBUG_MODE) {
          console.log('Failed to initialize provider - contracts not deployed on this network');
        }
        setBalance('0');
        setBalanceWei(BigInt(0));
        
        // Update network state even if contracts not available
        try {
          const provider = new BrowserProvider(window.ethereum!);
          const network = await provider.getNetwork();
          const chainId = Number(network.chainId);
          setCurrentChainId(chainId);
          setNetworkConfig(getNetworkConfig(chainId));
          setIsContractsAvailable(false);
        } catch (error) {
          console.error('Failed to get network info:', error);
        }
        return;
      }

      const { contract } = initialized;

      // Use ethers v6 to get balance and claim status
      const [balanceWei, claimStatus] = await Promise.all([
        contract.balanceOf(account),
        contract.hasClaimed(account).catch(() => false) // Fallback if function doesn't exist
      ]);

      const balanceInPT = formatUnits(balanceWei, 18);
      const balanceFormatted = Math.floor(parseFloat(balanceInPT)).toString();

      setBalanceWei(balanceWei);
      setBalance(balanceFormatted);
      setHasClaimed(claimStatus);

      if (DEBUG_MODE) {
        console.log('Balance updated:', {
          wei: balanceWei.toString(),
          pt: balanceFormatted,
          claimed: claimStatus
        });
      }

    } catch (error) {
      console.error('Failed to get balance:', error);
      
      // Enhanced error handling
      let errorMessage = 'Unknown error occurred';
      
      if (error && typeof error === 'object') {
        const err = error as { code?: number; message?: string; };
        
        if (err.code === 4001) {
          errorMessage = 'User rejected the request';
        } else if (err.code === -32603) {
          errorMessage = 'Internal JSON-RPC error - possibly contract not deployed';
        } else if (err.message) {
          errorMessage = err.message;
        }
      }
      
      if (DEBUG_MODE) {
        console.error(`Balance check failed: ${errorMessage}`);
      }
      
      // Set to 0 on error but don't show alert to user
      setBalanceWei(BigInt(0));
      setBalance('0');
    }
  }, [account, initializeProvider]);

  // Check if user has claimed tokens - optimized version
  const refreshClaimStatus = useCallback(async () => {
    if (!account || !window.ethereum) {
      if (DEBUG_MODE) {
        console.log('Missing dependencies for claim status check:', {
          account: !!account,
          ethereum: !!window.ethereum
        });
      }
      return;
    }

    try {
      // Validate account format
      if (!account.startsWith('0x') || account.length !== 42) {
        console.error('Invalid account format for claim check:', account);
        return;
      }

      const paddedAddress = account.slice(2).padStart(64, '0');
      let claimed = false;

      // Fast check: If balance >= airdrop amount, likely claimed
      if (balanceWei && balanceWei >= AIRDROP_AMOUNT) {
        claimed = true;
        if (DEBUG_MODE) {
          console.log('Claim status inferred from balance:', balanceWei.toString());
        }
      }

      // Verify with contract call only if needed
      if (!claimed) {
        try {
          // Get current network's Play Token address
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          const playTokenAddress = getPlayTokenAddress(parseInt(chainId as string, 16));
          
          if (!playTokenAddress) {
            if (DEBUG_MODE) {
              console.log('Play Token not available on current network');
            }
            return;
          }
          
          const result = await window.ethereum.request({
            method: 'eth_call',
            params: [
              {
                to: playTokenAddress,
                data: '0x73b2e80e' + paddedAddress, // hasClaimed(address)
              },
              'latest'
            ],
          });

          if (result === '0x0000000000000000000000000000000000000000000000000000000000000001') {
            claimed = true;
            if (DEBUG_MODE) {
              console.log('Claim status confirmed via hasClaimed function');
            }
          }
        } catch (error) {
          if (DEBUG_MODE) {
            console.log('hasClaimed function check failed:', error);
          }
        }
      }

      setHasClaimed(claimed);
      if (DEBUG_MODE) {
        console.log('Final claim status:', claimed);
      }

    } catch (error) {
      console.error('Failed to check claim status:', error);
      // Default to false on error, but don't prevent claiming
      setHasClaimed(false);
    }
  }, [account, balanceWei]);

  // Find claim transactions for an address (unused but kept for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const findClaimTransactions = async (address: string): Promise<string[]> => {
    try {
      // This is a simplified version - in production you might want to use
      // a more robust method like querying events from a block explorer API

      // For now, we'll check the last few blocks for transactions
      // This is not perfect but better than no check

      const currentBlock = await window.ethereum?.request({
        method: 'eth_blockNumber',
      });

      if (!currentBlock) return [];

      const blockNumber = parseInt(currentBlock as string, 16);
      const claimTxs: string[] = [];

      // Check last 1000 blocks (approximately last ~30 minutes on Polygon)
      for (let i = 0; i < Math.min(1000, blockNumber); i++) {
        const block = blockNumber - i;
        try {
          const blockData = await window.ethereum?.request({
            method: 'eth_getBlockByNumber',
            params: [`0x${block.toString(16)}`, true],
          });

          if (blockData && (blockData as { transactions: unknown[] }).transactions) {
            const transactions = (blockData as { transactions: {
              from: string;
              to: string;
              input: string;
              hash: string;
            }[] }).transactions;

            for (const tx of transactions) {
              // Get current network's Play Token address for comparison
              const chainId = await window.ethereum?.request({ method: 'eth_chainId' });
              const currentPlayTokenAddress = getPlayTokenAddress(parseInt(chainId as string, 16));
              
              if (
                tx.from?.toLowerCase() === address.toLowerCase() &&
                tx.to?.toLowerCase() === currentPlayTokenAddress?.toLowerCase() &&
                tx.input === CLAIM_FUNCTION_SELECTOR
              ) {
                claimTxs.push(tx.hash);
              }
            }
          }
        } catch {
          // Skip this block if there's an error
          continue;
        }

        // Stop if we found claim transactions
        if (claimTxs.length > 0) break;
      }

      return claimTxs;
    } catch (error) {
      console.error('Error finding claim transactions:', error);
      return [];
    }
  };

  // Claim tokens with duplicate prevention
  const claimTokens = useCallback(async (): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!account || !window.ethereum) {
      if (DEBUG_MODE) {
        console.log('Missing dependencies for claim tokens:', {
          account: !!account,
          ethereum: !!window.ethereum
        });
      }
      return { success: false, error: 'ウォレットが接続されていません' };
    }

    // Get current network's Play Token address
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const currentChainId = parseInt(chainId as string, 16);
    const networkConfig = getNetworkConfig(currentChainId);
    const playTokenAddress = getPlayTokenAddress(currentChainId);
    
    if (!areContractsAvailable(currentChainId)) {
      const networkName = getNetworkByChainId(currentChainId)?.displayName || 'Unknown Network';
      if (SUPPORTED_CHAIN_IDS.includes(currentChainId)) {
        // Network is supported but contracts not deployed yet
        return { 
          success: false, 
          error: `${networkName}ではPlay Tokenの準備中です。現在はPolygon Amoyテストネットをご利用ください。` 
        };
      } else {
        // Network not supported at all
        return { 
          success: false, 
          error: `現在のネットワーク（${networkName}）はサポートされていません。Polygon AmoyまたはSepoliaテストネットに切り替えてください。` 
        };
      }
    }

    // Quick balance check to prevent double claims
    if (balanceWei && balanceWei >= AIRDROP_AMOUNT) {
      return {
        success: false,
        error: '既にトークンを受け取り済みです。1つのアドレスで受け取れるのは1回のみです。'
      };
    }

    // Double-check claim status before attempting
    await refreshClaimStatus();

    if (hasClaimed) {
      return {
        success: false,
        error: '既にトークンを受け取り済みです。1つのアドレスで受け取れるのは1回のみです。'
      };
    }

    setIsLoading(true);

    try {
      // Get current nonce
      const nonce = await window.ethereum.request({
        method: 'eth_getTransactionCount',
        params: [account, 'latest'],
      });

      // Get gas price with buffer
      const gasPrice = await window.ethereum.request({
        method: 'eth_gasPrice',
      });
      const bufferedGasPrice = '0x' + Math.floor(parseInt(gasPrice as string, 16) * 2).toString(16);

      // Send transaction
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: playTokenAddress,
          data: CLAIM_FUNCTION_SELECTOR,
          gas: '0x1adb0', // 110000 gas limit
          gasPrice: bufferedGasPrice,
          nonce: nonce,
        }],
      });

      if (DEBUG_MODE) {
        console.log('Claim transaction submitted:', txHash);
      }
      setLastClaimTxHash(txHash as string);

      return { success: true, txHash: txHash as string };

    } catch (error) {
      console.error('Claim transaction failed:', error);
      const err = error as { code?: number; message?: string };

      let errorMessage = 'トークンの受け取りに失敗しました';

      if (err.code === 4001) {
        errorMessage = 'トランザクションがユーザーによって拒否されました';
      } else if (err.code === -32603) {
        errorMessage = '既にトークンを受け取っている可能性があります';
      } else if (err.message?.includes('insufficient funds')) {
        errorMessage = 'ガス代（POL）が不足しています';
      } else if (err.message?.includes('already claimed')) {
        errorMessage = '既にトークンを受け取り済みです';
      }

      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [account, hasClaimed, refreshClaimStatus, balanceWei]);

  // Check transaction status
  const checkTransactionStatus = useCallback(async (txHash: string): Promise<{ confirmed: boolean; success: boolean }> => {
    if (!window.ethereum) return { confirmed: false, success: false };

    try {
      const receipt = await window.ethereum.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      });

      if (receipt) {
        const success = (receipt as { status?: string }).status === '0x1';
        return { confirmed: true, success };
      }

      return { confirmed: false, success: false };
    } catch (error) {
      console.error('Failed to check transaction status:', error);
      return { confirmed: false, success: false };
    }
  }, []);

  // Add PT token to MetaMask
  const addTokenToMetaMask = useCallback(async (): Promise<boolean> => {
    if (!window.ethereum) {
      console.error('MetaMask not available');
      return false;
    }

    // Get current network's Play Token address
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const currentChainId = parseInt(chainId as string, 16);
    const playTokenAddress = getPlayTokenAddress(currentChainId);
    
    if (!areContractsAvailable(currentChainId)) {
      const networkName = getNetworkByChainId(currentChainId)?.displayName || 'Unknown Network';
      console.error(`Play Token not available on current network (${networkName})`);
      return false;
    }

    if (!playTokenAddress.startsWith('0x') || playTokenAddress.length !== 42) {
      console.error('Invalid Play Token address format:', playTokenAddress);
      return false;
    }

    try {
      if (DEBUG_MODE) {
        console.log('Adding token to MetaMask:', {
          address: playTokenAddress,
          symbol: 'PT',
          decimals: 18,
        });
      }

      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: [{
          type: 'ERC20',
          options: {
            address: playTokenAddress,
            symbol: 'PT',
            decimals: 18,
            image: '',
          },
        }],
      });

      if (DEBUG_MODE) {
        console.log('Token add result:', wasAdded);
      }
      return Boolean(wasAdded);
    } catch (error) {
      console.error('Failed to add token to MetaMask:', error);
      return false;
    }
  }, []);

  // Set up real-time updates with proper cleanup
  useEffect(() => {
    if (!account || !window.ethereum) {
      // Clear state when no account
      setBalance('0');
      setBalanceWei(null);
      setHasClaimed(false);
      setLastClaimTxHash(null);
      setClaimHistory([]);
      return;
    }

    let mounted = true;

    const setupListeners = async () => {
      const initialized = await initializeProvider();
      if (!initialized || !mounted) return;

      const { provider } = initialized;

      // Initial balance fetch
      await refreshBalance();
      await refreshClaimStatus();

      // Listen for new blocks for real-time updates
      const blockListener = () => {
        if (mounted) {
          refreshBalance();
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
            // Account changed, refresh after short delay
            setTimeout(() => {
              if (mounted) {
                refreshBalance();
                refreshClaimStatus();
              }
            }, 500);
          }
        }
      };

      // Listen for network changes
      const networkChangeListener = () => {
        if (mounted) {
          window.location.reload();
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
      }, 30000); // Every 30 seconds

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
  }, [account, initializeProvider, refreshBalance, refreshClaimStatus]);

  // Refresh claim status when balance changes significantly
  useEffect(() => {
    if (balanceWei && balanceWei >= AIRDROP_AMOUNT && !hasClaimed) {
      refreshClaimStatus();
    }
  }, [balanceWei, hasClaimed, refreshClaimStatus]);

  return {
    // State
    balance,
    balanceWei,
    hasClaimed,
    isLoading,
    lastClaimTxHash,
    claimHistory,
    isContractsAvailable,
    currentChainId,
    networkConfig,

    // Actions
    refreshBalance,
    refreshClaimStatus,
    claimTokens,
    addTokenToMetaMask,
    checkTransactionStatus,
  };
}
