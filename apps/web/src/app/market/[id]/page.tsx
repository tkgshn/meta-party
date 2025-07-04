'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  ArrowLeftIcon,
  CalendarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  TrophyIcon,
  InformationCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  BanknotesIcon,
  WalletIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

import { miraiMarkets, type Market } from '@/data/miraiMarkets';
import Header from '@/components/Header';
import WalletModal from '@/components/WalletModal';

// Helper function to get market data by ID
const getMarketById = (id: string) => {
  return miraiMarkets.find(market => market.id === id);
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

    const dataPoint: any = {
      date: format(date, config.formatString, { locale: ja })
    };

    if (marketData.proposals) {
      // Multi-option market - generate dramatic price movement
      const rawPrices: number[] = [];
      const totalPoints = config.points;

      marketData.proposals.forEach((proposal, index) => {
        const trendFactor = (i / totalPoints); // 0 to 1 from past to present
        const currentPrice = proposal.price;

        let historicalPrice;

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
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [timeScope, setTimeScope] = useState<'1h' | '6h' | '1w' | '1m' | 'all'>('1w');

  // Get the actual market data
  const marketData = getMarketById(marketId);

  // Generate price history based on market data and time scope
  const priceHistory = useMemo(() => {
    if (!marketData) return [];
    return generatePriceHistory(marketData, timeScope);
  }, [marketData, timeScope]);

  // Initialize selected proposal
  useEffect(() => {
    if (marketData?.proposals && marketData.proposals.length > 0 && !selectedProposal) {
      setSelectedProposal(marketData.proposals[0].id);
    }
  }, [marketData, selectedProposal]);

  // If market not found, show error
  if (!marketData) {
    return (
      <>
        <Header/>
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
    <>
      <Header/>
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          市場一覧に戻る
        </Link>

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
                  {marketData.totalVolume.toLocaleString()} PT
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="ml-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                marketData.status === 'TRADING'
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
                        className={`px-3 py-1 text-sm font-medium transition-colors ${
                          timeScope === scope
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
                  <div className="space-y-3">
                    {marketData.proposals.map((proposal, index) => {
                      const colors = [
                        { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', price: 'text-blue-600' },
                        { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', price: 'text-green-600' },
                        { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', price: 'text-purple-600' }
                      ];
                      const color = colors[index % 3];
                      const odds = (1 / proposal.price).toFixed(2);

                      return (
                        <div key={proposal.id} className={`${color.bg} rounded-lg p-4 border ${color.border}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h3 className={`font-semibold ${color.text}`}>{proposal.name}</h3>
                                <span className={`text-xl font-bold ${color.price}`}>
                                  {(proposal.price * 100).toFixed(0)}%
                                </span>
                                <span className="text-sm text-gray-600">
                                  ({odds}倍)
                                </span>
                              </div>
                              <p className={`text-sm mt-1 ${color.text} opacity-80`}>{proposal.description}</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                                <span>取引量: {proposal.volume.toLocaleString()} PT</span>
                                <span>支持者: {proposal.supporters}人</span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className={`text-sm font-semibold ${proposal.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {proposal.change24h >= 0 ? (
                                  <span className="flex items-center">
                                    <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                                    +{(proposal.change24h * 100).toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="flex items-center">
                                    <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
                                    {(proposal.change24h * 100).toFixed(1)}%
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500">24時間変化</p>
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

                  {/* Market Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center text-gray-400 mb-1">
                        <BanknotesIcon className="w-5 h-5" />
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {marketData.totalVolume.toLocaleString()}
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
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">取引</h2>

                  {/* Deposit Button */}
                  {/* <button
                    onClick={() => {
                      console.log('Deposit button clicked!');
                      setIsWalletModalOpen(true);
                    }}
                    className="w-full mb-4 inline-flex justify-center items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-200 transition-colors"
                  >
                    <WalletIcon className="h-4 w-4 mr-2" />
                    デポジット
                  </button> */}

                  {/* Trade Type Selection - Only for YES/NO markets */}
                  {!marketData.proposals && (
                    <div className="mb-4">
                      <div className="flex rounded-lg shadow-sm">
                        <button
                          onClick={() => setTradeType('buy')}
                          className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg border ${
                            tradeType === 'buy'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          購入
                        </button>
                        <button
                          onClick={() => setTradeType('sell')}
                          className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg border-t border-r border-b ${
                            tradeType === 'sell'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          売却
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Proposal Selection - Only for multi-option markets */}
                  {marketData.proposals ? (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        取引する候補を選択
                      </label>
                      <div className="space-y-3">
                        {marketData.proposals.map((proposal, index) => {
                          const colors = [
                            { border: 'border-blue-500', bg: 'bg-blue-50', price: 'text-blue-600', buy: 'bg-blue-600', sell: 'bg-red-600' },
                            { border: 'border-green-500', bg: 'bg-green-50', price: 'text-green-600', buy: 'bg-green-600', sell: 'bg-red-600' },
                            { border: 'border-purple-500', bg: 'bg-purple-50', price: 'text-purple-600', buy: 'bg-purple-600', sell: 'bg-red-600' }
                          ];
                          const color = colors[index % 3];
                          const isSelected = selectedProposal === proposal.id;

                          return (
                            <div key={proposal.id} className={`rounded-lg border-2 transition-all ${
                              isSelected ? `${color.border} ${color.bg}` : 'border-gray-200 hover:border-gray-300'
                            }`}>
                              {/* Proposal Header */}
                              <div
                                className="p-3 cursor-pointer"
                                onClick={() => setSelectedProposal(isSelected ? '' : proposal.id)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <h3 className="font-medium text-gray-900 text-sm">{proposal.name}</h3>
                                      <span className={`text-lg font-bold ${color.price}`}>
                                        {(proposal.price * 100).toFixed(0)}%
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1">{proposal.description}</p>
                                  </div>
                                  <div className="text-right ml-3">
                                    <div className={`w-4 h-4 rounded-full border-2 ${
                                      isSelected ? `${color.border} bg-current` : 'border-gray-300'
                                    }`} />
                                  </div>
                                </div>
                              </div>

                              {/* Buy/Sell Buttons - Only show when selected */}
                              {isSelected && (
                                <div className="px-3 pb-3">
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      onClick={() => setTradeType('buy')}
                                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        tradeType === 'buy'
                                          ? `${color.buy} text-white`
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      }`}
                                    >
                                      買い
                                    </button>
                                    <button
                                      onClick={() => setTradeType('sell')}
                                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        tradeType === 'sell'
                                          ? `${color.sell} text-white`
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      }`}
                                    >
                                      売り
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    // Fallback for YES/NO markets
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        予測を選択
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setSelectedOutcome('yes')}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            selectedOutcome === 'yes'
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <p className="font-medium text-gray-900 text-sm">YES</p>
                          <p className="text-lg font-bold text-green-600">
                            {(yesPrice * 100).toFixed(0)}%
                          </p>
                        </button>
                        <button
                          onClick={() => setSelectedOutcome('no')}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            selectedOutcome === 'no'
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <p className="font-medium text-gray-900 text-sm">NO</p>
                          <p className="text-lg font-bold text-red-600">
                            {(noPrice * 100).toFixed(0)}%
                          </p>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Amount Input */}
                  <div className="mb-4">
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                      {tradeType === 'buy' ? '購入金額' : '売却数量'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="block w-full pr-12 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 sm:text-sm">PT</span>
                      </div>
                    </div>
                  </div>

                  {/* Expected Payout */}
                  {amount && selectedProposal && marketData.proposals && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">予想獲得数量</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {(() => {
                          const proposal = marketData.proposals.find(p => p.id === selectedProposal);
                          const expectedShares = proposal ? parseFloat(amount) / proposal.price : 0;
                          return expectedShares.toFixed(2);
                        })()} シェア
                      </div>
                    </div>
                  )}

                  {/* Trade Button */}
                  <button
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    disabled={!amount || (!selectedProposal && !selectedOutcome)}
                  >
                    {tradeType === 'buy' ? '購入' : '売却'}
                  </button>

                  <div className="mt-4 text-xs text-gray-500">
                    <p>※ 取引手数料: 0.5%</p>
                    <p>※ 最低取引額: 10 PT</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => {
          console.log('Closing wallet modal');
          setIsWalletModalOpen(false);
        }}
      />

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs">
          Modal open: {isWalletModalOpen ? 'true' : 'false'}
        </div>
      )}
    </>
  );
}
