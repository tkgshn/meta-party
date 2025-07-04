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
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import '@/types/ethereum';
import { miraiMarkets, type Market } from '@/data/miraiMarkets';
import Header from '@/components/Header';

const categories = [
  { id: 'all', name: 'すべて', count: 1 },
  { id: 'social', name: '社会保障', count: 1 },
  { id: 'government', name: '行政効率', count: 0 },
  { id: 'education', name: '教育', count: 0 },
  { id: 'environment', name: '環境', count: 0 },
  { id: 'business', name: 'ビジネス', count: 0 },
  { id: 'technology', name: '技術', count: 0 },
  { id: 'economy', name: '経済成長', count: 0 },
  { id: 'childcare', name: '子育て', count: 0 },
  { id: 'governance', name: 'ガバナンス', count: 0 },
  { id: 'integrity', name: '政治倫理', count: 0 },
];

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'volume' | 'trending' | 'ending'>('trending');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Handle search from Header component
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filter and sort markets
  const filteredAndSortedMarkets = useMemo(() => {
    let filtered = [...miraiMarkets];

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

    return sorted as Market[];
  }, [selectedCategory, searchQuery, sortBy]);

  return (
    <>
      <Header
        onSearch={handleSearch}
        searchQuery={searchQuery}
        showSearch={true}
      />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="space-y-8">
          {/* Header Section
      // <div className="flex justify-between items-center">
      //   <div>
      //     <h1 className="text-3xl font-bold text-gray-900">
      //       予測市場
      //     </h1>
      //     <p className="text-gray-600 mt-2">
      //       社会課題の解決策に投資して、より良い未来を予測しましょう
      //     </p>
      //   </div>
      // </div> */}

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
                  className={`inline-flex items-center px-3 py-2 border rounded-lg text-sm font-medium ${showFilters
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
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === category.id
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
          <div className={`grid gap-6 ${viewMode === 'grid'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1'
            }`}>
            {filteredAndSortedMarkets.map((market: Market) => (
              <Link key={market.id} href={`/market/${market.id}`}>
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200">
                  <div className="p-6">
                    {/* <div className="flex items-start justify-between mb-4">
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
                </div> */}
                    {/* Stats */}
                    <div className="flex items-center justify-end text-sm text-gray-500 mb-4">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      <span>{format(market.deadline, 'MM/dd', { locale: ja })} 終了</span>
                    </div>

                    <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                      {market.title}
                    </h3>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {market.kpiDescription}
                    </p>

                    {/* Proposals Preview or YES/NO */}
                    <div className="mb-4 min-h-32 flex items-center justify-center">
                      {Array.isArray(market.proposals) && market.proposals.length > 0 ? (
                        <div className="w-full max-h-48 overflow-y-auto space-y-2 pr-2">
                          {market.proposals.map((proposal: import('@/data/miraiMarkets').Proposal, index: number) => {
                            const colors = [
                              { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', price: 'text-blue-600' },
                              { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', price: 'text-green-600' },
                              { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', price: 'text-purple-600' },
                              { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', price: 'text-orange-600' },
                              { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', price: 'text-pink-600' }
                            ];
                            const color = colors[index % 5];

                            return (
                              <div key={proposal.id} className={`${color.bg} rounded-lg p-3 border ${color.border}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h4 className={`font-medium text-sm ${color.text}`}>
                                      {proposal.name}
                                    </h4>
                                  </div>
                                  <div className="text-right ml-3 flex-shrink-0">
                                    <div className={`text-lg font-bold ${color.price}`}>
                                      {(proposal.price * 100).toFixed(0)}%
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* YES/NO Pie Chart for binary markets */
                        <div className="flex items-center justify-between w-full">
                          {/* Pie Chart */}
                          <div className="relative w-20 h-20">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'YES', value: market.topPrice, color: '#10b981' },
                                    { name: 'NO', value: 1 - market.topPrice, color: '#ef4444' }
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={25}
                                  outerRadius={35}
                                  dataKey="value"
                                  startAngle={90}
                                  endAngle={450}
                                >
                                  <Cell fill="#10b981" />
                                  <Cell fill="#ef4444" />
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            {/* Center label */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-bold text-gray-700">
                                {(market.topPrice * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>

                          {/* YES/NO Labels */}
                          <div className="flex-1 ml-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-sm font-medium text-gray-900">YES</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-bold text-green-600">
                                  {(market.topPrice * 100).toFixed(0)}%
                                </span>
                                <span className={`text-xs flex items-center ${market.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                  {market.change24h >= 0 ? (
                                    <ArrowTrendingUpIcon className="w-3 h-3 mr-0.5" />
                                  ) : (
                                    <ArrowTrendingUpIcon className="w-3 h-3 mr-0.5 rotate-180" />
                                  )}
                                  {Math.abs(market.change24h * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-sm font-medium text-gray-900">NO</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-bold text-red-600">
                                  {((1 - market.topPrice) * 100).toFixed(0)}%
                                </span>
                                <span className={`text-xs flex items-center ${-market.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                  {-market.change24h >= 0 ? (
                                    <ArrowTrendingUpIcon className="w-3 h-3 mr-0.5" />
                                  ) : (
                                    <ArrowTrendingUpIcon className="w-3 h-3 mr-0.5 rotate-180" />
                                  )}
                                  {Math.abs(-market.change24h * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {/* <div className="flex flex-wrap gap-1 mb-4">
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
                </div> */}

                    {/* Stats */}
                    {/* <div className="grid grid-cols-3 gap-4 mb-4 text-center">
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
                </div> */}

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
          {/* <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">プラットフォーム統計</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {miraiMarkets.length}
            </div>
            <div className="text-sm text-gray-600">総市場数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {miraiMarkets.filter(m => m.status === 'TRADING').length}
            </div>
            <div className="text-sm text-gray-600">アクティブ市場</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {miraiMarkets.reduce((sum, m) => sum + m.totalVolume, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">総取引量 (PT)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {miraiMarkets.reduce((sum, m) => sum + m.participants, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">総参加者数</div>
          </div>
        </div>
      </div> */}

          {/* Getting Started Section */}
          {/* <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
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
          <p className="text-sm text-gray-500">
            右上の「ウォレット接続」ボタンから始めてください
          </p>
        </div>
      </div> */}
        </div>
      </main>
    </>
  );
}
