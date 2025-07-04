'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  FunnelIcon,
  ChevronDownIcon,
  FireIcon,
  TrendingUpIcon,
  ClockIcon,
  UserGroupIcon,
  BanknotesIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import '@/types/ethereum';

// Enhanced mock data for development
const mockMarkets = [
  {
    id: '1',
    title: '社会保障制度の捕捉率向上プロジェクト',
    kpiDescription: '社会保障制度の対象だが、抜け漏れている人たちの捕捉率を10%向上させることができるか？',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    status: 'TRADING' as const,
    category: 'social',
    totalVolume: 5240,
    numProposals: 3,
    participants: 156,
    topPrice: 0.65,
    change24h: 0.08,
    tags: ['社会保障', '格差是正', '政策', '効率化'],
    featured: true,
    liquidity: 8500
  },
  {
    id: '2',
    title: 'デジタル政府サービス効率化',
    kpiDescription: '行政手続きのデジタル化により、処理時間を30%短縮できるか？',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    status: 'TRADING' as const,
    category: 'government',
    totalVolume: 3840,
    numProposals: 5,
    participants: 89,
    topPrice: 0.42,
    change24h: -0.05,
    tags: ['デジタル化', '行政', 'DX', '効率化'],
    featured: false,
    liquidity: 6200
  },
  {
    id: '3',
    title: '教育格差是正プログラム',
    kpiDescription: '低所得世帯の子どもの学力向上により、格差指標を15%改善できるか？',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    status: 'CLOSED' as const,
    category: 'education',
    totalVolume: 8960,
    numProposals: 4,
    participants: 234,
    topPrice: 0.78,
    change24h: 0.12,
    tags: ['教育', '格差是正', '学力向上', '社会課題'],
    featured: true,
    liquidity: 4500
  },
  {
    id: '4',
    title: '環境エネルギー転換政策',
    kpiDescription: '再生可能エネルギーの導入により、CO2排出量を25%削減できるか？',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: 'TRADING' as const,
    category: 'environment',
    totalVolume: 12500,
    numProposals: 8,
    participants: 412,
    topPrice: 0.55,
    change24h: 0.15,
    tags: ['環境', 'エネルギー', '気候変動', '持続可能性'],
    featured: true,
    liquidity: 15200
  },
  {
    id: '5',
    title: 'スタートアップ支援プログラム',
    kpiDescription: '新規事業支援により、地域の雇用を20%増加させることができるか？',
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'TRADING' as const,
    category: 'business',
    totalVolume: 6750,
    numProposals: 6,
    participants: 178,
    topPrice: 0.38,
    change24h: -0.03,
    tags: ['起業支援', '雇用創出', '地域活性化', '経済'],
    featured: false,
    liquidity: 9800
  },
  {
    id: '6',
    title: '高齢者支援技術導入',
    kpiDescription: 'AIを活用した高齢者見守りシステムにより、事故を30%減少させることができるか？',
    deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    status: 'TRADING' as const,
    category: 'technology',
    totalVolume: 4320,
    numProposals: 2,
    participants: 95,
    topPrice: 0.71,
    change24h: 0.06,
    tags: ['AI', '高齢者支援', '安全', '技術'],
    featured: false,
    liquidity: 5600
  }
];

const categories = [
  { id: 'all', name: 'すべて', count: 6 },
  { id: 'social', name: '社会保障', count: 1 },
  { id: 'government', name: '行政効率', count: 1 },
  { id: 'education', name: '教育', count: 1 },
  { id: 'environment', name: '環境', count: 1 },
  { id: 'business', name: 'ビジネス', count: 1 },
  { id: 'technology', name: '技術', count: 1 },
];

export default function HomePage() {
  const [account, setAccount] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'volume' | 'trending' | 'ending'>('trending');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Simple MetaMask connection
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setAccount((accounts as string[])[0]);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    } else {
      alert('MetaMask not found. Please install MetaMask.');
    }
  };

  // Check if already connected
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts) => {
          const accountsArray = accounts as string[];
          if (accountsArray.length > 0) {
            setAccount(accountsArray[0]);
          }
        });
    }
  }, []);

  // Filter and sort markets
  const filteredAndSortedMarkets = useMemo(() => {
    let filtered = mockMarkets;

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(market => market.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(market => 
        market.title.toLowerCase().includes(query) ||
        market.kpiDescription.toLowerCase().includes(query) ||
        market.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'volume':
          return b.totalVolume - a.totalVolume;
        case 'trending':
          return Math.abs(b.change24h) - Math.abs(a.change24h);
        case 'ending':
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  }, [selectedCategory, searchQuery, sortBy]);

  // Featured markets for top section
  const featuredMarkets = mockMarkets.filter(market => market.featured);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            予測市場
          </h1>
          <p className="text-gray-600 mt-2">
            社会課題の解決策に投資して、より良い未来を予測しましょう
          </p>
        </div>
        {account ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
            <button
              onClick={() => setAccount(null)}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Connect Wallet
          </button>
        )}
      </div>

      {/* Featured Markets */}
      {featuredMarkets.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center mb-4">
            <FireIcon className="w-6 h-6 text-orange-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">注目の市場</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredMarkets.slice(0, 3).map((market) => (
              <Link key={market.id} href={`/market/${market.id}`}>
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      注目
                    </span>
                    <div className="text-right">
                      <span className="text-lg font-bold text-blue-600">
                        {(market.topPrice * 100).toFixed(0)}%
                      </span>
                      <div className={`text-xs flex items-center ${
                        market.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {market.change24h >= 0 ? (
                          <TrendingUpIcon className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingUpIcon className="w-3 h-3 mr-1 rotate-180" />
                        )}
                        {Math.abs(market.change24h * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                    {market.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{market.totalVolume.toLocaleString()} PT</span>
                    <span>{market.participants}人参加</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="市場を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Sort and View Controls */}
          <div className="flex items-center space-x-4">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="trending">トレンド順</option>
                <option value="newest">新着順</option>
                <option value="volume">取引量順</option>
                <option value="ending">終了間近順</option>
              </select>
              <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3 py-2 border rounded-lg text-sm font-medium ${
                showFilters 
                  ? 'border-blue-500 text-blue-600 bg-blue-50' 
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              フィルター
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                  <span className="ml-2 text-xs opacity-75">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Welcome Message for New Users */}
      {account && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                ウォレットが接続されました！
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  1,000 Play Token (PT) を無料で取得して予測市場に参加できます。
                  <a href="/dashboard" className="font-medium underline hover:text-blue-600">
                    マイページ
                  </a>
                  でトークンを請求してください。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedCategory === category.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {category.name}
              <span className="ml-2 py-0.5 px-2 text-xs rounded-full bg-gray-100 text-gray-900">
                {category.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Market Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMarkets.map((market) => (
          <div key={market.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  market.status === 'TRADING' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {market.status === 'TRADING' ? '取引中' : '終了'}
                </span>
                <span className="text-sm text-gray-500">
                  {market.deadline.toLocaleDateString('ja-JP')}
                </span>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {market.title}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                {market.kpiDescription}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>出来高: {market.totalVolume}</span>
                <span>提案数: {market.numProposals}</span>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-semibold text-blue-600">
                  {(market.topPrice * 100).toFixed(0)}%
                </span>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                  詳細を見る
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMarkets.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A9.971 9.971 0 0124 24c4.21 0 7.813 2.602 9.288 6.286" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">市場がありません</h3>
          <p className="mt-1 text-sm text-gray-500">選択されたカテゴリには市場がありません。</p>
        </div>
      )}

      {/* Getting Started Section */}
      {!account && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Futarchy プラットフォームへようこそ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-medium text-gray-900">ウォレット接続</h3>
              <p className="text-sm text-gray-500 mt-1">
                MetaMaskなどのウォレットを接続
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h3 className="font-medium text-gray-900">PT取得</h3>
              <p className="text-sm text-gray-500 mt-1">
                無料で1,000 Play Tokenを取得
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h3 className="font-medium text-gray-900">予測投資</h3>
              <p className="text-sm text-gray-500 mt-1">
                最適な解決策に投資して予測
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
