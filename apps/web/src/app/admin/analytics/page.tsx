'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Header from '@/components/Header';
import { useAccount } from 'wagmi';

interface AnalyticsData {
  userGrowth: Array<{ date: string; users: number; cumulative: number }>;
  tokenDistribution: Array<{ name: string; value: number; color: string }>;
  claimActivity: Array<{ date: string; base: number; volunteer: number }>;
  networkUsage: Array<{ network: string; users: number; volume: number }>;
  securityMetrics: {
    totalAttempts: number;
    successfulClaims: number;
    duplicatePrevented: number;
    successRate: number;
  };
  performanceMetrics: {
    avgClaimTime: number;
    uptime: number;
    errorRate: number;
  };
}

/**
 * 分析・統計ページ
 * - システム全体のパフォーマンス分析
 * - ユーザー行動の統計
 * - セキュリティメトリクス
 */
export default function Analytics() {
  const { address: account, isConnected } = useAccount();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

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
    const fetchAnalytics = async () => {
      if (!isAuthorized) return;

      try {
        // Mock analytics data - in production, this would fetch from APIs
        const mockData: AnalyticsData = {
          userGrowth: [
            { date: '2025-06-01', users: 15, cumulative: 15 },
            { date: '2025-06-08', users: 23, cumulative: 38 },
            { date: '2025-06-15', users: 31, cumulative: 69 },
            { date: '2025-06-22', users: 28, cumulative: 97 },
            { date: '2025-06-29', users: 24, cumulative: 121 },
            { date: '2025-07-06', users: 21, cumulative: 142 },
          ],
          tokenDistribution: [
            { name: 'Base Airdrop (1,000 PT)', value: 142000, color: '#3B82F6' },
            { name: 'Volunteer Bonus (2,000 PT)', value: 46000, color: '#10B981' },
            { name: 'Trading Volume', value: 25780, color: '#F59E0B' },
            { name: 'Reserved', value: 500000, color: '#6B7280' },
          ],
          claimActivity: [
            { date: '06/01', base: 15, volunteer: 3 },
            { date: '06/08', base: 23, volunteer: 5 },
            { date: '06/15', base: 31, volunteer: 8 },
            { date: '06/22', base: 28, volunteer: 6 },
            { date: '06/29', base: 24, volunteer: 4 },
            { date: '07/06', base: 21, volunteer: 2 },
          ],
          networkUsage: [
            { network: 'Sepolia', users: 89, volume: 15420 },
            { network: 'Polygon Amoy', users: 53, volume: 10360 },
          ],
          securityMetrics: {
            totalAttempts: 156,
            successfulClaims: 142,
            duplicatePrevented: 14,
            successRate: 91.0,
          },
          performanceMetrics: {
            avgClaimTime: 1.8,
            uptime: 99.7,
            errorRate: 0.9,
          },
        };

        setData(mockData);
      } catch (err) {
        setError('分析データの取得に失敗しました');
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [isAuthorized, timeRange]);

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
  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">分析データを読み込み中...</p>
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
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-gray-600">データが見つかりません</p>
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">分析・統計</h1>
                <p className="mt-2 text-gray-600">
                  システムパフォーマンスとユーザー行動の詳細分析
                </p>
              </div>
              <div>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="7d">過去7日間</option>
                  <option value="30d">過去30日間</option>
                  <option value="90d">過去90日間</option>
                </select>
              </div>
            </div>
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

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総ユーザー数</p>
                  <p className="text-2xl font-semibold text-gray-900">{data.userGrowth[data.userGrowth.length - 1]?.cumulative}</p>
                  <p className="text-xs text-green-600">+{data.userGrowth[data.userGrowth.length - 1]?.users} 今週</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">配布済みPT</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {(data.tokenDistribution[0].value + data.tokenDistribution[1].value).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600">Base + Volunteer</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">平均処理時間</p>
                  <p className="text-2xl font-semibold text-gray-900">{data.performanceMetrics.avgClaimTime}s</p>
                  <p className="text-xs text-green-600">Target: &lt;2s</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">成功率</p>
                  <p className="text-2xl font-semibold text-gray-900">{data.securityMetrics.successRate}%</p>
                  <p className="text-xs text-green-600">Duplicate Prevention</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* User Growth Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ユーザー成長率</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="users" fill="#3B82F6" name="新規ユーザー" />
                  <Area yAxisId="right" type="monotone" dataKey="cumulative" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="累計ユーザー" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Token Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">トークン配布状況</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.tokenDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.tokenDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [(value as number).toLocaleString() + ' PT']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Claim Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">クレーム活動</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.claimActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="base" stackId="a" fill="#3B82F6" name="Base Airdrop" />
                  <Bar dataKey="volunteer" stackId="a" fill="#10B981" name="Volunteer Bonus" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Network Usage */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ネットワーク使用状況</h3>
              <div className="space-y-4">
                {data.networkUsage.map((network, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <GlobeAltIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{network.network}</p>
                        <p className="text-sm text-gray-600">{network.users} ユーザー</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{network.volume.toLocaleString()} PT</p>
                      <p className="text-sm text-gray-600">取引量</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Security & Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">セキュリティメトリクス</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">総試行回数</span>
                  <span className="font-semibold text-gray-900">{data.securityMetrics.totalAttempts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">成功クレーム</span>
                  <span className="font-semibold text-green-600">{data.securityMetrics.successfulClaims}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">重複防止</span>
                  <span className="font-semibold text-red-600">{data.securityMetrics.duplicatePrevented}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">成功率</span>
                  <span className="font-semibold text-blue-600">{data.securityMetrics.successRate}%</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">パフォーマンスメトリクス</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">平均クレーム時間</span>
                  <span className="font-semibold text-blue-600">{data.performanceMetrics.avgClaimTime}s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">システム稼働率</span>
                  <span className="font-semibold text-green-600">{data.performanceMetrics.uptime}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">エラー率</span>
                  <span className="font-semibold text-yellow-600">{data.performanceMetrics.errorRate}%</span>
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    🎯 すべてのメトリクスが目標値を達成しています
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}