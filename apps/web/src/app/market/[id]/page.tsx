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
  Cell
} from 'recharts';

import { miraiMarkets, type Market } from '@/data/miraiMarkets';
import Header from '@/components/Header';
import WalletModal from '@/components/WalletModal';

// Helper function to get market data by ID
const getMarketById = (id: string) => {
  return miraiMarkets.find(market => market.id === id);
};

// Mock price history data
const mockPriceHistory = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const basePrice = 0.5 + (i / 30) * 0.15;
  const noise = (Math.random() - 0.5) * 0.1;
  const yesPrice = Math.max(0.01, Math.min(0.99, basePrice + noise));

  return {
    date: format(date, 'MM/dd'),
    yesPrice,
    noPrice: 1 - yesPrice
  };
});

export default function MarketDetailPage() {
  const params = useParams();
  const marketId = params.id as string;

  const [selectedProposal, setSelectedProposal] = useState<string>('');
  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no'>('yes');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // Get the actual market data
  const marketData = getMarketById(marketId);

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
                <h2 className="text-lg font-semibold text-gray-900 mb-4">価格推移</h2>
                <div className="h-64 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockPriceHistory}>
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
                        formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, '価格']}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="yesPrice"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        name="全体確率"
                      />
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

                  {/* Trade Type Selection */}
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

                  {/* Proposal Selection */}
                  {marketData.proposals ? (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        実装候補を選択
                      </label>
                      <div className="space-y-2">
                        {marketData.proposals.map((proposal, index) => {
                          const colors = [
                            { border: 'border-blue-500', bg: 'bg-blue-50', price: 'text-blue-600' },
                            { border: 'border-green-500', bg: 'bg-green-50', price: 'text-green-600' },
                            { border: 'border-purple-500', bg: 'bg-purple-50', price: 'text-purple-600' }
                          ];
                          const color = colors[index % 3];

                          return (
                            <button
                              key={proposal.id}
                              onClick={() => setSelectedProposal(proposal.id)}
                              className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                                selectedProposal === proposal.id
                                  ? `${color.border} ${color.bg}`
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{proposal.name}</p>
                                </div>
                                <div className="text-right">
                                  <p className={`text-lg font-bold ${color.price}`}>
                                    {(proposal.price * 100).toFixed(0)}%
                                  </p>
                                </div>
                              </div>
                            </button>
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
