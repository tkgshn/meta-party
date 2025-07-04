'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  WalletIcon,
  BanknotesIcon,
  ChartBarIcon,
  TrophyIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  ClockIcon,
  EyeIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useMetaMask } from '@/hooks/useMetaMask';
import { usePlayToken } from '@/hooks/usePlayToken';
import { miraiMarkets } from '@/data/miraiMarkets';
import Header from '@/components/Header';

// Mock portfolio data - in real app this would come from API
const mockPortfolioData = {
  totalValue: 2847.50,
  totalShares: 156,
  activePositions: 8,
  realizedGains: 347.25,
  unrealizedGains: 92.80,
  totalGains: 440.05
};

// Mock positions data
const mockPositions = [
  {
    id: '1',
    marketId: 'social-security-optimization',
    marketTitle: '社会保障制度の最適化',
    proposalName: 'AI自動最適化システム',
    shares: 25,
    avgPrice: 0.45,
    currentPrice: 0.52,
    value: 13.00,
    gainLoss: 1.75,
    gainLossPercent: 15.56,
    status: 'OPEN'
  },
  {
    id: '2',
    marketId: 'governance-transparency',
    marketTitle: 'ガバナンス透明性向上',
    proposalName: 'ブロックチェーン投票システム',
    shares: 40,
    avgPrice: 0.38,
    currentPrice: 0.41,
    value: 16.40,
    gainLoss: 1.20,
    gainLossPercent: 7.89,
    status: 'OPEN'
  },
  {
    id: '3',
    marketId: 'education-reform',
    marketTitle: '教育システム改革',
    proposalName: 'オンライン学習プラットフォーム',
    shares: 15,
    avgPrice: 0.62,
    currentPrice: 0.58,
    value: 8.70,
    gainLoss: -0.60,
    gainLossPercent: -6.45,
    status: 'OPEN'
  }
];

// Mock transaction history
const mockTransactions = [
  {
    id: '1',
    type: 'BUY',
    marketTitle: '社会保障制度の最適化',
    proposalName: 'AI自動最適化システム',
    shares: 25,
    price: 0.45,
    total: 11.25,
    date: new Date('2024-07-01'),
    status: 'COMPLETED'
  },
  {
    id: '2',
    type: 'SELL',
    marketTitle: 'ガバナンス透明性向上',
    proposalName: 'ブロックチェーン投票システム',
    shares: 10,
    price: 0.41,
    total: 4.10,
    date: new Date('2024-06-28'),
    status: 'COMPLETED'
  }
];

// Mock portfolio performance data
const mockPerformanceData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const baseValue = 2500 + (i / 30) * 300;
  const noise = (Math.random() - 0.5) * 100;
  const value = Math.max(2000, baseValue + noise);

  return {
    date: format(date, 'MM/dd'),
    value: Math.round(value * 100) / 100,
    gains: Math.round((value - 2500) * 100) / 100
  };
});

export default function PortfolioPage() {
  const { account, isConnected } = useMetaMask();
  const { balance: playTokenBalance } = usePlayToken();
  const [selectedTab, setSelectedTab] = useState<'positions' | 'history' | 'analytics'>('positions');

  // Calculate portfolio summary based on Polymarket logic
  const portfolioSummary = useMemo(() => {
    // Cash = すぐに使えるPT残高（MetaMaskからデポジット済み分）
    const cash = parseFloat(playTokenBalance);

    // Portfolio positions = 保有しているポジションの時価評価額合計
    const positionsValue = mockPositions.reduce((sum, pos) => {
      // 各ポジションの価値 = シェア数 × 現在価格
      return sum + (pos.shares * pos.currentPrice);
    }, 0);

    // Portfolio = Cash + ポジション時価評価額
    const portfolioTotal = cash + positionsValue;

    // 損益計算（実現損益 + 含み損益）
    const unrealizedPnL = mockPositions.reduce((sum, pos) => sum + pos.gainLoss, 0);
    const realizedPnL = 0; // ここでは0として設定（実際には過去の取引履歴から計算）
    const totalPnL = unrealizedPnL + realizedPnL;

    // PnL率計算
    const totalCost = mockPositions.reduce((sum, pos) => sum + (pos.shares * pos.avgPrice), 0);
    const pnlPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    return {
      cash,                    // 現金（PT残高）
      positionsValue,          // ポジション時価評価額
      portfolioTotal,          // 総資産（Cash + Positions）
      unrealizedPnL,          // 含み損益
      realizedPnL,            // 実現損益
      totalPnL,               // 総損益
      pnlPercent,             // 損益率
      activePositions: mockPositions.filter(pos => pos.status === 'OPEN').length
    };
  }, [playTokenBalance]);

  if (!isConnected) {
    return (
      <>
        <Header/>
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="text-center py-12">
            <WalletIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ウォレット未接続</h2>
            <p className="text-gray-600 mb-6">
              ポートフォリオを表示するには、MetaMaskを接続してください。
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header/>
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ポートフォリオ</h1>
          <p className="text-gray-600">予測市場でのポジション管理と収益追跡</p>
        </div>


        {/* Main Portfolio and Cash Cards - Polymarket Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Portfolio Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Portfolio</p>
                <p className="text-3xl font-bold text-gray-900">
                  {portfolioSummary.portfolioTotal.toFixed(2)} PT
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Cash + ポジション時価評価額
                </p>
              </div>
              <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrophyIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Cash Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cash</p>
                <p className="text-3xl font-bold text-gray-900">
                  {portfolioSummary.cash.toFixed(2)} PT
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  今すぐ使えるPT残高
                </p>
              </div>
              <div className="h-16 w-16 bg-green-100 rounded-lg flex items-center justify-center">
                <BanknotesIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats Cards */}
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ポジション価値</p>
                <p className="text-2xl font-bold text-gray-900">
                  {portfolioSummary.positionsValue.toFixed(2)} PT
                </p>
                <p className="text-sm text-gray-500">時価評価額</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">含み損益</p>
                <p className={`text-2xl font-bold ${portfolioSummary.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioSummary.unrealizedPnL >= 0 ? '+' : ''}{portfolioSummary.unrealizedPnL.toFixed(2)} PT
                </p>
                <p className={`text-sm ${portfolioSummary.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ({portfolioSummary.unrealizedPnL >= 0 ? '+' : ''}{portfolioSummary.pnlPercent.toFixed(2)}%)
                </p>
              </div>
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                portfolioSummary.unrealizedPnL >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {portfolioSummary.unrealizedPnL >= 0 ? (
                  <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">アクティブポジション</p>
                <p className="text-2xl font-bold text-gray-900">{portfolioSummary.activePositions}</p>
                <p className="text-sm text-gray-500">開いているマーケット</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <EyeIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div> */}

        {/* Portfolio Performance Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ポートフォリオ推移</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockPerformanceData}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'positions', name: 'ポジション', icon: ChartBarIcon },
                { id: 'history', name: '取引履歴', icon: ClockIcon },
                { id: 'analytics', name: '分析', icon: TrophyIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {selectedTab === 'positions' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">現在のポジション</h3>
                {mockPositions.length > 0 ? (
                  <div className="space-y-4">
                    {mockPositions.map((position) => (
                      <div key={position.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Link href={`/market/${position.marketId}`} className="text-blue-600 hover:text-blue-500">
                              <h4 className="font-semibold text-gray-900">{position.marketTitle}</h4>
                            </Link>
                            <p className="text-sm text-gray-600 mt-1">{position.proposalName}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span>{position.shares} シェア</span>
                              <span>平均価格: {(position.avgPrice * 100).toFixed(0)}%</span>
                              <span>現在価格: {(position.currentPrice * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{position.value.toFixed(2)} PT</p>
                            <p className={`text-sm ${position.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {position.gainLoss >= 0 ? '+' : ''}{position.gainLoss.toFixed(2)} PT
                            </p>
                            <p className={`text-xs ${position.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ({position.gainLoss >= 0 ? '+' : ''}{position.gainLossPercent.toFixed(2)}%)
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">アクティブなポジションはありません</p>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'history' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">取引履歴</h3>
                {mockTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {mockTransactions.map((transaction) => (
                      <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                transaction.type === 'BUY'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {transaction.type === 'BUY' ? '購入' : '売却'}
                              </span>
                              <span className="text-sm text-gray-500">
                                {format(transaction.date, 'yyyy/MM/dd', { locale: ja })}
                              </span>
                            </div>
                            <h4 className="font-semibold text-gray-900 mt-1">{transaction.marketTitle}</h4>
                            <p className="text-sm text-gray-600">{transaction.proposalName}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{transaction.shares} シェア</p>
                            <p className="text-sm text-gray-600">@{(transaction.price * 100).toFixed(0)}%</p>
                            <p className="text-sm font-medium text-gray-900">{transaction.total.toFixed(2)} PT</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">取引履歴がありません</p>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'analytics' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">分析データ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">勝率</h4>
                    <p className="text-2xl font-bold text-green-600">67.3%</p>
                    <p className="text-sm text-gray-600">過去30日間</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">平均利益</h4>
                    <p className="text-2xl font-bold text-blue-600">+15.2%</p>
                    <p className="text-sm text-gray-600">ポジションあたり</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">最大利益</h4>
                    <p className="text-2xl font-bold text-green-600">+45.8 PT</p>
                    <p className="text-sm text-gray-600">単一ポジション</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">保有期間</h4>
                    <p className="text-2xl font-bold text-gray-900">12.4日</p>
                    <p className="text-sm text-gray-600">平均</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
