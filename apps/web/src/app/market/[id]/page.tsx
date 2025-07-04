'use client';

import { useState, useMemo } from 'react';
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
  BanknotesIcon
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
  Cell
} from 'recharts';

// Mock market data
const mockMarketData = {
  id: '1',
  title: '2025年のGDPは3%以上成長するか？',
  description: 'この市場は、2025年の日本のGDP成長率が3%以上になるかを予測します。政府の公式統計発表に基づいて判定されます。',
  status: 'active' as const,
  endDate: new Date('2025-12-31'),
  createdAt: new Date('2025-01-01'),
  creator: '0x1234...5678',
  totalVolume: 125000,
  participants: 342,
  liquidity: 85000,
  yesPrice: 0.65,
  noPrice: 0.35,
  resolved: false,
  outcome: null,
  category: '経済',
  resolutionCriteria: '2026年1月に発表される政府統計局の2025年GDP成長率確報値が3.0%以上の場合YES、それ以外の場合NO',
  tags: ['経済', 'GDP', '成長率', '日本']
};

// Mock price history data - single YES probability line
const mockPriceHistory = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const basePrice = 0.5 + (i / 30) * 0.15;
  const noise = (Math.random() - 0.5) * 0.1;
  const yesPrice = Math.max(0.01, Math.min(0.99, basePrice + noise));
  
  return {
    date: date.toISOString().split('T')[0],
    yesPrice: yesPrice * 100, // Convert to percentage for display
    volume: Math.floor(Math.random() * 10000) + 1000
  };
});

// Mock order book
const mockOrderBook = {
  yes: {
    buy: [
      { price: 0.64, amount: 1500, total: 960 },
      { price: 0.63, amount: 2000, total: 1260 },
      { price: 0.62, amount: 1800, total: 1116 },
      { price: 0.61, amount: 2500, total: 1525 },
      { price: 0.60, amount: 3000, total: 1800 }
    ],
    sell: [
      { price: 0.66, amount: 1200, total: 792 },
      { price: 0.67, amount: 1800, total: 1206 },
      { price: 0.68, amount: 2200, total: 1496 },
      { price: 0.69, amount: 2800, total: 1932 },
      { price: 0.70, amount: 3500, total: 2450 }
    ]
  }
};

// Mock recent trades
const mockRecentTrades = [
  { id: '1', type: 'buy', outcome: 'yes', amount: 500, price: 0.65, trader: '0xabcd...1234', time: new Date(Date.now() - 1000 * 60 * 5) },
  { id: '2', type: 'sell', outcome: 'no', amount: 300, price: 0.35, trader: '0xdefg...5678', time: new Date(Date.now() - 1000 * 60 * 12) },
  { id: '3', type: 'buy', outcome: 'no', amount: 800, price: 0.34, trader: '0xhijk...9012', time: new Date(Date.now() - 1000 * 60 * 23) },
  { id: '4', type: 'sell', outcome: 'yes', amount: 600, price: 0.66, trader: '0xlmno...3456', time: new Date(Date.now() - 1000 * 60 * 45) },
  { id: '5', type: 'buy', outcome: 'yes', amount: 1000, price: 0.64, trader: '0xpqrs...7890', time: new Date(Date.now() - 1000 * 60 * 67) }
];

// Tab types
type TabType = 'trade' | 'chart' | 'details' | 'history';

export default function MarketDetailPage() {
  const params = useParams();
  const marketId = params.id as string;
  
  const [activeTab, setActiveTab] = useState<TabType>('trade');
  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no'>('yes');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [chartPeriod, setChartPeriod] = useState<'1d' | '1w' | '1m' | 'all'>('1w');

  // Calculate estimated cost
  const estimatedCost = useMemo(() => {
    if (!amount || isNaN(Number(amount))) return 0;
    const price = selectedOutcome === 'yes' ? mockMarketData.yesPrice : mockMarketData.noPrice;
    return Math.floor(Number(amount) * price);
  }, [amount, selectedOutcome]);

  // Calculate potential return
  const potentialReturn = useMemo(() => {
    if (!amount || isNaN(Number(amount))) return 0;
    return Number(amount);
  }, [amount]);

  const handleTrade = () => {
    console.log('Trade:', { type: tradeType, outcome: selectedOutcome, amount, cost: estimatedCost });
    alert(`${tradeType === 'buy' ? '購入' : '売却'}注文: ${amount} ${selectedOutcome.toUpperCase()} @ ${estimatedCost} PT`);
  };

  const tabs = [
    { id: 'trade', label: '取引', icon: CurrencyDollarIcon },
    { id: 'chart', label: 'チャート', icon: ChartBarIcon },
    { id: 'details', label: '詳細', icon: InformationCircleIcon },
    { id: 'history', label: '履歴', icon: ClockIcon }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          市場一覧に戻る
        </Link>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {mockMarketData.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="inline-flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  {format(mockMarketData.endDate, 'yyyy年MM月dd日', { locale: ja })}まで
                </span>
                <span className="inline-flex items-center">
                  <UserGroupIcon className="w-4 h-4 mr-1" />
                  {mockMarketData.participants}人が参加
                </span>
                <span className="inline-flex items-center">
                  <BanknotesIcon className="w-4 h-4 mr-1" />
                  {mockMarketData.totalVolume.toLocaleString()} PT
                </span>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className="ml-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                アクティブ
              </span>
            </div>
          </div>

          {/* Current Prices with Pie Chart */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pie Chart Visualization */}
            <div className="md:col-span-1 flex items-center justify-center">
              <div className="relative">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'YES', value: mockMarketData.yesPrice, color: '#10b981' },
                        { name: 'NO', value: mockMarketData.noPrice, color: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      startAngle={90}
                      endAngle={450}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">現在の確率</p>
                    <p className="text-lg font-bold text-gray-900">
                      {mockMarketData.yesPrice > mockMarketData.noPrice ? 'YES' : 'NO'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Cards */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">YES</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(mockMarketData.yesPrice * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-green-600">
                      {mockMarketData.yesPrice > 0.5 ? (
                        <span className="flex items-center">
                          <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                          +2.3%
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
                          -1.2%
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">24時間</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-900">NO</p>
                    <p className="text-2xl font-bold text-red-600">
                      {(mockMarketData.noPrice * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-red-600">
                      {mockMarketData.noPrice > 0.5 ? (
                        <span className="flex items-center">
                          <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                          +1.2%
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
                          -2.3%
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">24時間</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`
                    flex-1 flex items-center justify-center py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Trade Tab */}
          {activeTab === 'trade' && (
            <div className="max-w-2xl mx-auto">
              {/* Trade Type Selection */}
              <div className="mb-6">
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

              {/* Outcome Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  予測を選択
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedOutcome('yes')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      selectedOutcome === 'yes'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <p className="font-medium text-gray-900">YES</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(mockMarketData.yesPrice * 100).toFixed(0)}%
                    </p>
                  </button>
                  <button
                    onClick={() => setSelectedOutcome('no')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      selectedOutcome === 'no'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <p className="font-medium text-gray-900">NO</p>
                    <p className="text-2xl font-bold text-red-600">
                      {(mockMarketData.noPrice * 100).toFixed(0)}%
                    </p>
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  {tradeType === 'buy' ? '購入数量' : '売却数量'}
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
                    <span className="text-gray-500 sm:text-sm">シェア</span>
                  </div>
                </div>
              </div>

              {/* Cost Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {tradeType === 'buy' ? '予想コスト' : '予想収益'}
                    </span>
                    <span className="font-medium text-gray-900">
                      {estimatedCost.toLocaleString()} PT
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">最大リターン</span>
                    <span className="font-medium text-gray-900">
                      {potentialReturn.toLocaleString()} PT
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">潜在的利益</span>
                    <span className="font-medium text-green-600">
                      +{Math.max(0, potentialReturn - estimatedCost).toLocaleString()} PT
                    </span>
                  </div>
                </div>
              </div>

              {/* Trade Button */}
              <button
                onClick={handleTrade}
                disabled={!amount || Number(amount) <= 0}
                className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tradeType === 'buy' 
                  ? `${selectedOutcome.toUpperCase()} を購入` 
                  : `${selectedOutcome.toUpperCase()} を売却`}
              </button>

              {/* Order Book */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">注文板</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-green-600 mb-2">買い注文</h4>
                    <div className="space-y-1">
                      {mockOrderBook.yes.buy.map((order, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="text-gray-600">{order.price}</span>
                          <span className="text-gray-900">{order.amount}</span>
                          <span className="text-gray-500">{order.total} PT</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-2">売り注文</h4>
                    <div className="space-y-1">
                      {mockOrderBook.yes.sell.map((order, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span className="text-gray-600">{order.price}</span>
                          <span className="text-gray-900">{order.amount}</span>
                          <span className="text-gray-500">{order.total} PT</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chart Tab */}
          {activeTab === 'chart' && (
            <div>
              {/* Period Selection */}
              <div className="flex justify-end mb-4">
                <div className="flex rounded-lg shadow-sm">
                  {(['1d', '1w', '1m', 'all'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setChartPeriod(period)}
                      className={`px-3 py-1 text-sm font-medium ${
                        chartPeriod === period
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      } ${
                        period === '1d' ? 'rounded-l-lg' : ''
                      } ${
                        period === 'all' ? 'rounded-r-lg' : ''
                      } border ${
                        chartPeriod === period ? 'border-blue-600' : 'border-gray-300'
                      }`}
                    >
                      {period === '1d' ? '1日' : 
                       period === '1w' ? '1週間' : 
                       period === '1m' ? '1ヶ月' : '全期間'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Probability Chart */}
              <div className="h-96 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">YES確率の推移</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">YES確率</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockPriceHistory}>
                    <defs>
                      <linearGradient id="yesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tickFormatter={(value) => `${value}%`}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'YES確率']}
                      labelFormatter={(label) => format(new Date(label), 'yyyy年MM月dd日')}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="yesPrice" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      fill="url(#yesGradient)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Volume Chart */}
              <div className="h-64">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">取引量</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">日次取引量</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockPriceHistory}>
                    <defs>
                      <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toLocaleString()} PT`, '取引量']}
                      labelFormatter={(label) => format(new Date(label), 'yyyy年MM月dd日')}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="volume" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fill="url(#volumeGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">市場の説明</h3>
                <p className="text-gray-600">{mockMarketData.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">解決基準</h3>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-blue-900">{mockMarketData.resolutionCriteria}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">市場情報</h3>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dt className="text-sm font-medium text-gray-500">カテゴリー</dt>
                    <dd className="mt-1 text-sm text-gray-900">{mockMarketData.category}</dd>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dt className="text-sm font-medium text-gray-500">作成者</dt>
                    <dd className="mt-1 text-sm font-mono text-gray-900">{mockMarketData.creator}</dd>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dt className="text-sm font-medium text-gray-500">流動性</dt>
                    <dd className="mt-1 text-sm text-gray-900">{mockMarketData.liquidity.toLocaleString()} PT</dd>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <dt className="text-sm font-medium text-gray-500">作成日</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {format(mockMarketData.createdAt, 'yyyy年MM月dd日', { locale: ja })}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">タグ</h3>
                <div className="flex flex-wrap gap-2">
                  {mockMarketData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">最近の取引</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        時刻
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        タイプ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        予測
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        数量
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        価格
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        トレーダー
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mockRecentTrades.map((trade) => (
                      <tr key={trade.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(trade.time, 'HH:mm:ss', { locale: ja })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${
                            trade.type === 'buy' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {trade.type === 'buy' ? '購入' : '売却'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={trade.outcome === 'yes' ? 'text-green-600' : 'text-red-600'}>
                            {trade.outcome.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {trade.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(trade.price * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                          {trade.trader}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}