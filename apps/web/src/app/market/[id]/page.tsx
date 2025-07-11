'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  BanknotesIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

import { useOnChainMarket } from '@/hooks/useOnChainMarkets';
import { type Market } from '@/data/miraiMarkets';
import Header from '@/components/Header';
import { updateMarketState } from '@/utils/futarchyMath';
import { useAppKit } from '@reown/appkit/react';
import { useOnChainPortfolio } from '@/hooks/useOnChainPortfolio';
import { onChainService } from '@/lib/onChainService';

// Helper function to get market data by ID (fallback for sample data)
const getMarketById = (id: string) => {
  // This would be used only if no on-chain market is found
  const sampleMarkets = [
    {
      id: 'sample-1',
      title: 'サンプル市場',
      description: 'サンプル市場の説明',
      category: 'governance',
      totalVolume: 1000,
      participants: 10,
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tags: ['sample'],
      isFeatured: false,
      isActive: true,
      createdAt: new Date(),
      lastTrade: new Date(),
      liquidity: 1000,
      topPrice: 0.5,
      proposals: [
        {
          id: '0',
          name: '提案 1',
          description: 'サンプル提案',
          price: 0.5,
          probability: 50,
          supporters: 5,
          volume: 500,
          lastUpdate: new Date()
        }
      ]
    }
  ];
  return sampleMarkets.find(market => market.id === id);
};

// Convert on-chain market to legacy format for backward compatibility
const convertOnChainMarketToLegacy = (onChainMarket: any) => {
  return {
    id: onChainMarket.address,
    title: onChainMarket.title,
    description: onChainMarket.kpiDescription,
    category: 'governance',
    totalVolume: parseFloat(onChainMarket.volume),
    participants: onChainMarket.participants,
    endDate: new Date(onChainMarket.tradingDeadline * 1000),
    deadline: new Date(onChainMarket.tradingDeadline * 1000),
    tags: ['futarchy', 'governance'],
    isFeatured: false,
    isActive: onChainMarket.phase === 0,
    createdAt: new Date(onChainMarket.createdAt),
    lastTrade: new Date(onChainMarket.lastUpdated),
    liquidity: parseFloat(onChainMarket.totalFunding),
    topPrice: parseFloat(onChainMarket.prices[0] || '0.5'),
    proposals: onChainMarket.prices.map((price: string, index: number) => ({
      id: `${index}`,
      name: `提案 ${index + 1}`,
      description: `アウトカム ${index + 1}`,
      price: parseFloat(price),
      probability: Math.round(parseFloat(price) * 100),
      supporters: Math.floor(onChainMarket.participants / onChainMarket.numOutcomes),
      volume: parseFloat(onChainMarket.volume) / onChainMarket.numOutcomes,
      lastUpdate: new Date(onChainMarket.lastUpdated)
    }))
  };
};

// Generate price history for multi-option markets with different time scopes
const generatePriceHistory = (marketData: Market, timeScope: '1h' | '6h' | '1w' | '1m' | 'all') => {
  // Define data points and time intervals based on scope
  const scopeConfig = {
    '1h': { points: 60, interval: 1, unit: 'minutes', formatString: 'HH:mm' },
    '6h': { points: 72, interval: 5, unit: 'minutes', formatString: 'HH:mm' },
    '1w': { points: 168, interval: 1, unit: 'hours', formatString: 'MM/dd HH:mm' },
    '1m': { points: 30, interval: 1, unit: 'days', formatString: 'MM/dd' },
    'all': { points: 90, interval: 1, unit: 'days', formatString: 'MM/dd' }
  };

  const config = scopeConfig[timeScope];

  return Array.from({ length: config.points }, (_, i) => {
    const date = new Date();

    // Calculate the time offset based on scope
    if (config.unit === 'minutes') {
      date.setMinutes(date.getMinutes() - (config.points - 1 - i) * config.interval);
    } else if (config.unit === 'hours') {
      date.setHours(date.getHours() - (config.points - 1 - i) * config.interval);
    } else {
      date.setDate(date.getDate() - (config.points - 1 - i) * config.interval);
    }

    const dataPoint: Record<string, unknown> = {
      date: format(date, config.formatString, { locale: ja })
    };

    if (marketData.proposals) {
      // Multi-option market - generate dramatic price movement
      const rawPrices: number[] = [];
      const totalPoints = config.points;

      marketData.proposals.forEach((proposal) => {
        const trendFactor = (i / totalPoints); // 0 to 1 from past to present
        const currentPrice = proposal.price;

        let historicalPrice = currentPrice; // Default to current price

        // Create dramatic story for each proposal with different patterns per time scope
        if (proposal.id === 'askoe') {
          // アスコエ: 大幅上昇 (15% → 42%)
          const startPrice = timeScope === '1h' ? currentPrice * 0.95 :
            timeScope === '6h' ? currentPrice * 0.85 :
              timeScope === '1w' ? currentPrice * 0.6 :
                timeScope === '1m' ? 0.25 : 0.15;
          const midDrop = timeScope !== '1h' && i > totalPoints * 0.3 && i < totalPoints * 0.7 ? -0.05 : 0;
          historicalPrice = startPrice + (currentPrice - startPrice) * trendFactor + midDrop;
        } else if (proposal.id === 'civichat') {
          // civichat: 大幅下落 (60% → 35%)
          const startPrice = timeScope === '1h' ? currentPrice * 1.05 :
            timeScope === '6h' ? currentPrice * 1.15 :
              timeScope === '1w' ? currentPrice * 1.4 :
                timeScope === '1m' ? 0.45 : 0.60;
          const spike = timeScope !== '1h' && i > totalPoints * 0.1 && i < totalPoints * 0.3 ? 0.1 : 0;
          historicalPrice = startPrice + (currentPrice - startPrice) * trendFactor + spike;
        } else if (proposal.id === 'graffer') {
          // graffer: 比較的安定 (25% → 23%)
          const startPrice = timeScope === '1h' ? currentPrice * 1.02 :
            timeScope === '6h' ? currentPrice * 1.08 :
              timeScope === '1w' ? currentPrice * 1.1 :
                timeScope === '1m' ? 0.30 : 0.25;
          historicalPrice = startPrice + (currentPrice - startPrice) * trendFactor;
        }

        // Add scope-appropriate noise
        const noiseLevel = timeScope === '1h' ? 0.005 :
          timeScope === '6h' ? 0.01 :
            timeScope === '1w' ? 0.02 : 0.03;
        const noise = (Math.random() - 0.5) * noiseLevel;
        const rawPrice = Math.max(0.01, historicalPrice + noise);

        rawPrices.push(rawPrice);
      });

      // Normalize to ensure total equals exactly 1.0 (100%)
      const totalRaw = rawPrices.reduce((sum, price) => sum + price, 0);
      marketData.proposals.forEach((proposal, index) => {
        dataPoint[`proposal_${proposal.id}`] = rawPrices[index] / totalRaw;
      });
    } else {
      // Binary market - keep original logic
      const basePrice = 0.5 + (i / config.points) * 0.15;
      const noise = (Math.random() - 0.5) * 0.1;
      const yesPrice = Math.max(0.01, Math.min(0.99, basePrice + noise));

      dataPoint.yesPrice = yesPrice;
      dataPoint.noPrice = 1 - yesPrice;
    }

    return dataPoint;
  });
};

export default function MarketDetailPage() {
  const params = useParams();
  const marketId = params.id as string;

  const [selectedProposal, setSelectedProposal] = useState<string>('');
  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no'>('yes');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const { open } = useAppKit();
  const [timeScope, setTimeScope] = useState<'1h' | '6h' | '1w' | '1m' | 'all'>('1w');
  const [selectedBuyButton, setSelectedBuyButton] = useState<{ proposalId: string; type: 'yes' | 'no' } | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<'open' | 'decision' | 'resolution' | null>(null);
  const [isTrading, setIsTrading] = useState(false);

  // Get user's wallet account
  const { account } = useAppKit();
  
  // Use on-chain data
  const { market: onChainMarket, trades, isLoading, error, refreshMarket } = useOnChainMarket(marketId);
  const { playTokenBalance } = useOnChainPortfolio(account);

  // Convert to legacy format for backward compatibility
  const marketData = onChainMarket ? convertOnChainMarketToLegacy(onChainMarket) : getMarketById(marketId);
  const userBalance = playTokenBalance ? parseFloat(playTokenBalance) : 0;

  // Generate price history based on market data and time scope
  const priceHistory = useMemo(() => {
    if (!marketData) return [];
    return generatePriceHistory(marketData, timeScope);
  }, [marketData, timeScope]);

  // Calculate market state using futarchy math
  // const marketState = useMemo(() => {
  //   if (!marketData?.proposals) return null;

  //   const outcomes = marketData.proposals.map(proposal => ({
  //     id: proposal.id,
  //     name: proposal.name,
  //     probability: proposal.price
  //   }));

  //   return updateMarketState(outcomes, 0.01); // 1% spread
  // }, [marketData]);
  
  // Suppress unused variable warning for now
  console.log('Market state available:', typeof updateMarketState);

  // Handle buy outcome
  const handleBuyOutcome = async () => {
    if (!onChainMarket || !account || !amount || !selectedBuyButton) {
      console.error('Missing required data for trade');
      return;
    }

    setIsTrading(true);
    try {
      // Get the outcome index based on the selected button
      const outcomeIndex = selectedBuyButton.type === 'yes' ? 
        parseInt(selectedBuyButton.proposalId) : 
        parseInt(selectedBuyButton.proposalId) + onChainMarket.numOutcomes;

      // Execute the trade
      const txHash = await onChainService.buyOutcome(
        onChainMarket.address,
        outcomeIndex,
        amount,
        account
      );

      console.log('Trade executed successfully:', txHash);
      
      // Refresh market data
      await refreshMarket();
      
      // Reset form
      setAmount('');
      setSelectedBuyButton(null);
      
      // Show success message (you could add a toast here)
      alert('取引が完了しました！');
      
    } catch (error) {
      console.error('Trade failed:', error);
      alert('取引に失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'));
    } finally {
      setIsTrading(false);
    }
  };

  // Initialize selected proposal and buy button
  useEffect(() => {
    if (marketData?.proposals && marketData.proposals.length > 0) {
      // Set default selection to first proposal's "yes" option
      if (!selectedBuyButton) {
        setSelectedBuyButton({
          proposalId: marketData.proposals[0].id,
          type: 'yes'
        });
      }
      // Keep the old selectedProposal logic for compatibility
      if (!selectedProposal) {
        setSelectedProposal(marketData.proposals[0].id);
      }
    }
  }, [marketData, selectedProposal, selectedBuyButton]);

  // Set default phase based on current date
  useEffect(() => {
    if (marketData && selectedPhase === null) {
      const now = new Date();
      const deadline = new Date(marketData.deadline);
      const resolutionDate = new Date(marketData.deadline);
      resolutionDate.setDate(resolutionDate.getDate() + 90);

      if (now < deadline) {
        // We're before the deadline, so we're in the decision period
        setSelectedPhase('open');
      } else if (now < resolutionDate) {
        // We're between deadline and resolution, so we're in the evaluation period
        setSelectedPhase('decision');
      } else {
        // We're after resolution
        setSelectedPhase('resolution');
      }
    }
  }, [marketData, selectedPhase]);

  // If market not found, show error
  if (!marketData) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">市場が見つかりません</h1>
            <Link href="/" className="text-blue-600 hover:text-blue-500">
              市場一覧に戻る
            </Link>
          </div>
        </main>
      </>
    );
  }

  const yesPrice = marketData.topPrice;
  const noPrice = 1 - yesPrice;

  return (
    <div>
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Breadcrumb */}
        {/* <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          市場一覧に戻る
        </Link> */}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {marketData.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="inline-flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  {format(marketData.deadline, 'yyyy年MM月dd日', { locale: ja })}まで
                </span>
                <span className="inline-flex items-center">
                  <UserGroupIcon className="w-4 h-4 mr-1" />
                  {marketData.participants}人が参加
                </span>
                <span className="inline-flex items-center">
                  <BanknotesIcon className="w-4 h-4 mr-1" />
                  {(marketData.totalVolume || 0).toLocaleString()} PT
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="ml-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${marketData.status === 'TRADING'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
                }`}>
                {marketData.status === 'TRADING' ? '取引中' : '取引終了'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content - Left Right Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Side - Market Overview and Chart */}
          <div className="lg:col-span-3 space-y-6">
            {/* Chart Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">価格推移</h2>

                  {/* Time Scope Selector */}
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                    {(['1h', '6h', '1w', '1m', 'all'] as const).map((scope) => (
                      <button
                        key={scope}
                        onClick={() => setTimeScope(scope)}
                        className={`px-3 py-1 text-sm font-medium transition-colors ${timeScope === scope
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        {scope === 'all' ? 'すべて' : scope}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-80 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={priceHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 1]}
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                      />
                      <Tooltip
                        labelFormatter={(label) => `日付: ${label}`}
                        formatter={(value: number, name: string) => {
                          const displayName = marketData?.proposals?.find(p => `proposal_${p.id}` === name)?.name || name;
                          return [`${(value * 100).toFixed(1)}%`, displayName];
                        }}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      {marketData?.proposals && marketData.proposals.length > 1 && (
                        <Legend
                          wrapperStyle={{ paddingTop: '20px' }}
                          formatter={(value, entry) => {
                            const proposal = marketData.proposals?.find(p => `proposal_${p.id}` === value);
                            return <span style={{ color: entry.color }}>{proposal?.name || value}</span>;
                          }}
                        />
                      )}
                      {marketData?.proposals ? (
                        // Multi-option market - show line for each proposal
                        marketData.proposals.map((proposal, index) => {
                          const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
                          const color = colors[index % colors.length];
                          return (
                            <Line
                              key={proposal.id}
                              type="monotone"
                              dataKey={`proposal_${proposal.id}`}
                              stroke={color}
                              strokeWidth={2}
                              dot={false}
                              name={proposal.name}
                            />
                          );
                        })
                      ) : (
                        // Binary market - show YES line
                        <Line
                          type="monotone"
                          dataKey="yesPrice"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={false}
                          name="YES確率"
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Proposals Odds */}
            {marketData.proposals && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">実装候補の倍率</h2>
                  <div className="divide-y divide-gray-200">
                    {marketData.proposals.map((proposal) => {
                      // const colors = [
                      //   { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', price: 'text-blue-600' },
                      //   { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', price: 'text-green-600' },
                      //   { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', price: 'text-purple-600' }
                      // ];
                      // const color = colors[index % 3];
                      // const odds = (1 / proposal.price).toFixed(2);

                      return (
                        <div key={proposal.id} className="py-4 transition-colors hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="mb-2">
                                <h3 className="font-semibold text-gray-900">{proposal.name}</h3>
                              </div>
                              {/* <p className="text-sm text-gray-600 mb-3">{proposal.description}</p> */}
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>{(proposal.volume || 0).toLocaleString()} ボリューム</span>
                                <span className="flex items-center">
                                  {proposal.supporters}人の支持者
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 ml-6">
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">
                                  {(proposal.price * 100).toFixed(0)}%
                                </div>
                                {/* <div className="text-sm text-gray-500">
                                  確率 ({calculateOdds(proposal.price).toFixed(2)}x倍率)
                                </div> */}
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    const newSelection = { proposalId: proposal.id, type: 'yes' as const };
                                    setSelectedBuyButton(
                                      selectedBuyButton?.proposalId === proposal.id && selectedBuyButton?.type === 'yes'
                                        ? null
                                        : newSelection
                                    );
                                  }}
                                  className={`px-4 py-2 text-white rounded-lg font-medium text-sm transition-colors min-w-[100px] ${selectedBuyButton?.proposalId === proposal.id && selectedBuyButton?.type === 'yes'
                                      ? 'bg-green-500 hover:bg-green-600'
                                      : 'bg-green-300 hover:bg-green-400'
                                    }`}
                                >
                                  Buy Yes {((1 - proposal.price) * 100).toFixed(0)}¢
                                </button>
                                <button
                                  onClick={() => {
                                    const newSelection = { proposalId: proposal.id, type: 'no' as const };
                                    setSelectedBuyButton(
                                      selectedBuyButton?.proposalId === proposal.id && selectedBuyButton?.type === 'no'
                                        ? null
                                        : newSelection
                                    );
                                  }}
                                  className={`px-4 py-2 text-white rounded-lg font-medium text-sm transition-colors min-w-[100px] ${selectedBuyButton?.proposalId === proposal.id && selectedBuyButton?.type === 'no'
                                      ? 'bg-red-500 hover:bg-red-600'
                                      : 'bg-red-300 hover:bg-red-400'
                                    }`}
                                >
                                  Buy No {(proposal.price * 100).toFixed(0)}¢
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}


            {/* Market Overview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">市場概要</h2>
                  <p className="text-gray-600 leading-relaxed">
                    {marketData.kpiDescription}
                  </p>

                  {/* Market Timeline */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">市場スケジュール</h3>

                    {/* Timeline */}
                    <div className="relative">
                      {/* Timeline Line */}
                      <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-300">
                        <div
                          className="absolute left-0 h-full bg-green-500 transition-all duration-500"
                          style={{
                            width: (() => {
                              const now = new Date();
                              const start = new Date(marketData.createdAt);
                              // const deadline = new Date(marketData.deadline);
                              const resolutionDate = new Date(marketData.deadline);
                              resolutionDate.setDate(resolutionDate.getDate() + 90);

                              const totalDuration = resolutionDate.getTime() - start.getTime();
                              const elapsed = now.getTime() - start.getTime();
                              const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

                              return `${progress}%`;
                            })()
                          }}
                        ></div>
                      </div>

                      {/* Timeline Points */}
                      <div className="relative flex justify-between">
                        {/* Open */}
                        <div className="flex flex-col items-center cursor-pointer group" onClick={() => setSelectedPhase('open')}>
                          <div className="relative">
                            <div className={`w-6 h-6 rounded-full border-2 border-white shadow-sm transition-all duration-200 hover:scale-125 hover:shadow-lg ${
                              selectedPhase === 'open' ? 'scale-125 shadow-lg' : ''
                            } ${(() => {
                              const now = new Date();
                              const start = new Date(marketData.createdAt);
                              return now >= start ? 'bg-green-500' : 'bg-gray-300';
                            })()}`}>
                              {/* Pulsing animation */}
                              <div className={`absolute inset-0 rounded-full opacity-30 animate-ping ${
                                new Date() >= new Date(marketData.createdAt) ? 'bg-green-500' : 'bg-gray-300'
                              }`}></div>
                            </div>
                          </div>
                          <div className="mt-2 text-center">
                            <p className={`text-xs font-semibold transition-colors ${
                              selectedPhase === 'open'
                                ? 'text-green-700'
                                : new Date() >= new Date(marketData.createdAt)
                                  ? 'text-green-600 group-hover:text-green-700'
                                  : 'text-gray-600 group-hover:text-gray-700'
                            }`}>開始</p>
                            <p className="text-xs text-gray-600">{format(marketData.createdAt, 'M月d日', { locale: ja })}</p>
                          </div>
                        </div>

                        {/* Decision */}
                        <div className="flex flex-col items-center cursor-pointer group" onClick={() => setSelectedPhase('decision')}>
                          <div className="relative">
                            <div className={`w-6 h-6 rounded-full border-2 border-white shadow-sm transition-all duration-200 hover:scale-125 hover:shadow-lg ${
                              selectedPhase === 'decision' ? 'scale-125 shadow-lg' : ''
                            } ${(() => {
                              const now = new Date();
                              const deadline = new Date(marketData.deadline);
                              return now >= deadline ? 'bg-green-500' : 'bg-gray-300';
                            })()}`}>
                              {/* Pulsing animation */}
                              <div className={`absolute inset-0 rounded-full opacity-30 animate-ping ${
                                new Date() >= new Date(marketData.deadline) ? 'bg-green-500' : 'bg-gray-300'
                              }`}></div>
                            </div>
                          </div>
                          <div className="mt-2 text-center">
                            <p className={`text-xs font-semibold transition-colors ${
                              selectedPhase === 'decision'
                                ? 'text-green-700'
                                : new Date() >= new Date(marketData.deadline)
                                  ? 'text-green-600 group-hover:text-green-700'
                                  : 'text-gray-600 group-hover:text-gray-700'
                            }`}>決定</p>
                            <p className="text-xs text-gray-600">{format(marketData.deadline, 'M月d日', { locale: ja })}</p>
                          </div>
                        </div>

                        {/* Resolution */}
                        <div className="flex flex-col items-center cursor-pointer group" onClick={() => setSelectedPhase('resolution')}>
                          <div className="relative">
                            <div className={`w-6 h-6 rounded-full border-2 border-white shadow-sm transition-all duration-200 hover:scale-125 hover:shadow-lg ${
                              selectedPhase === 'resolution' ? 'scale-125 shadow-lg' : ''
                            } ${(() => {
                              const now = new Date();
                              const resolutionDate = new Date(marketData.deadline);
                              resolutionDate.setDate(resolutionDate.getDate() + 90);
                              return now >= resolutionDate ? 'bg-green-500' : 'bg-gray-300';
                            })()}`}>
                              {/* Pulsing animation */}
                              <div className={`absolute inset-0 rounded-full opacity-30 animate-ping ${
                                (() => {
                                  const now = new Date();
                                  const resolutionDate = new Date(marketData.deadline);
                                  resolutionDate.setDate(resolutionDate.getDate() + 90);
                                  return now >= resolutionDate ? 'bg-green-500' : 'bg-gray-300';
                                })()
                              }`}></div>
                            </div>
                          </div>
                          <div className="mt-2 text-center">
                            <p className={`text-xs font-semibold transition-colors ${
                              selectedPhase === 'resolution'
                                ? 'text-green-700'
                                : (() => {
                                    const now = new Date();
                                    const resolutionDate = new Date(marketData.deadline);
                                    resolutionDate.setDate(resolutionDate.getDate() + 90);
                                    return now >= resolutionDate
                                      ? 'text-green-600 group-hover:text-green-700'
                                      : 'text-gray-600 group-hover:text-gray-700';
                                  })()
                            }`}>解決</p>
                            <p className="text-xs text-gray-600">
                              {(() => {
                                const resolutionDate = new Date(marketData.deadline);
                                resolutionDate.setDate(resolutionDate.getDate() + 90); // 3 months after deadline
                                return format(resolutionDate, 'M月d日', { locale: ja });
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Period Labels */}
                      <div className="flex justify-between mt-4 text-xs">
                        <div className="flex-1 text-center">
                          <p className="font-medium text-gray-700">決定期間</p>
                        </div>
                        <div className="flex-1 text-center">
                          <p className="font-medium text-gray-700">評価期間</p>
                        </div>
                      </div>
                    </div>

                    {/* Phase Details */}
                    {selectedPhase && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="space-y-2">
                          {selectedPhase === 'open' && (
                            <>
                              <div>
                                <span className="font-semibold text-green-600">開始</span>
                                <span className="text-sm ml-2 text-gray-600">{format(marketData.createdAt, 'yyyy年M月d日', { locale: ja })}</span>
                              </div>
                              <p className="text-sm text-gray-700">
                                <strong>市場が開始されました。</strong>
                              </p>
                              <p className="text-sm text-gray-600">
                                参加者は各提案に対して予測を行い、トークンを売買できます。市場価格は参加者の集合知を反映し、リアルタイムで変動します。
                              </p>
                            </>
                          )}
                          {selectedPhase === 'decision' && (
                            <>
                              <div>
                                <span className="font-semibold text-green-600">決定</span>
                                <span className="text-sm ml-2 text-gray-600">{format(marketData.deadline, 'yyyy年M月d日', { locale: ja })}</span>
                              </div>
                              <p className="text-sm text-gray-700">
                                <strong>予測受付が終了します。</strong>
                              </p>
                              <p className="text-sm text-gray-600">
                                この日以降、新規の取引は停止され、各提案の最終価格が確定します。その後、実際の結果を待つ評価期間に入ります。
                              </p>
                            </>
                          )}
                          {selectedPhase === 'resolution' && (
                            <>
                              <div>
                                <span className="font-semibold text-green-600">解決</span>
                                <span className="text-sm ml-2 text-gray-600">
                                  {(() => {
                                    const resolutionDate = new Date(marketData.deadline);
                                    resolutionDate.setDate(resolutionDate.getDate() + 90);
                                    return format(resolutionDate, 'yyyy年M月d日', { locale: ja });
                                  })()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">
                                <strong>上位予測者が決定されます。</strong>
                              </p>
                              <p className="text-sm text-gray-600">
                                実際の結果（KPI達成度など）に基づいて市場が解決され、正しい予測をした参加者のトークンが1 PTで償還されます。
                              </p>
                              <p className="text-sm text-gray-600 mt-2">
                                予測の正確性とトークン保有量に応じて、上位予測者には追加報酬が配布されます。
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Oracle Information */}
                  <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">オラクル情報</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                          <span className="text-red-600 font-bold text-xs">UMA</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Resolver</p>
                          <a
                            href="https://example.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 font-mono hover:underline"
                          >
                            0x2F5e3684cb...
                          </a>
                        </div>
                      </div>
                      <button className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        Propose resolution
                      </button>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-600">
                        この市場は UMA Optimistic Oracle を使用して解決されます。
                      </p>
                    </div>
                  </div>


                  {/* Market Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center text-gray-400 mb-1">
                        <BanknotesIcon className="w-5 h-5" />
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {(marketData.totalVolume || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">取引量 (PT)</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center text-gray-400 mb-1">
                        <UserGroupIcon className="w-5 h-5" />
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {marketData.participants}
                      </div>
                      <div className="text-xs text-gray-500">参加者</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center text-gray-400 mb-1">
                        <ClockIcon className="w-5 h-5" />
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {format(marketData.deadline, 'MM/dd', { locale: ja })}
                      </div>
                      <div className="text-xs text-gray-500">終了日</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Trading Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  {/* <h2 className="text-lg font-semibold text-gray-900 mb-4">取引</h2> */}


                  {/* Trade Type Selection - Only for YES/NO markets */}
                  {!marketData.proposals && (
                    <div className="mb-4">
                      <div className="flex border-b border-gray-200">
                        <button
                          type="button"
                          onClick={() => setTradeType('buy')}
                          aria-pressed={tradeType === 'buy'}
                          className={`flex-1 pb-2 px-1 border-b-2 font-medium text-sm transition-colors
                            ${tradeType === 'buy'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                          購入
                        </button>
                        <button
                          type="button"
                          onClick={() => setTradeType('sell')}
                          aria-pressed={tradeType === 'sell'}
                          className={`flex-1 pb-2 px-1 border-b-2 font-medium text-sm transition-colors
                            ${tradeType === 'sell'
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                          売却
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Selected Proposal Display - Only for multi-option markets */}
                  {marketData.proposals && selectedBuyButton ? (
                    (() => {
                      const selectedProposal = marketData.proposals.find(p => p.id === selectedBuyButton.proposalId);
                      if (!selectedProposal) return null;
                      return (
                        <div className="rounded-lg">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {selectedProposal.name.charAt(0)}
                              </span>
                            </div>
                            <h3 className="font-semibold text-gray-900">{selectedProposal.name}</h3>
                          </div>
                          {/* Buy/Sell Toggle */}
                          {/*
                            計画:
                            - @file_context_0のカテゴリタブのUIを参考に、buy/sellトグルのデザインを統一します。
                            - 選択中はボーダーと色を強調し、未選択はグレーでホバー時に色が変わるようにします。
                            - 日本語表記（購入/売却）に変更します。
                            - アクセシビリティのためにaria-pressedを追加します。
                          */}
                          <div className="mb-4">
                            <div className="flex border-b border-gray-200">
                              <button
                                type="button"
                                onClick={() => setTradeType('buy')}
                                aria-pressed={tradeType === 'buy'}
                                className={`flex-1 pb-2 px-1 border-b-2 font-medium text-sm transition-colors
                                  ${tradeType === 'buy'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                  }`}
                              >
                                購入
                              </button>
                              <button
                                type="button"
                                onClick={() => setTradeType('sell')}
                                aria-pressed={tradeType === 'sell'}
                                className={`flex-1 pb-2 px-1 border-b-2 font-medium text-sm transition-colors
                                  ${tradeType === 'sell'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                  }`}
                              >
                                売却
                              </button>
                            </div>
                          </div>
                          {/* Yes/No Outcome Selector */}
                          <div className="mb-4">
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => setSelectedBuyButton(prev =>
                                  prev ? { ...prev, type: 'yes' } : null
                                )}
                                className={`p-3 rounded-lg transition-colors ${selectedBuyButton.type === 'yes'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                              >
                                <div className="text-sm font-medium">Yes</div>
                                <div className="text-lg font-bold">
                                  {((1 - selectedProposal.price) * 100).toFixed(0)}¢
                                </div>
                                <div className="text-xs text-gray-500">
                                  勝利時 +{(((1 / (1 - selectedProposal.price)) - 1) * 100).toFixed(0)}%
                                </div>
                              </button>
                              <button
                                onClick={() => setSelectedBuyButton(prev =>
                                  prev ? { ...prev, type: 'no' } : null
                                )}
                                className={`p-3 rounded-lg transition-colors ${selectedBuyButton.type === 'no'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                              >
                                <div className="text-sm font-medium">No</div>
                                <div className="text-lg font-bold">
                                  {(selectedProposal.price * 100).toFixed(0)}¢
                                </div>
                                <div className="text-xs text-gray-500">
                                  勝利時 +{(((1 / selectedProposal.price) - 1) * 100).toFixed(0)}%
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    // Fallback for YES/NO markets
                    <div className="mb-4">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setSelectedOutcome('yes')}
                          className={`p-3 rounded-lg transition-colors ${
                            selectedOutcome === 'yes'
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <div className="text-sm font-medium">Yes</div>
                          <div className="text-lg font-bold">
                            {(noPrice * 100).toFixed(0)}¢
                          </div>
                          <div className="text-xs text-gray-500">
                            勝利時 +{(((1 / (1 - noPrice)) - 1) * 100).toFixed(0)}%
                          </div>
                        </button>
                        <button
                          onClick={() => setSelectedOutcome('no')}
                          className={`p-3 rounded-lg transition-colors ${
                            selectedOutcome === 'no'
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <div className="text-sm font-medium">No</div>
                          <div className="text-lg font-bold">
                            {(yesPrice * 100).toFixed(0)}¢
                          </div>
                          <div className="text-xs text-gray-500">
                            勝利時 +{(((1 / yesPrice) - 1) * 100).toFixed(0)}%
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Amount Input - Only show when something is selected */}
                  {(selectedBuyButton || selectedOutcome) && (
                    <>
                      <div className="mb-4">
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                          Amount
                        </label>
                        <div className="text-xs text-gray-500 mb-2">Balance ${userBalance.toFixed(2)}</div>
                        <div className="relative">
                          <input
                            type="number"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="$0"
                            className="block w-full text-3xl font-bold text-gray-400 border-0 bg-transparent focus:ring-0 focus:outline-none"
                          />
                        </div>

                        {/* Quick Amount Buttons */}
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={() => setAmount('1')}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          >
                            +$1
                          </button>
                          <button
                            onClick={() => setAmount('20')}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          >
                            +$20
                          </button>
                          <button
                            onClick={() => setAmount('100')}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          >
                            +$100
                          </button>
                          <button
                            onClick={() => setAmount(userBalance.toFixed(2))}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          >
                            Max
                          </button>
                        </div>
                      </div>

                      {/* Trade Cost and Payout Info */}
                      {amount && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>支払い金額:</span>
                            <span>${amount}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>取得トークン:</span>
                            <span>
                              {selectedBuyButton
                                ? (() => {
                                    const selectedProposal = marketData.proposals?.find(p => p.id === selectedBuyButton.proposalId);
                                    const tokenPrice = selectedBuyButton.type === 'yes' ? (1 - (selectedProposal?.price || 0)) : (selectedProposal?.price || 0);
                                    return `${(parseFloat(amount) / tokenPrice).toFixed(2)} shares`;
                                  })()
                                : `${(parseFloat(amount) / (selectedOutcome === 'yes' ? yesPrice : noPrice)).toFixed(2)} shares`
                              }
                            </span>
                          </div>
                          <div className="flex justify-between text-sm font-medium text-gray-900">
                            <span>勝利時獲得:</span>
                            <span className="text-green-600">
                              {selectedBuyButton
                                ? (() => {
                                    const selectedProposal = marketData.proposals?.find(p => p.id === selectedBuyButton.proposalId);
                                    const tokenPrice = selectedBuyButton.type === 'yes' ? (1 - (selectedProposal?.price || 0)) : (selectedProposal?.price || 0);
                                    return `$${(parseFloat(amount) / tokenPrice).toFixed(2)}`;
                                  })()
                                : `$${(parseFloat(amount) / (selectedOutcome === 'yes' ? yesPrice : noPrice)).toFixed(2)}`
                              }
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Trade Button */}
                      <button
                        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg flex items-center justify-center space-x-2"
                        disabled={!amount || !account || isTrading}
                        onClick={handleBuyOutcome}
                      >
                        {isTrading ? (
                          <>
                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            <span>取引中...</span>
                          </>
                        ) : (
                          <span>
                            {selectedBuyButton
                              ? `Buy ${selectedBuyButton.type === 'yes' ? 'Yes' : 'No'}`
                              : `Buy ${selectedOutcome === 'yes' ? 'Yes' : 'No'}`
                            }
                          </span>
                        )}
                      </button>

                      {/* <div className="mt-4 text-xs text-gray-500 text-center">
                        By trading, you agree to the <span className="underline">Terms of Use</span>.
                      </div> */}
                    </>
                  )}


                  <div className="mt-4 text-xs text-gray-500">
                    <p>※ 取引手数料: 0.5%</p>
                    <p>※ 最低取引額: 10 PT</p>
                    <p>※ 勝利時は 1 PT で償還されます</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
