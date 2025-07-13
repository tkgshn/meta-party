import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserProvider, Contract, formatUnits } from 'ethers';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
] as const;

// Contract addresses on Polygon Amoy
const PLAY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_PLAY_TOKEN_ADDRESS;
// const MARKET_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS;
// const CONDITIONAL_TOKENS_ADDRESS = process.env.NEXT_PUBLIC_CONDITIONAL_TOKENS_ADDRESS;

// Polygon Amoy chain ID
const POLYGON_AMOY_CHAIN_ID = 80002;

interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceWei: bigint;
  value: number; // In terms of PT
}

interface PortfolioData {
  playTokenBalance: TokenBalance | null;
  positionTokens: TokenBalance[];
  totalPortfolioValue: number;
  totalCash: number;
  totalPositions: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseOnChainPortfolioReturn extends PortfolioData {
  refreshPortfolio: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  addTokenToMetaMask: (tokenAddress: string) => Promise<boolean>;
}

export function useOnChainPortfolio(account: string | null): UseOnChainPortfolioReturn {
  const [portfolioData, setPortfolioData] = useState<PortfolioData>({
    playTokenBalance: null,
    positionTokens: [],
    totalPortfolioValue: 0,
    totalCash: 0,
    totalPositions: 0,
    isLoading: false,
    error: null,
    lastUpdated: null
  });

  const providerRef = useRef<BrowserProvider | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize provider
  const initializeProvider = useCallback(async () => {
    if (!window.ethereum || !account) return null;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      if (Number(network.chainId) !== POLYGON_AMOY_CHAIN_ID) {
        console.warn('Not on Polygon Amoy network');
        return null;
      }

      providerRef.current = provider;
      return provider;
    } catch (error) {
      console.error('Failed to initialize provider:', error);
      return null;
    }
  }, [account]);

  // Get token balance and metadata
  const getTokenBalance = useCallback(async (
    provider: BrowserProvider,
    tokenAddress: string,
    account: string
  ): Promise<TokenBalance | null> => {
    try {
      const contract = new Contract(tokenAddress, ERC20_ABI, provider);
      
      const [balance, decimals, symbol, name] = await Promise.all([
        contract.balanceOf(account),
        contract.decimals(),
        contract.symbol(),
        contract.name()
      ]);

      const balanceWei = BigInt(balance.toString());
      const balanceFormatted = formatUnits(balanceWei, decimals);

      return {
        address: tokenAddress,
        symbol: symbol,
        name: name,
        decimals: Number(decimals),
        balance: balanceFormatted,
        balanceWei: balanceWei,
        value: parseFloat(balanceFormatted) // For PT, value = balance
      };
    } catch (error) {
      console.error(`Failed to get balance for token ${tokenAddress}:`, error);
      return null;
    }
  }, []);

  // Get all position tokens (ERC1155 tokens from conditional tokens)
  const getPositionTokens = useCallback(async (
    // provider: BrowserProvider,
    // account: string
  ): Promise<TokenBalance[]> => {
    // TODO: Implement position token fetching
    // This would require:
    // 1. Query ConditionalTokens contract for user's positions
    // 2. Get balance for each position token
    // 3. Calculate current market value of each position
    
    // For now, return empty array - will implement when we have active markets
    return [];
  }, []);

  // Refresh portfolio data
  const refreshPortfolio = useCallback(async () => {
    if (!account || !PLAY_TOKEN_ADDRESS) {
      setPortfolioData(prev => ({
        ...prev,
        playTokenBalance: null,
        positionTokens: [],
        totalPortfolioValue: 0,
        totalCash: 0,
        totalPositions: 0,
        isLoading: false,
        error: null
      }));
      return;
    }

    setPortfolioData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const provider = await initializeProvider();
      if (!provider) {
        console.warn('No wallet provider available - portfolio data unavailable');
        setPortfolioData(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Wallet connection required for portfolio data'
        }));
        return;
      }

      // Get Play Token balance
      const playTokenBalance = await getTokenBalance(provider, PLAY_TOKEN_ADDRESS, account);
      
      // Get position tokens
      const positionTokens = await getPositionTokens();

      // Calculate portfolio totals
      const totalCash = playTokenBalance ? parseFloat(playTokenBalance.balance) : 0;
      const totalPositionsValue = positionTokens.reduce((sum, token) => sum + token.value, 0);
      const totalPortfolioValue = totalCash + totalPositionsValue;

      setPortfolioData({
        playTokenBalance,
        positionTokens,
        totalPortfolioValue,
        totalCash,
        totalPositions: positionTokens.length,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      });

    } catch (error) {
      console.error('Failed to refresh portfolio:', error);
      setPortfolioData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  }, [account, initializeProvider, getTokenBalance, getPositionTokens]);

  // Refresh balance only (faster than full portfolio refresh)
  const refreshBalance = useCallback(async () => {
    if (!account || !PLAY_TOKEN_ADDRESS) return;

    try {
      const provider = await initializeProvider();
      if (!provider) return;

      const playTokenBalance = await getTokenBalance(provider, PLAY_TOKEN_ADDRESS, account);
      
      if (playTokenBalance) {
        setPortfolioData(prev => ({
          ...prev,
          playTokenBalance,
          totalCash: parseFloat(playTokenBalance.balance),
          totalPortfolioValue: parseFloat(playTokenBalance.balance) + prev.positionTokens.reduce((sum, token) => sum + token.value, 0),
          lastUpdated: new Date()
        }));
      }

    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [account, initializeProvider, getTokenBalance]);

  // Add token to MetaMask
  const addTokenToMetaMask = useCallback(async (tokenAddress: string): Promise<boolean> => {
    if (!window.ethereum) return false;

    try {
      const provider = await initializeProvider();
      if (!provider) return false;

      const contract = new Contract(tokenAddress, ERC20_ABI, provider);
      const [symbol, decimals] = await Promise.all([
        contract.symbol(),
        contract.decimals()
      ]);

      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: [{
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: symbol,
            decimals: Number(decimals),
            image: '',
          },
        }],
      });

      return Boolean(wasAdded);
    } catch (error) {
      console.error('Failed to add token to MetaMask:', error);
      return false;
    }
  }, [initializeProvider]);

  // Set up real-time updates
  useEffect(() => {
    if (!account || !window.ethereum) return;

    let mounted = true;

    const setupListeners = async () => {
      const provider = await initializeProvider();
      if (!provider || !mounted) return;

      // Initial load
      await refreshPortfolio();

      // Listen for new blocks (every ~2 seconds on Polygon)
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
          if (accounts.length > 0) {
            refreshPortfolio();
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

      // Set up periodic refresh (every 30 seconds as backup)
      intervalRef.current = setInterval(() => {
        if (mounted) {
          refreshBalance();
        }
      }, 30000);

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
  }, [account, initializeProvider, refreshPortfolio, refreshBalance]);

  return {
    ...portfolioData,
    refreshPortfolio,
    refreshBalance,
    addTokenToMetaMask
  };
}