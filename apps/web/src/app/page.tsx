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
  ArrowTrendingUpIcon,
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
                          <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />
                        ) : (
                          <ArrowTrendingUpIcon className="w-3 h-3 mr-1 rotate-180" />
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
              <SparklesIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                ウォレットが接続されました！
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  1,000 Play Token (PT) を無料で取得して予測市場に参加できます。
                  <Link href="/dashboard" className="font-medium underline hover:text-blue-600">
                    マイページ
                  </Link>
                  でトークンを請求してください。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-medium text-gray-900">
            {selectedCategory === 'all' ? 'すべての市場' : categories.find(c => c.id === selectedCategory)?.name}
          </h2>
          <span className="text-sm text-gray-500">
            {filteredAndSortedMarkets.length}件の市場
          </span>
        </div>
        
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            検索をクリア
          </button>
        )}
      </div>

      {/* Market Grid */}
      <div className={`grid gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
          : 'grid-cols-1'
      }`}>
        {filteredAndSortedMarkets.map((market) => (
          <Link key={market.id} href={`/market/${market.id}`}>
            <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      market.status === 'TRADING' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {market.status === 'TRADING' ? '取引中' : '終了'}
                    </span>
                    {market.featured && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <FireIcon className="w-3 h-3 mr-1" />
                        注目
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-600">
                      {(market.topPrice * 100).toFixed(0)}%
                    </span>
                    <div className={`text-xs flex items-center justify-end ${
                      market.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {market.change24h >= 0 ? (
                        <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />
                      ) : (
                        <ArrowTrendingUpIcon className="w-3 h-3 mr-1 rotate-180" />
                      )}
                      {Math.abs(market.change24h * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                  {market.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {market.kpiDescription}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {market.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                  {market.tags.length > 3 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                      +{market.tags.length - 3}
                    </span>
                  )}
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div>
                    <div className="flex items-center justify-center text-gray-400 mb-1">
                      <BanknotesIcon className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {market.totalVolume.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">取引量</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center text-gray-400 mb-1">
                      <UserGroupIcon className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {market.participants}
                    </div>
                    <div className="text-xs text-gray-500">参加者</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center text-gray-400 mb-1">
                      <ClockIcon className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {format(market.deadline, 'MM/dd', { locale: ja })}
                    </div>
                    <div className="text-xs text-gray-500">終了</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    流動性: {market.liquidity.toLocaleString()} PT
                  </span>
                  <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                    取引する
                  </button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedMarkets.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {searchQuery ? '検索結果が見つかりません' : '市場がありません'}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchQuery 
              ? `「${searchQuery}」に一致する市場が見つかりませんでした。`
              : '選択されたカテゴリには市場がありません。'
            }
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              すべての市場を表示
            </button>
          )}
        </div>
      )}

      {/* Platform Stats */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">プラットフォーム統計</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {mockMarkets.length}
            </div>
            <div className="text-sm text-gray-600">総市場数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {mockMarkets.filter(m => m.status === 'TRADING').length}
            </div>
            <div className="text-sm text-gray-600">アクティブ市場</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {mockMarkets.reduce((sum, m) => sum + m.totalVolume, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">総取引量 (PT)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {mockMarkets.reduce((sum, m) => sum + m.participants, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">総参加者数</div>
          </div>
        </div>
      </div>

      {/* Getting Started Section */}
      {!account && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Futarchy プラットフォームへようこそ
            </h2>
            <p className="text-gray-600">
              予測市場を通じて、社会課題の解決に参加しましょう
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xl">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">ウォレット接続</h3>
              <p className="text-sm text-gray-600">
                MetaMaskなどのウォレットを接続して開始
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-green-600 font-bold text-xl">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Play Token取得</h3>
              <p className="text-sm text-gray-600">
                無料で1,000 Play Tokenを取得して取引開始
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-purple-600 font-bold text-xl">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">予測投資</h3>
              <p className="text-sm text-gray-600">
                最適な解決策に投資して未来を予測
              </p>
            </div>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={connectWallet}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              今すぐ始める
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
