'use client'

import { useState, useEffect } from 'react'
import { useMagicAuth } from '@/hooks/useMagicAuth'
import { getMagicDIDToken } from '@/lib/magic'
import { 
  GiftIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

interface ClaimStatus {
  canClaimBase: boolean
  canClaimBonus: boolean
  currentBalance: string
  claims: any
  roles: any
}

export default function MagicClaimInterface() {
  const { isAuthenticated, walletAddress, user, isLoading: authLoading } = useMagicAuth()
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  // Load claim status
  useEffect(() => {
    if (isAuthenticated && walletAddress) {
      loadClaimStatus()
    }
  }, [isAuthenticated, walletAddress])

  const loadClaimStatus = async () => {
    try {
      setIsLoading(true)
      setError('')

      const didToken = await getMagicDIDToken()
      if (!didToken) {
        throw new Error('認証トークンの取得に失敗しました')
      }

      const response = await fetch('/api/claim', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${didToken}`
        }
      })

      if (!response.ok) {
        throw new Error('クレーム状態の取得に失敗しました')
      }

      const data = await response.json()
      setClaimStatus(data)

    } catch (error) {
      console.error('Failed to load claim status:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaim = async (claimType: 'base_airdrop' | 'volunteer_bonus') => {
    try {
      setIsClaiming(true)
      setError('')
      setSuccess('')

      const didToken = await getMagicDIDToken()
      if (!didToken) {
        throw new Error('認証トークンの取得に失敗しました')
      }

      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${didToken}`
        },
        body: JSON.stringify({
          claimType,
          network: 'sepolia',
          walletAddress
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || result.error || 'クレームに失敗しました')
      }

      setSuccess(result.message)
      
      // Refresh claim status
      await loadClaimStatus()

    } catch (error) {
      console.error('Claim failed:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsClaiming(false)
    }
  }

  if (authLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <SparklesIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Magic Authでログイン</h3>
          <p className="text-gray-600 mb-4">
            Twitter認証だけでブロックチェーンウォレットを作成し、Play Tokenを受け取れます
          </p>
          <a
            href="/auth/twitter"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <SparklesIcon className="w-4 h-4 mr-2" />
            Magic認証で始める
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <SparklesIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Magic Wallet</h3>
            <p className="text-sm text-gray-600">
              {user?.email || 'Twitter連携ウォレット'}
            </p>
            <code className="text-xs text-gray-500 font-mono">
              {walletAddress?.slice(0, 10)}...{walletAddress?.slice(-8)}
            </code>
          </div>
          <div className="ml-auto">
            <div className="text-right">
              <div className="text-sm text-gray-600">残高</div>
              <div className="text-lg font-semibold text-gray-900">
                {isLoading ? '...' : (claimStatus?.currentBalance || '0')} PT
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-800">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <div>
              <div className="font-medium">エラー</div>
              <div className="text-sm mt-1">{error}</div>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-green-800">
            <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
            <div>
              <div className="font-medium">成功</div>
              <div className="text-sm mt-1">{success}</div>
            </div>
          </div>
        </div>
      )}

      {/* Claim Options */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Base Airdrop */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <GiftIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">ベースエアドロップ</h4>
              <p className="text-sm text-gray-600">1,000 PT</p>
            </div>
          </div>
          
          <p className="text-gray-600 mb-4">
            すべてのユーザーが受け取れる基本的なPlay Tokenです。
          </p>

          <button
            onClick={() => handleClaim('base_airdrop')}
            disabled={isClaiming || !claimStatus?.canClaimBase}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              claimStatus?.canClaimBase
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isClaiming ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-2"></div>
                クレーム中...
              </>
            ) : claimStatus?.claims?.baseAirdrop?.claimed ? (
              <>
                <CheckCircleIcon className="w-4 h-4 inline mr-2" />
                受け取り済み
              </>
            ) : (
              <>
                <CurrencyDollarIcon className="w-4 h-4 inline mr-2" />
                1,000 PT を受け取る
              </>
            )}
          </button>
        </div>

        {/* Volunteer Bonus */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <UserGroupIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">ボランティアボーナス</h4>
              <p className="text-sm text-gray-600">2,000 PT</p>
            </div>
          </div>
          
          <p className="text-gray-600 mb-4">
            ボランティア認定ユーザー向けの追加ボーナスです。
          </p>

          <button
            onClick={() => handleClaim('volunteer_bonus')}
            disabled={isClaiming || !claimStatus?.canClaimBonus}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              claimStatus?.canClaimBonus
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isClaiming ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-2"></div>
                クレーム中...
              </>
            ) : claimStatus?.claims?.volunteerBonus?.claimed ? (
              <>
                <CheckCircleIcon className="w-4 h-4 inline mr-2" />
                受け取り済み
              </>
            ) : !claimStatus?.roles?.isVolunteer ? (
              <>
                <ExclamationTriangleIcon className="w-4 h-4 inline mr-2" />
                ボランティア認定が必要
              </>
            ) : (
              <>
                <CurrencyDollarIcon className="w-4 h-4 inline mr-2" />
                2,000 PT を受け取る
              </>
            )}
          </button>
        </div>
      </div>

      {/* Gas Information for Magic */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Magic Walletの特徴</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• ガス代不要でPlay Tokenを受け取れます</li>
          <li>• シードフレーズの管理が不要です</li>
          <li>• セキュアなMPC技術を使用しています</li>
          <li>• Sepoliaテストネットで動作します</li>
        </ul>
      </div>
    </div>
  )
}