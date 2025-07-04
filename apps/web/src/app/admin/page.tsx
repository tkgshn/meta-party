'use client';

import { useState } from 'react';
import { 
  PlusIcon, 
  ChartBarIcon, 
  CogIcon,
  UserGroupIcon,
  BanknotesIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

// Tab types
type TabType = 'overview' | 'markets' | 'create' | 'analytics';

// Mock data for markets
const mockMarkets = [
  {
    id: '1',
    title: '2025年のGDPは3%以上成長するか？',
    status: 'active' as const,
    endDate: new Date('2025-12-31'),
    totalVolume: 125000,
    participants: 342,
    yesPrice: 0.65,
    noPrice: 0.35,
    resolved: false,
    outcome: null,
    createdAt: new Date('2025-01-01')
  },
  {
    id: '2',
    title: '新型AIが年内に発表されるか？',
    status: 'active' as const,
    endDate: new Date('2025-09-30'),
    totalVolume: 87500,
    participants: 156,
    yesPrice: 0.80,
    noPrice: 0.20,
    resolved: false,
    outcome: null,
    createdAt: new Date('2025-02-15')
  },
  {
    id: '3',
    title: '東京の平均気温が30℃を超える日が50日以上になるか？',
    status: 'closed' as const,
    endDate: new Date('2024-09-30'),
    totalVolume: 64000,
    participants: 89,
    yesPrice: 0.72,
    noPrice: 0.28,
    resolved: true,
    outcome: 'yes',
    createdAt: new Date('2024-06-01')
  }
];

// Stats overview
const statsOverview = {
  totalMarkets: 156,
  activeMarkets: 89,
  totalVolume: 4250000,
  totalUsers: 1234,
  avgAccuracy: 0.73,
  weeklyGrowth: 0.15
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [marketFormData, setMarketFormData] = useState({
    title: '',
    description: '',
    endDate: '',
    category: 'general',
    minBet: '10',
    maxBet: '10000'
  });

  const tabs = [
    { id: 'overview', label: '概要', icon: ChartBarIcon },
    { id: 'markets', label: '市場管理', icon: CogIcon },
    { id: 'create', label: '市場作成', icon: PlusIcon },
    { id: 'analytics', label: '分析', icon: ArrowTrendingUpIcon }
  ];

  const handleCreateMarket = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating market:', marketFormData);
    // TODO: Implement market creation
    alert('市場作成機能は実装予定です');
  };

  const handleResolveMarket = (marketId: string, outcome: 'yes' | 'no') => {
    console.log('Resolving market:', marketId, outcome);
    // TODO: Implement market resolution
    alert(`市場 ${marketId} を ${outcome === 'yes' ? 'YES' : 'NO'} で解決`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">管理者ダッシュボード</h1>
        <p className="mt-2 text-gray-600">予測市場の作成・管理・分析</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  flex items-center py-2 px-1 border-b-2 font-medium text-sm
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">総市場数</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    {statsOverview.totalMarkets}
                  </p>
                  <p className="mt-1 text-sm text-green-600">
                    +{Math.round(statsOverview.weeklyGrowth * 100)}% 今週
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <ChartBarIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">アクティブ市場</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    {statsOverview.activeMarkets}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    全体の {Math.round(statsOverview.activeMarkets / statsOverview.totalMarkets * 100)}%
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <SparklesIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">総取引量</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    {(statsOverview.totalVolume / 1000000).toFixed(1)}M PT
                  </p>
                  <p className="mt-1 text-sm text-green-600">
                    +23% 前月比
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <BanknotesIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">総ユーザー数</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    {statsOverview.totalUsers.toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-green-600">
                    +156 今週
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <UserGroupIcon className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">予測精度</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">
                    {Math.round(statsOverview.avgAccuracy * 100)}%
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    過去30日間
                  </p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-full">
                  <ArrowTrendingUpIcon className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">最近のアクティビティ</h3>
            </div>
            <div className="p-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  <li>
                    <div className="relative pb-8">
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                            <CheckCircleIcon className="h-5 w-5 text-white" />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-500">
                            市場「東京の平均気温」が <span className="font-medium text-gray-900">YES</span> で解決されました
                          </p>
                          <p className="mt-1 text-sm text-gray-500">2時間前</p>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="relative pb-8">
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <PlusIcon className="h-5 w-5 text-white" />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-500">
                            新しい市場「新型AIが年内に発表されるか？」が作成されました
                          </p>
                          <p className="mt-1 text-sm text-gray-500">5時間前</p>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="relative">
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center">
                            <UserGroupIcon className="h-5 w-5 text-white" />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-500">
                            100人の新規ユーザーが参加しました
                          </p>
                          <p className="mt-1 text-sm text-gray-500">昨日</p>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Markets Management Tab */}
      {activeTab === 'markets' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">市場一覧</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    市場
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    終了日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    取引量
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    現在価格
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockMarkets.map((market) => (
                  <tr key={market.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {market.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            作成日: {format(market.createdAt, 'yyyy/MM/dd', { locale: ja })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${
                        market.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : market.status === 'closed'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {market.status === 'active' ? 'アクティブ' : 
                         market.status === 'closed' ? 'クローズ' : 'ペンディング'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(market.endDate, 'yyyy/MM/dd', { locale: ja })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {market.totalVolume.toLocaleString()} PT
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-600">YES: {(market.yesPrice * 100).toFixed(0)}%</span>
                        <span className="text-red-600">NO: {(market.noPrice * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {market.status === 'active' && !market.resolved && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleResolveMarket(market.id, 'yes')}
                            className="text-green-600 hover:text-green-900"
                          >
                            YES解決
                          </button>
                          <button
                            onClick={() => handleResolveMarket(market.id, 'no')}
                            className="text-red-600 hover:text-red-900"
                          >
                            NO解決
                          </button>
                        </div>
                      )}
                      {market.resolved && (
                        <span className="text-gray-500">
                          解決済み: {market.outcome === 'yes' ? 'YES' : 'NO'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Market Tab */}
      {activeTab === 'create' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">新規市場作成</h3>
            <form onSubmit={handleCreateMarket} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  市場タイトル
                </label>
                <input
                  type="text"
                  id="title"
                  value={marketFormData.title}
                  onChange={(e) => setMarketFormData({ ...marketFormData, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="例: 2025年のGDPは3%以上成長するか？"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  詳細説明
                </label>
                <textarea
                  id="description"
                  value={marketFormData.description}
                  onChange={(e) => setMarketFormData({ ...marketFormData, description: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="市場の詳細な説明、判定基準などを記載してください"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    終了日時
                  </label>
                  <input
                    type="datetime-local"
                    id="endDate"
                    value={marketFormData.endDate}
                    onChange={(e) => setMarketFormData({ ...marketFormData, endDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    カテゴリー
                  </label>
                  <select
                    id="category"
                    value={marketFormData.category}
                    onChange={(e) => setMarketFormData({ ...marketFormData, category: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="general">一般</option>
                    <option value="economy">経済</option>
                    <option value="technology">技術</option>
                    <option value="politics">政治</option>
                    <option value="sports">スポーツ</option>
                    <option value="entertainment">エンタメ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="minBet" className="block text-sm font-medium text-gray-700">
                    最小ベット額 (PT)
                  </label>
                  <input
                    type="number"
                    id="minBet"
                    value={marketFormData.minBet}
                    onChange={(e) => setMarketFormData({ ...marketFormData, minBet: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="maxBet" className="block text-sm font-medium text-gray-700">
                    最大ベット額 (PT)
                  </label>
                  <input
                    type="number"
                    id="maxBet"
                    value={marketFormData.maxBet}
                    onChange={(e) => setMarketFormData({ ...marketFormData, maxBet: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">作成前の確認事項</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 市場の質問は明確で客観的に判定可能ですか？</li>
                  <li>• 終了日時は適切に設定されていますか？</li>
                  <li>• 判定基準は明確に記載されていますか？</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setMarketFormData({
                    title: '',
                    description: '',
                    endDate: '',
                    category: 'general',
                    minBet: '10',
                    maxBet: '10000'
                  })}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  市場を作成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">市場パフォーマンス分析</h3>
            <div className="text-center py-12 text-gray-500">
              <ArrowTrendingUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">詳細な分析機能は実装予定です</p>
              <p className="text-sm mt-1">チャート、トレンド分析、ユーザー行動分析など</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}