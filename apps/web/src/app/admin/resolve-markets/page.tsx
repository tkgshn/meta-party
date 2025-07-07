'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import Header from '@/components/Header';
import { useAccount } from 'wagmi';

interface ResolvableMarket {
  id: string;
  title: string;
  description: string;
  category: string;
  createdBy: string;
  createdAt: string;
  endDate: string;
  resolutionCriteria: string;
  options: Array<{
    id: string;
    name: string;
    currentPrice: number;
    totalVolume: number;
  }>;
  totalVolume: number;
  status: 'active' | 'ended' | 'resolved';
  canResolve: boolean;
  participantCount: number;
}

interface ResolutionData {
  marketId: string;
  winningOptionId: string;
  resolutionNotes: string;
  evidence?: string;
}

/**
 * 市場解決ページ
 * - 市場作成者が自分の市場を解決
 * - 解決基準に基づく客観的判定
 * - 証拠資料の提出
 */
export default function ResolveMarkets() {
  const { address: account, isConnected } = useAccount();
  const [markets, setMarkets] = useState<ResolvableMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<ResolvableMarket | null>(null);
  const [resolutionData, setResolutionData] = useState<ResolutionData>({
    marketId: '',
    winningOptionId: '',
    resolutionNotes: '',
    evidence: '',
  });

  // ホワイトリストされたアドレス
  const whitelistedAddress = '0x2c5329fFa2A1f02A241Ec1932b4358bf71e158ae';

  useEffect(() => {
    if (!account) {
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    const checkAuthorization = () => {
      const isWhitelisted = account.toLowerCase() === whitelistedAddress.toLowerCase();
      setIsAuthorized(isWhitelisted);
      setLoading(false);
    };

    checkAuthorization();
  }, [account]);

  useEffect(() => {
    const fetchMarkets = async () => {
      if (!isAuthorized) return;

      try {
        // Mock data - in production, this would fetch from APIs
        const mockMarkets: ResolvableMarket[] = [
          {
            id: 'market-1',
            title: '2030年カーボンニュートラル達成予測',
            description: '日本が2030年までにカーボンニュートラルを達成するかの予測市場',
            category: 'environment',
            createdBy: account,
            createdAt: '2025-06-15T10:00:00Z',
            endDate: '2025-07-15T23:59:59Z',
            resolutionCriteria: '環境省の公式発表および第三者機関による検証データに基づいて判定',
            options: [
              { id: 'option-1', name: '達成する', currentPrice: 0.35, totalVolume: 5420 },
              { id: 'option-2', name: '達成しない', currentPrice: 0.65, totalVolume: 8230 },
            ],
            totalVolume: 13650,
            status: 'ended',
            canResolve: true,
            participantCount: 28,
          },
          {
            id: 'market-2',
            title: 'デジタル政府サービス効率化プロジェクト',
            description: '行政手続きのデジタル化による効率向上の予測',
            category: 'government',
            createdBy: account,
            createdAt: '2025-06-20T14:30:00Z',
            endDate: '2025-08-01T23:59:59Z',
            resolutionCriteria: 'デジタル庁の効率化指標データおよび利用者満足度調査結果',
            options: [
              { id: 'option-3', name: '大幅改善（30%以上）', currentPrice: 0.22, totalVolume: 3100 },
              { id: 'option-4', name: '中程度改善（10-30%）', currentPrice: 0.58, totalVolume: 8200 },
              { id: 'option-5', name: '軽微改善（10%未満）', currentPrice: 0.20, totalVolume: 2800 },
            ],
            totalVolume: 14100,
            status: 'active',
            canResolve: false,
            participantCount: 34,
          },
        ];

        setMarkets(mockMarkets);
      } catch (err) {
        setError('市場データの取得に失敗しました');
        console.error('Market fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, [isAuthorized, account]);

  const handleResolveMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMarket || !resolutionData.winningOptionId || !resolutionData.resolutionNotes) {
      setError('すべての必須項目を入力してください');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const response = await fetch(`/api/markets/${selectedMarket.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(resolutionData),
      });

      if (response.ok) {
        setSuccess(`市場「${selectedMarket.title}」を正常に解決しました！`);
        
        // Update local state
        setMarkets(prev => 
          prev.map(market => 
            market.id === selectedMarket.id 
              ? { ...market, status: 'resolved' as const, canResolve: false }
              : market
          )
        );
        
        setSelectedMarket(null);
        setResolutionData({
          marketId: '',
          winningOptionId: '',
          resolutionNotes: '',
          evidence: '',
        });
      } else {
        const result = await response.json();
        throw new Error(result.message || '市場解決に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const openResolutionModal = (market: ResolvableMarket) => {
    setSelectedMarket(market);
    setResolutionData({
      marketId: market.id,
      winningOptionId: '',
      resolutionNotes: '',
      evidence: '',
    });
  };

  // 未接続時の表示
  if (!isConnected || !account) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                ウォレット接続が必要です
              </h2>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 認証中のローディング
  if (loading && markets.length === 0) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">市場データを読み込み中...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 権限がない場合の表示
  if (!isAuthorized) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                市場解決権限がありません
              </h2>
            </div>
          </div>
        </div>
      </>
    );
  }

  const resolvableMarkets = markets.filter(market => market.canResolve && market.status === 'ended');
  const activeMarkets = markets.filter(market => market.status === 'active');
  const resolvedMarkets = markets.filter(market => market.status === 'resolved');

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              管理ダッシュボードに戻る
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">市場解決</h1>
            <p className="mt-2 text-gray-600">
              自己解決型オラクル：市場作成者による客観的な市場解決
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800">{success}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">解決待ち</p>
                  <p className="text-2xl font-semibold text-gray-900">{resolvableMarkets.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">アクティブ</p>
                  <p className="text-2xl font-semibold text-gray-900">{activeMarkets.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">解決済み</p>
                  <p className="text-2xl font-semibold text-gray-900">{resolvedMarkets.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Resolvable Markets */}
          {resolvableMarkets.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">解決待ちの市場</h2>
              <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
                {resolvableMarkets.map((market) => (
                  <div key={market.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{market.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{market.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">解決基準</p>
                            <p className="text-sm text-gray-600">{market.resolutionCriteria}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">終了日時</p>
                            <p className="text-sm text-gray-600">
                              {new Date(market.endDate).toLocaleString('ja-JP')}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">選択肢と現在価格</p>
                          {market.options.map((option) => (
                            <div key={option.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                              <span className="text-sm text-gray-900">{option.name}</span>
                              <div className="text-right">
                                <span className="text-sm font-medium text-gray-900">{(option.currentPrice * 100).toFixed(1)}%</span>
                                <span className="text-xs text-gray-500 ml-2">{option.totalVolume.toLocaleString()} PT</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center mt-4 space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                            {market.totalVolume.toLocaleString()} PT総取引量
                          </div>
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            {market.participantCount}名参加
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-6">
                        <button
                          onClick={() => openResolutionModal(market)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          市場を解決
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Markets List */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">全市場一覧</h2>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      市場
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      カテゴリ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      総取引量
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      終了日
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ステータス
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {markets.map((market) => (
                    <tr key={market.id}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{market.title}</div>
                          <div className="text-sm text-gray-500">{market.participantCount}名参加</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {market.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {market.totalVolume.toLocaleString()} PT
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(market.endDate).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {market.status === 'active' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            アクティブ
                          </span>
                        )}
                        {market.status === 'ended' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            終了
                          </span>
                        )}
                        {market.status === 'resolved' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            解決済み
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resolution Modal */}
          {selectedMarket && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
                <h3 className="text-lg font-medium text-gray-900 mb-4">市場を解決</h3>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>{selectedMarket.title}</strong>
                </p>
                
                <form onSubmit={handleResolveMarket} className="space-y-4">
                  {/* Winning Option */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      勝利選択肢 *
                    </label>
                    <select
                      value={resolutionData.winningOptionId}
                      onChange={(e) => setResolutionData(prev => ({ ...prev, winningOptionId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">選択肢を選んでください</option>
                      {selectedMarket.options.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name} ({(option.currentPrice * 100).toFixed(1)}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Resolution Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      解決根拠 *
                    </label>
                    <textarea
                      value={resolutionData.resolutionNotes}
                      onChange={(e) => setResolutionData(prev => ({ ...prev, resolutionNotes: e.target.value }))}
                      placeholder="解決基準に基づいた客観的な判定根拠を記入してください..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Evidence */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      証拠資料 (任意)
                    </label>
                    <textarea
                      value={resolutionData.evidence}
                      onChange={(e) => setResolutionData(prev => ({ ...prev, evidence: e.target.value }))}
                      placeholder="参照したデータソース、URL、文書などを記載してください..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedMarket(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {loading ? '解決中...' : '市場を解決'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}