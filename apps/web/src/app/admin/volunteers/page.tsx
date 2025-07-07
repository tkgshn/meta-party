'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusCircleIcon,
  UserIcon,
  ClockIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import Header from '@/components/Header';
import { useAccount } from 'wagmi';

interface VolunteerApplication {
  id: string;
  walletAddress: string;
  twitterHandle: string;
  displayName: string;
  bio: string;
  motivation: string;
  experience: string;
  appliedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  tokensEarned?: number;
}

interface ApprovedVolunteer {
  id: string;
  walletAddress: string;
  twitterHandle: string;
  displayName: string;
  approvedAt: string;
  approvedBy: string;
  tokensEarned: number;
  contributionScore: number;
  lastActivity: string;
  status: 'active' | 'suspended';
}

/**
 * ボランティア管理ページ
 * - ボランティア申請の承認・拒否
 * - 既存ボランティアの管理
 * - ボーナス配布の管理
 */
export default function VolunteerManagement() {
  const { address: account, isConnected } = useAccount();
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [approvedVolunteers, setApprovedVolunteers] = useState<ApprovedVolunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'applications' | 'volunteers'>('applications');
  const [selectedApplication, setSelectedApplication] = useState<VolunteerApplication | null>(null);

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
    const fetchData = async () => {
      if (!isAuthorized) return;

      try {
        // Mock data - in production, this would fetch from APIs
        setApplications([
          {
            id: 'app-1',
            walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
            twitterHandle: '@contributor123',
            displayName: 'Alice Johnson',
            bio: 'Web3 developer passionate about governance',
            motivation: 'I want to contribute to building better prediction markets for social good.',
            experience: '3 years in DeFi, previously worked on DAO governance tools',
            appliedAt: '2025-07-05T10:30:00Z',
            status: 'pending',
          },
          {
            id: 'app-2',
            walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
            twitterHandle: '@predictor456',
            displayName: 'Bob Smith',
            bio: 'Researcher in political forecasting',
            motivation: 'I have expertise in prediction markets and want to help improve accuracy.',
            experience: 'PhD in Political Science, 5 years using prediction markets',
            appliedAt: '2025-07-04T15:45:00Z',
            status: 'pending',
          },
        ]);

        setApprovedVolunteers([
          {
            id: 'vol-1',
            walletAddress: '0x9876543210fedcba9876543210fedcba98765432',
            twitterHandle: '@volunteer001',
            displayName: 'Charlie Wilson',
            approvedAt: '2025-06-15T12:00:00Z',
            approvedBy: account,
            tokensEarned: 2000,
            contributionScore: 95,
            lastActivity: '2025-07-06T18:30:00Z',
            status: 'active',
          },
          {
            id: 'vol-2',
            walletAddress: '0xfedcba9876543210fedcba9876543210fedcba98',
            twitterHandle: '@helper789',
            displayName: 'Diana Lee',
            approvedAt: '2025-06-20T09:15:00Z',
            approvedBy: account,
            tokensEarned: 2000,
            contributionScore: 88,
            lastActivity: '2025-07-05T14:20:00Z',
            status: 'active',
          },
        ]);
      } catch (err) {
        setError('データの取得に失敗しました');
        console.error('Volunteer data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthorized, account]);

  const handleApproveApplication = async (applicationId: string) => {
    try {
      setError(null);
      
      // Mock API call - in production, this would call /api/admin/volunteers
      const response = await fetch('/api/admin/volunteers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'approve',
          applicationId,
        }),
      });

      if (response.ok) {
        setSuccess('ボランティア申請を承認しました！');
        // Update local state
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId 
              ? { ...app, status: 'approved' as const, reviewedAt: new Date().toISOString(), reviewedBy: account }
              : app
          )
        );
      } else {
        throw new Error('承認に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    }
  };

  const handleRejectApplication = async (applicationId: string, notes: string) => {
    try {
      setError(null);
      
      // Mock API call
      const response = await fetch('/api/admin/volunteers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'reject',
          applicationId,
          notes,
        }),
      });

      if (response.ok) {
        setSuccess('申請を拒否しました。');
        // Update local state
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId 
              ? { ...app, status: 'rejected' as const, reviewedAt: new Date().toISOString(), reviewedBy: account, reviewNotes: notes }
              : app
          )
        );
        setSelectedApplication(null);
      } else {
        throw new Error('拒否処理に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    }
  };

  const suspendVolunteer = async (volunteerId: string) => {
    try {
      setError(null);
      
      // Mock API call
      const response = await fetch('/api/admin/volunteers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          action: 'suspend',
          volunteerId,
        }),
      });

      if (response.ok) {
        setSuccess('ボランティアを一時停止しました。');
        setApprovedVolunteers(prev => 
          prev.map(vol => 
            vol.id === volunteerId 
              ? { ...vol, status: 'suspended' as const }
              : vol
          )
        );
      } else {
        throw new Error('停止処理に失敗しました');
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
              <p className="mt-4 text-gray-600">ボランティアデータを読み込み中...</p>
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

  const pendingApplications = applications.filter(app => app.status === 'pending');

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
            <h1 className="text-3xl font-bold text-gray-900">ボランティア管理</h1>
            <p className="mt-2 text-gray-600">
              ボランティア申請の審査と承認済みボランティアの管理
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
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">申請待ち</p>
                  <p className="text-2xl font-semibold text-gray-900">{pendingApplications.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShieldCheckIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">承認済み</p>
                  <p className="text-2xl font-semibold text-gray-900">{approvedVolunteers.filter(v => v.status === 'active').length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <PlusCircleIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">配布済みボーナス</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {(approvedVolunteers.reduce((sum, vol) => sum + vol.tokensEarned, 0)).toLocaleString()} PT
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'applications'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  申請一覧 ({pendingApplications.length})
                </button>
                <button
                  onClick={() => setActiveTab('volunteers')}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'volunteers'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  承認済みボランティア ({approvedVolunteers.length})
                </button>
              </nav>
            </div>
          </div>

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">ボランティア申請</h2>
              </div>
              {pendingApplications.length === 0 ? (
                <div className="p-6 text-center">
                  <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">申請はありません</h3>
                  <p className="mt-2 text-gray-600">新しいボランティア申請をお待ちください。</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {pendingApplications.map((application) => (
                    <div key={application.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{application.displayName}</h3>
                              <p className="text-sm text-gray-600">{application.twitterHandle}</p>
                              <p className="text-xs text-gray-500">
                                {application.walletAddress.slice(0, 6)}...{application.walletAddress.slice(-4)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-gray-700">自己紹介</p>
                              <p className="text-sm text-gray-600">{application.bio}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-700">志望動機</p>
                              <p className="text-sm text-gray-600">{application.motivation}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-700">経験・スキル</p>
                              <p className="text-sm text-gray-600">{application.experience}</p>
                            </div>
                            
                            <p className="text-xs text-gray-500">
                              申請日時: {new Date(application.appliedAt).toLocaleString('ja-JP')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="ml-6 flex flex-col space-y-2">
                          <button
                            onClick={() => handleApproveApplication(application.id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            承認
                          </button>
                          
                          <button
                            onClick={() => setSelectedApplication(application)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            拒否
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Volunteers Tab */}
          {activeTab === 'volunteers' && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">承認済みボランティア</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ボランティア
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        貢献スコア
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        獲得トークン
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        最終活動
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ステータス
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        アクション
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {approvedVolunteers.map((volunteer) => (
                      <tr key={volunteer.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{volunteer.displayName}</div>
                              <div className="text-sm text-gray-500">{volunteer.twitterHandle}</div>
                              <div className="text-xs text-gray-400">
                                {volunteer.walletAddress.slice(0, 6)}...{volunteer.walletAddress.slice(-4)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{volunteer.contributionScore}/100</div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${volunteer.contributionScore}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {volunteer.tokensEarned.toLocaleString()} PT
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(volunteer.lastActivity).toLocaleDateString('ja-JP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {volunteer.status === 'active' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              アクティブ
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              停止中
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {volunteer.status === 'active' && (
                            <button
                              onClick={() => suspendVolunteer(volunteer.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              一時停止
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

          {/* Rejection Modal */}
          {selectedApplication && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-75">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">申請を拒否</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {selectedApplication.displayName} さんの申請を拒否しますか？
                </p>
                <textarea
                  placeholder="拒否理由を入力してください（任意）"
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none"
                  id="rejection-notes"
                />
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => {
                      const notes = (document.getElementById('rejection-notes') as HTMLTextAreaElement)?.value || '';
                      handleRejectApplication(selectedApplication.id, notes);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700"
                  >
                    拒否する
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}