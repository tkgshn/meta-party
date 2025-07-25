import { useState, useEffect, useCallback } from 'react';
import { onChainService, OnChainMarket, MarketTrade, PlatformStats } from '@/lib/onChainService';

interface UseOnChainMarketsReturn {
  markets: OnChainMarket[];
  isLoading: boolean;
  error: string | null;
  refreshMarkets: () => Promise<void>;
  getMarketTrades: (marketAddress: string) => Promise<MarketTrade[]>;
  buyOutcome: (marketAddress: string, outcome: number, amount: string, account: string) => Promise<string>;
  createMarket: (
    title: string,
    kpiDescription: string,
    tradingDeadline: number,
    resolutionTime: number,
    numOutcomes: number,
    account: string
  ) => Promise<string>;
  platformStats: PlatformStats | null;
  lastUpdated: Date | null;
}

export function useOnChainMarkets(): UseOnChainMarketsReturn {
  const [markets, setMarkets] = useState<OnChainMarket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Initialize service
  const initializeService = useCallback(async () => {
    try {
      await onChainService.initialize();
      return true;
    } catch (error) {
      console.error('Failed to initialize on-chain service:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize service');
      return false;
    }
  }, []);

  // Refresh markets from blockchain
  const refreshMarkets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const initialized = await initializeService();
      if (!initialized) return;

      const [marketsData, statsData] = await Promise.all([
        onChainService.getAllMarkets(),
        onChainService.getPlatformStats()
      ]);

      setMarkets(marketsData);
      setPlatformStats(statsData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to refresh markets:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh markets');
    } finally {
      setIsLoading(false);
    }
  }, [initializeService]);

  // Get market trades
  const getMarketTrades = useCallback(async (marketAddress: string): Promise<MarketTrade[]> => {
    try {
      return await onChainService.getMarketTrades(marketAddress);
    } catch (error) {
      console.error('Failed to get market trades:', error);
      throw error;
    }
  }, []);

  // Buy outcome
  const buyOutcome = useCallback(async (
    marketAddress: string,
    outcome: number,
    amount: string,
    account: string
  ): Promise<string> => {
    try {
      const txHash = await onChainService.buyOutcome(marketAddress, outcome, amount, account);
      // Refresh markets after trade
      await refreshMarkets();
      return txHash;
    } catch (error) {
      console.error('Failed to buy outcome:', error);
      throw error;
    }
  }, [refreshMarkets]);

  // Create market
  const createMarket = useCallback(async (
    title: string,
    kpiDescription: string,
    tradingDeadline: number,
    resolutionTime: number,
    numOutcomes: number,
    account: string
  ): Promise<string> => {
    try {
      const marketAddress = await onChainService.createMarket(
        title,
        kpiDescription,
        tradingDeadline,
        resolutionTime,
        numOutcomes,
        account
      );
      // Refresh markets after creation
      await refreshMarkets();
      return marketAddress;
    } catch (error) {
      console.error('Failed to create market:', error);
      throw error;
    }
  }, [refreshMarkets]);

  // Initial load
  useEffect(() => {
    refreshMarkets();
  }, [refreshMarkets]);

  // Set up periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refreshMarkets();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refreshMarkets]);

  return {
    markets,
    isLoading,
    error,
    refreshMarkets,
    getMarketTrades,
    buyOutcome,
    createMarket,
    platformStats,
    lastUpdated
  };
}

// Additional hook for individual market data
export function useOnChainMarket(marketAddress: string) {
  const [market, setMarket] = useState<OnChainMarket | null>(null);
  const [trades, setTrades] = useState<MarketTrade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMarket = useCallback(async () => {
    if (!marketAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      await onChainService.initialize();
      const [marketData, tradesData] = await Promise.all([
        onChainService.getMarketData(marketAddress),
        onChainService.getMarketTrades(marketAddress)
      ]);

      setMarket(marketData);
      setTrades(tradesData);
    } catch (error) {
      console.error('Failed to refresh market:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh market');
    } finally {
      setIsLoading(false);
    }
  }, [marketAddress]);

  useEffect(() => {
    refreshMarket();
  }, [refreshMarket]);

  return {
    market,
    trades,
    isLoading,
    error,
    refreshMarket
  };
}

// Convert OnChainMarket to legacy format for backward compatibility
export function convertToLegacyMarket(market: OnChainMarket) {
  const volume = parseFloat(market.volume || '0');
  const funding = parseFloat(market.totalFunding || '0');
  
  return {
    id: market.address,
    title: market.title,
    description: market.kpiDescription,
    category: 'governance', // Default category
    totalVolume: volume,
    participants: market.participants || 0,
    endDate: new Date(market.tradingDeadline * 1000),
    deadline: new Date(market.tradingDeadline * 1000),
    tags: ['futarchy', 'governance'],
    featured: false,
    status: (market.phase === 0 ? 'TRADING' : 'CLOSED') as 'TRADING' | 'CLOSED',
    createdAt: new Date(market.createdAt),
    lastTrade: new Date(market.lastUpdated),
    topPrice: market.prices && market.prices.length > 0 ? parseFloat(market.prices[0]) : 0.5,
    change24h: 0.05, // Default value since we don't track 24h changes yet
    liquidity: funding || volume * 2, // Use funding as liquidity, fallback to 2x volume
    numProposals: market.numOutcomes || 0,
    priceHistory: [{
      time: new Date(market.lastUpdated).toISOString(),
      price: market.prices && market.prices.length > 0 ? parseFloat(market.prices[0]) : 0.5
    }],
    proposals: market.prices && market.prices.length > 0 ? market.prices.map((price, index) => ({
      id: index.toString(),
      name: `提案 ${index + 1}`,
      description: `アウトカム ${index + 1}`,
      price: parseFloat(price) || 0,
      volume: volume / market.numOutcomes || 0,
      change24h: 0.02, // Default value
      supporters: Math.floor((market.participants || 0) / market.numOutcomes) || 1
    })) : []
  };
}

// Create sample markets for testing if no on-chain markets exist
export function createSampleMarkets(): OnChainMarket[] {
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const oneMonth = 30 * 24 * 60 * 60 * 1000;

  return [
    {
      address: '0x1234567890123456789012345678901234567890',
      title: '社会保障制度の捕捉率改善',
      kpiDescription: '1年間で1億円の予算をかけて、社会保障制度の捕捉率を10%改善する',
      tradingDeadline: Math.floor((now + oneWeek) / 1000),
      resolutionTime: Math.floor((now + oneMonth) / 1000),
      numOutcomes: 3,
      phase: 0, // TRADING
      winningOutcome: 0,
      totalFunding: '100000',
      prices: ['0.4', '0.35', '0.25'],
      volume: '50000',
      participants: 25,
      createdAt: now - oneWeek,
      lastUpdated: now
    },
    {
      address: '0x2234567890123456789012345678901234567890',
      title: 'デジタル政府サービスの利用率向上',
      kpiDescription: '6ヶ月間で政府のデジタルサービス利用率を30%向上させる',
      tradingDeadline: Math.floor((now + oneWeek * 2) / 1000),
      resolutionTime: Math.floor((now + oneMonth * 2) / 1000),
      numOutcomes: 4,
      phase: 0, // TRADING
      winningOutcome: 0,
      totalFunding: '75000',
      prices: ['0.3', '0.28', '0.22', '0.2'],
      volume: '35000',
      participants: 18,
      createdAt: now - oneWeek * 2,
      lastUpdated: now
    },
    {
      address: '0x3234567890123456789012345678901234567890',
      title: 'チームみらいが2025年8月31日までに政党要件を満たす',
      kpiDescription: '「チームみらい」が2025年8月31日までに政治資金規正法第3条に規定する政党要件（所属国会議員5名以上または直近の衆参選挙で全国得票率2%以上）を満たすことができるか？',
      tradingDeadline: Math.floor(new Date('2025-08-31T23:59:59').getTime() / 1000),
      resolutionTime: Math.floor(new Date('2025-09-30T23:59:59').getTime() / 1000),
      numOutcomes: 2, // YES/NO market
      phase: 0, // TRADING
      winningOutcome: 0,
      totalFunding: '50000',
      prices: ['0.34', '0.66'], // YES: 34%, NO: 66%
      volume: '25000',
      participants: 89,
      createdAt: now - 3 * 24 * 60 * 60 * 1000, // 3 days ago
      lastUpdated: now
    }
  ];
}