import { useState, useEffect, useCallback } from 'react';
import '@/types/ethereum';

interface PlayTokenState {
  balance: string;
  hasClaimed: boolean;
  isLoading: boolean;
  lastClaimTxHash: string | null;
  claimHistory: string[];
  balanceWei: bigint | null;
}

interface PlayTokenActions {
  refreshBalance: () => Promise<void>;
  refreshClaimStatus: () => Promise<void>;
  claimTokens: () => Promise<{ success: boolean; txHash?: string; error?: string }>;
  addTokenToMetaMask: () => Promise<boolean>;
  checkTransactionStatus: (txHash: string) => Promise<{ confirmed: boolean; success: boolean }>;
}

const PLAY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_PLAY_TOKEN_ADDRESS;
const CLAIM_FUNCTION_SELECTOR = '0x4e71d92d';
const AIRDROP_AMOUNT = BigInt('1000000000000000000000'); // 1000 * 10^18

export function usePlayToken(account: string | null): PlayTokenState & PlayTokenActions {
  const [balance, setBalance] = useState<string>('0');
  const [balanceWei, setBalanceWei] = useState<bigint | null>(null);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastClaimTxHash, setLastClaimTxHash] = useState<string | null>(null);
  const [claimHistory, setClaimHistory] = useState<string[]>([]);

  // Get PT balance
  const refreshBalance = useCallback(async () => {
    if (!account || !PLAY_TOKEN_ADDRESS || !window.ethereum) return;

    try {
      const paddedAddress = account.slice(2).padStart(64, '0');
      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [
          {
            to: PLAY_TOKEN_ADDRESS,
            data: '0x70a08231' + paddedAddress, // balanceOf(address)
          },
          'latest'
        ],
      });

      if (result && result !== '0x' && result !== '0x0') {
        const balanceWei = BigInt(result as string);
        const balanceInPT = Number(balanceWei) / Math.pow(10, 18);
        
        setBalanceWei(balanceWei);
        setBalance(balanceInPT.toFixed(0));
        
        console.log('Balance updated:', { 
          wei: balanceWei.toString(), 
          pt: balanceInPT.toFixed(0) 
        });
      } else {
        setBalanceWei(BigInt(0));
        setBalance('0');
      }
    } catch (error) {
      console.error('Failed to get balance:', error);
      setBalanceWei(BigInt(0));
      setBalance('0');
    }
  }, [account]);

  // Check if user has claimed tokens using multiple methods
  const refreshClaimStatus = useCallback(async () => {
    if (!account || !PLAY_TOKEN_ADDRESS || !window.ethereum) return;

    try {
      const paddedAddress = account.slice(2).padStart(64, '0');
      let claimed = false;

      // Method 1: Check hasClaimed(address) function
      try {
        const result = await window.ethereum.request({
          method: 'eth_call',
          params: [
            {
              to: PLAY_TOKEN_ADDRESS,
              data: '0x73b2e80e' + paddedAddress, // hasClaimed(address)
            },
            'latest'
          ],
        });
        
        if (result === '0x0000000000000000000000000000000000000000000000000000000000000001') {
          claimed = true;
          console.log('Claim status confirmed via hasClaimed function');
        }
      } catch (error) {
        console.log('hasClaimed function check failed:', error);
      }

      // Method 2: Check transaction history for claim events
      if (!claimed) {
        try {
          // Get recent transactions for this address
          const claimTxs = await findClaimTransactions(account);
          if (claimTxs.length > 0) {
            claimed = true;
            setClaimHistory(claimTxs);
            setLastClaimTxHash(claimTxs[0]);
            console.log('Claim status confirmed via transaction history:', claimTxs);
          }
        } catch (error) {
          console.log('Transaction history check failed:', error);
        }
      }

      // Method 3: Balance-based fallback (if balance >= airdrop amount)
      if (!claimed && balanceWei && balanceWei >= AIRDROP_AMOUNT) {
        claimed = true;
        console.log('Claim status inferred from balance:', balanceWei.toString());
      }

      setHasClaimed(claimed);
      console.log('Final claim status:', claimed);
      
    } catch (error) {
      console.error('Failed to check claim status:', error);
      // Default to false on error, but don't prevent claiming
      setHasClaimed(false);
    }
  }, [account, balanceWei]);

  // Find claim transactions for an address
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
              if (
                tx.from?.toLowerCase() === address.toLowerCase() &&
                tx.to?.toLowerCase() === PLAY_TOKEN_ADDRESS?.toLowerCase() &&
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
    if (!account || !PLAY_TOKEN_ADDRESS || !window.ethereum) {
      return { success: false, error: 'ウォレットまたはコントラクトアドレスが設定されていません' };
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
          to: PLAY_TOKEN_ADDRESS,
          data: CLAIM_FUNCTION_SELECTOR,
          gas: '0x1adb0', // 110000 gas limit
          gasPrice: bufferedGasPrice,
          nonce: nonce,
        }],
      });

      console.log('Claim transaction submitted:', txHash);
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
  }, [account, hasClaimed, refreshClaimStatus]);

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
    if (!window.ethereum) return false;

    try {
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: [{
          type: 'ERC20',
          options: {
            address: PLAY_TOKEN_ADDRESS,
            symbol: 'PT',
            decimals: 18,
            image: '',
          },
        }],
      });
      
      return Boolean(wasAdded);
    } catch (error) {
      console.error('Failed to add token to MetaMask:', error);
      return false;
    }
  }, []);

  // Auto-refresh when account changes
  useEffect(() => {
    if (account) {
      refreshBalance();
      refreshClaimStatus();
    } else {
      setBalance('0');
      setBalanceWei(null);
      setHasClaimed(false);
      setLastClaimTxHash(null);
      setClaimHistory([]);
    }
  }, [account, refreshBalance, refreshClaimStatus]);

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
    
    // Actions
    refreshBalance,
    refreshClaimStatus,
    claimTokens,
    addTokenToMetaMask,
    checkTransactionStatus,
  };
}