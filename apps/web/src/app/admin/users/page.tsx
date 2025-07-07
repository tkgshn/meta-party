'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import Header from '@/components/Header';
import { useAccount } from 'wagmi';

interface User {
  id: string;
  walletAddress: string;
  twitterHandle?: string;
  roles: {
    isVolunteer: boolean;
    isMarketCreator: boolean;
    isAdmin: boolean;
  };
  joinedAt: string;
  lastActive: string;
  tokensEarned: number;
  marketsCreated?: number;
}

interface MarketCreator {
  id: string;
  walletAddress: string;
  profile: {
    name: string;
    organization: string;
  };
  permissions: {
    canCreateMarkets: boolean;
    canResolveMarkets: boolean;
    maxMarketsPerMonth: number;
    categories: string[];
  };
  status: 'active' | 'suspended';
  marketsCreated: number;
  marketsResolved: number;
}

/**
 * ユーザー管理ページ
 * - 管理者がユーザーの権限を管理
 * - ボランティア認定、市場作成権限の付与
 */
export default function UserManagement() {
  const { address: account, isConnected } = useAccount();
  const [users, setUsers] = useState<User[]>([]);
  const [marketCreators, setMarketCreators] = useState<MarketCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'creators'>('users');

  // ホワイトリストされたアドレス
  const whitelistedAddress = '0x2c5329fFa2A1f02A241Ec1932b4358bf71e158ae';

  useEffect(() => {
    if (!account) {
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    // 管理者権限の確認
    const checkAuthorization = () => {
      const isWhitelisted = account.toLowerCase() === whitelistedAddress.toLowerCase();
      setIsAuthorized(isWhitelisted);
      setLoading(false);
    };

    checkAuthorization();
  }, [account]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthorized) return;

      try {
        // Mock user data
        setUsers([
          {
            id: 'user-1',
            walletAddress: '0x2c5329fFa2A1f02A241Ec1932b4358bf71e158ae',
            twitterHandle: '@market_creator',
            roles: {
              isVolunteer: false,
              isMarketCreator: true,
              isAdmin: true,
            },
            joinedAt: '2025-01-01',
            lastActive: '2025-07-07',
            tokensEarned: 5000,
            marketsCreated: 2,
          },
          {
            id: 'user-2',
            walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
            twitterHandle: '@user123',
            roles: {
              isVolunteer: true,
              isMarketCreator: false,
              isAdmin: false,
            },
            joinedAt: '2025-02-15',
            lastActive: '2025-07-06',
            tokensEarned: 3000,
          },
          {
            id: 'user-3',
            walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
            twitterHandle: '@predictor456',
            roles: {
              isVolunteer: false,
              isMarketCreator: false,
              isAdmin: false,
            },
            joinedAt: '2025-03-20',
            lastActive: '2025-07-05',
            tokensEarned: 1500,
          },
        ]);

        // Fetch market creators
        const response = await fetch('/api/admin/market-creators', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setMarketCreators(data.marketCreators || []);
        }
      } catch (err) {
        setError('データの取得に失敗しました');
      }
    };

    fetchData();
  }, [isAuthorized]);

  const grantMarketCreatorPermission = async (walletAddress: string) => {
    try {
      const response = await fetch('/api/admin/market-creators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          walletAddress,
          permissions: {
            canCreateMarkets: true,
            canResolveMarkets: true,
            maxMarketsPerMonth: 10,
            categories: ['government', 'social', 'technology'],
          },
        }),
      });

      if (response.ok) {
        // Refresh data
        window.location.reload();
      } else {
        throw new Error('権限付与に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    }
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
              <p className="mt-2 text-gray-600">
                ユーザー管理機能にアクセスするには、ウォレットを接続してください。
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 認証中のローディング
  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">権限を確認しています...</p>
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
                アクセスが拒否されました
              </h2>
              <p className="mt-2 text-gray-600">
                管理者権限がありません。
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900">ユーザー管理</h1>
            <p className="mt-2 text-gray-600">
              ユーザーの権限管理、ボランティア認定、市場作成権限の付与
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'users'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <UserGroupIcon className="h-4 w-4 inline mr-1" />
                  全ユーザー ({users.length})
                </button>
                <button
                  onClick={() => setActiveTab('creators')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'creators'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <CogIcon className="h-4 w-4 inline mr-1" />
                  市場作成者 ({marketCreators.length})
                </button>
              </nav>
            </div>
          </div>

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">全ユーザー一覧</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ユーザー
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ロール
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        獲得トークン
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        最終アクティブ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        アクション
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.twitterHandle || 'No Twitter'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-1">
                            {user.roles.isAdmin && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                管理者
                              </span>
                            )}
                            {user.roles.isMarketCreator && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                市場作成者
                              </span>
                            )}
                            {user.roles.isVolunteer && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ボランティア
                              </span>
                            )}
                            {!user.roles.isAdmin && !user.roles.isMarketCreator && !user.roles.isVolunteer && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                一般ユーザー
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.tokensEarned.toLocaleString()} PT
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.lastActive).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {!user.roles.isMarketCreator && !user.roles.isAdmin && (
                            <button
                              onClick={() => grantMarketCreatorPermission(user.walletAddress)}
                              className="text-blue-600 hover:text-blue-900 flex items-center"
                            >
                              <PlusCircleIcon className="h-4 w-4 mr-1" />
                              市場作成権限を付与
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Market Creators Tab */}
          {activeTab === 'creators' && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">市場作成者一覧</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        作成者
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        権限
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        実績
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {marketCreators.map((creator) => (
                      <tr key={creator.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {creator.profile.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {creator.profile.organization}
                            </div>
                            <div className="text-xs text-gray-400">
                              {creator.walletAddress.slice(0, 6)}...{creator.walletAddress.slice(-4)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            月間上限: {creator.permissions.maxMarketsPerMonth}市場
                          </div>
                          <div className="text-xs text-gray-500">
                            カテゴリ: {creator.permissions.categories.length}種類
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>作成: {creator.marketsCreated}市場</div>
                          <div>解決: {creator.marketsResolved}市場</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {creator.status === 'active' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              アクティブ
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircleIcon className="h-3 w-3 mr-1" />
                              停止中
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
        </div>
      </div>
    </>
  );
}