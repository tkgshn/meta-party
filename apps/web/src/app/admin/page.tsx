'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlusCircleIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Header from '@/components/Header';
import { useAccount } from 'wagmi';

interface AdminStats {
  totalMarkets: number;
  activeMarkets: number;
  totalUsers: number;
  totalVolume: number;
  marketCreators: number;
}

/**
 * 管理者ダッシュボード
 * - 市場作成権限を持つユーザーのためのダッシュボード
 * - 市場作成、ユーザー管理、統計表示
 */
export default function AdminDashboard() {
  const { address: account, isConnected } = useAccount();
  const [stats, setStats] = useState<AdminStats>({
    totalMarkets: 0,
    activeMarkets: 0,
    totalUsers: 0,
    totalVolume: 0,
    marketCreators: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

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
    const fetchStats = async () => {
      try {
        // Mock stats for now
        setStats({
          totalMarkets: 11,
          activeMarkets: 11,
          totalUsers: 142,
          totalVolume: 25780,
          marketCreators: 1,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    if (isAuthorized) {
      fetchStats();
    }
  }, [isAuthorized]);

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
                管理者ダッシュボードにアクセスするには、ウォレットを接続してください。
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
                管理者権限がありません。市場作成権限を持つアドレスでアクセスしてください。
              </p>
              <p className="mt-1 text-sm text-gray-500">
                現在のアドレス: {account.slice(0, 6)}...{account.slice(-4)}
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
            <h1 className="text-3xl font-bold text-gray-900">管理者ダッシュボード</h1>
            <p className="mt-2 text-gray-600">
              Futarchy 予測市場の管理・運営機能
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総市場数</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalMarkets}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <div className="h-4 w-4 bg-green-600 rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">アクティブ市場</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.activeMarkets}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <UserGroupIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総ユーザー数</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-yellow-600 font-bold">PT</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総取引量</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalVolume.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <CogIcon className="h-8 w-8 text-gray-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">市場作成者</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.marketCreators}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Create Market */}
            <Link href="/admin/create-market" className="block">
              <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer border-2 border-transparent hover:border-blue-200">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <PlusCircleIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="ml-4 text-lg font-semibold text-gray-900">市場を作成</h3>
                </div>
                <p className="text-gray-600">
                  新しい予測市場を作成し、コミュニティの意見を収集します。
                </p>
              </div>
            </Link>

            {/* Manage Users */}
            <Link href="/admin/users" className="block">
              <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer border-2 border-transparent hover:border-green-200">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <UserGroupIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="ml-4 text-lg font-semibold text-gray-900">ユーザー管理</h3>
                </div>
                <p className="text-gray-600">
                  ユーザーの権限管理、ボランティア認定、市場作成権限の付与を行います。
                </p>
              </div>
            </Link>

            {/* Analytics */}
            <Link href="/admin/analytics" className="block">
              <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer border-2 border-transparent hover:border-purple-200">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="ml-4 text-lg font-semibold text-gray-900">分析・統計</h3>
                </div>
                <p className="text-gray-600">
                  市場パフォーマンス、ユーザー活動、予測精度の詳細分析を確認します。
                </p>
              </div>
            </Link>
          </div>

          {/* Additional Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Resolve Markets */}
            <Link href="/admin/resolve-markets" className="block">
              <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer border-2 border-transparent hover:border-orange-200">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="ml-4 text-lg font-semibold text-gray-900">市場解決</h3>
                </div>
                <p className="text-gray-600">
                  自己解決型オラクル：終了した市場の結果を客観的基準に基づいて解決します。
                </p>
              </div>
            </Link>

            {/* Volunteer Management */}
            <Link href="/admin/volunteers" className="block">
              <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer border-2 border-transparent hover:border-indigo-200">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <UserGroupIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="ml-4 text-lg font-semibold text-gray-900">ボランティア管理</h3>
                </div>
                <p className="text-gray-600">
                  ボランティア申請の審査・承認とボーナストークンの配布管理を行います。
                </p>
              </div>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">最近の活動</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">2時間前</span>
                  <span className="text-sm text-gray-900">新しい市場「社会保障制度の捕捉率向上プロジェクト」が作成されました</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">5時間前</span>
                  <span className="text-sm text-gray-900">ユーザー 0x1234...abcd に市場作成権限が付与されました</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">1日前</span>
                  <span className="text-sm text-gray-900">市場「デジタル政府サービス効率化」で1,000 PTの取引が実行されました</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}