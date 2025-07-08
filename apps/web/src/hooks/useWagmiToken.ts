import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { NETWORKS, getCurrencySymbol, getCurrencyContract, getCurrencyDecimals } from '@/config/networks';

// ERC-20 ABI for token functions
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'claim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'hasClaimed',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  }
] as const;

interface WagmiTokenState {
  balance: string;
  symbol: string;
  decimals: number;
  isLoading: boolean;
  error: string | null;
  hasClaimed: boolean;
  canClaim: boolean;
}

interface WagmiTokenActions {
  refreshBalance: () => Promise<void>;
  claimTokens: () => Promise<{ success: boolean; txHash?: string; error?: string }>;
  isWagmiAvailable: boolean;
}

const DEBUG_MODE = process.env.NODE_ENV === 'development';

export function useWagmiToken(networkKey?: string): WagmiTokenState & WagmiTokenActions {
  const { address: account, chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();
  
  const [balance, setBalance] = useState<string>('0');
  const [symbol, setSymbol] = useState<string>('');
  const [decimals, setDecimals] = useState<number>(18);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasClaimed, setHasClaimed] = useState<boolean>(false);
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>();

  // Get current network or use default
  const currentNetworkKey = networkKey || (chain ? Object.keys(NETWORKS).find(key => NETWORKS[key].chainId === chain.id) : 'polygon');
  const currentNetwork = currentNetworkKey ? NETWORKS[currentNetworkKey] : undefined;
  const tokenAddress = currentNetwork ? getCurrencyContract(currentNetworkKey) : undefined;
  const isWagmiAvailable = !!(publicClient && walletClient && account);

  // Read balance
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
    query: {
      enabled: !!(tokenAddress && account && publicClient),
    }
  });

  // Read claim status
  const { data: hasClaimedData, refetch: refetchHasClaimed } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'hasClaimed',
    args: account ? [account] : undefined,
    query: {
      enabled: !!(tokenAddress && account && publicClient && (currentNetworkKey === 'polygonAmoy' || currentNetworkKey === 'sepolia')),
    }
  });

  // Read decimals
  const { data: decimalsData } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!(tokenAddress && publicClient),
    }
  });

  // Read symbol
  const { data: symbolData } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'symbol',
    query: {
      enabled: !!(tokenAddress && publicClient),
    }
  });

  // Wait for transaction receipt
  const { data: receipt, isLoading: isWaitingForReceipt } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  });

  // Update state when data changes
  useEffect(() => {
    if (balanceData !== undefined) {
      const formatted = formatUnits(balanceData, decimalsData || 18);
      setBalance(formatted);
    }
  }, [balanceData, decimalsData]);

  useEffect(() => {
    if (symbolData) {
      setSymbol(symbolData);
    } else if (currentNetworkKey) {
      setSymbol(getCurrencySymbol(currentNetworkKey));
    }
  }, [symbolData, currentNetworkKey]);

  useEffect(() => {
    if (decimalsData !== undefined) {
      setDecimals(Number(decimalsData));
    } else if (currentNetworkKey) {
      setDecimals(getCurrencyDecimals(currentNetworkKey));
    }
  }, [decimalsData, currentNetworkKey]);

  useEffect(() => {
    setHasClaimed(!!hasClaimedData);
  }, [hasClaimedData]);

  // Handle successful transaction
  useEffect(() => {
    if (receipt && receipt.status === 'success') {
      setPendingTxHash(undefined);
      // Refresh balance and claim status after successful transaction
      setTimeout(() => {
        refetchBalance();
        refetchHasClaimed();
      }, 2000);
    }
  }, [receipt, refetchBalance, refetchHasClaimed]);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        refetchBalance(),
        refetchHasClaimed()
      ]);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh balance:', err);
      setError('Failed to refresh balance');
    } finally {
      setIsLoading(false);
    }
  }, [refetchBalance, refetchHasClaimed]);

  // Claim tokens using wagmi
  const claimTokens = useCallback(async (): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!isWagmiAvailable) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (!tokenAddress) {
      return { success: false, error: 'Token address not available' };
    }

    if (hasClaimed) {
      return { success: false, error: 'Tokens already claimed' };
    }

    if (currentNetworkKey !== 'polygonAmoy' && currentNetworkKey !== 'sepolia') {
      return { success: false, error: 'Claiming is only available on supported testnets' };
    }

    try {
      if (DEBUG_MODE) {
        console.log('Claiming tokens via wagmi...', {
          tokenAddress,
          account,
          networkKey: currentNetworkKey
        });
      }

      const hash = await writeContractAsync({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'claim',
        args: [],
      });

      if (DEBUG_MODE) {
        console.log('Claim transaction submitted:', hash);
      }

      setPendingTxHash(hash);
      return { success: true, txHash: hash };
    } catch (error: any) {
      console.error('Claim failed:', error);
      
      // Handle specific error cases
      if (error.message?.includes('insufficient funds')) {
        return { 
          success: false, 
          error: 'ガス代が不足しています。ネットワークのネイティブトークンが必要です。' 
        };
      }
      
      return { 
        success: false, 
        error: error.message || 'Claim failed' 
      };
    }
  }, [isWagmiAvailable, tokenAddress, hasClaimed, currentNetworkKey, writeContractAsync, account]);

  return {
    // State
    balance,
    symbol,
    decimals,
    isLoading: isLoading || isWaitingForReceipt,
    error,
    hasClaimed,
    canClaim: (currentNetworkKey === 'polygonAmoy' || currentNetworkKey === 'sepolia') && !hasClaimed,
    
    // Actions
    refreshBalance,
    claimTokens,
    isWagmiAvailable
  };
}