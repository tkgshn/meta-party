import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useToken } from '@/hooks/useToken';
import { useWagmiToken } from '@/hooks/useWagmiToken';

interface WalletDetectionResult {
  // Wallet type detection
  isUsingWagmi: boolean;
  isBrowserWallet: boolean;
  isSocialWallet: boolean;
  
  // Unified token interface
  balance: string;
  symbol: string;
  decimals: number;
  isLoading: boolean;
  error: string | null;
  canClaim: boolean;
  hasClaimed: boolean;
  
  // Unified actions
  claimTokens: (() => Promise<{ success: boolean; txHash?: string; error?: string }>) | undefined;
  refreshBalance: () => Promise<void>;
  addTokenToMetaMask: (() => Promise<boolean>) | undefined;
}

/**
 * Unified hook that detects wallet type and provides consistent interface
 * regardless of whether user is using browser wallet (MetaMask) or social wallet (Reown)
 */
export function useWalletDetection(networkKey?: string): WalletDetectionResult {
  const { address } = useAccount();
  
  // Use both hooks
  const wagmiToken = useWagmiToken(networkKey);
  const browserToken = useToken(address || null, networkKey);
  
  // Detect wallet type
  const walletType = useMemo(() => {
    const hasWindowEthereum = !!window.ethereum;
    const isWagmiAvailable = wagmiToken.isWagmiAvailable;
    
    // If wagmi is available but no browser wallet, likely social wallet
    const isUsingWagmi = isWagmiAvailable && !hasWindowEthereum;
    const isBrowserWallet = hasWindowEthereum && !!address;
    const isSocialWallet = isWagmiAvailable && !hasWindowEthereum;
    
    return {
      isUsingWagmi,
      isBrowserWallet,
      isSocialWallet
    };
  }, [wagmiToken.isWagmiAvailable, address]);
  
  // Return unified interface based on detected wallet type
  return useMemo(() => {
    if (walletType.isUsingWagmi) {
      // Use wagmi for social wallets
      return {
        ...walletType,
        balance: wagmiToken.balance,
        symbol: wagmiToken.symbol,
        decimals: wagmiToken.decimals,
        isLoading: wagmiToken.isLoading,
        error: wagmiToken.error,
        canClaim: wagmiToken.canClaim,
        hasClaimed: wagmiToken.hasClaimed,
        claimTokens: wagmiToken.claimTokens,
        refreshBalance: wagmiToken.refreshBalance,
        addTokenToMetaMask: undefined // Not applicable for social wallets
      };
    } else {
      // Use browser wallet hooks for MetaMask etc.
      return {
        ...walletType,
        balance: browserToken.balance,
        symbol: browserToken.symbol,
        decimals: browserToken.decimals,
        isLoading: browserToken.isLoading,
        error: browserToken.error,
        canClaim: browserToken.canClaim || false,
        hasClaimed: browserToken.hasClaimed || false,
        claimTokens: browserToken.claimTokens,
        refreshBalance: browserToken.refreshBalance,
        addTokenToMetaMask: browserToken.addTokenToMetaMask
      };
    }
  }, [walletType, wagmiToken, browserToken]);
}