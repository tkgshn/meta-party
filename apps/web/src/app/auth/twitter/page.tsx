'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authenticateWithTwitterMagic } from '@/lib/magic'
import { connectWithTwitter } from '@/lib/reown'
import { 
  UserIcon, 
  ShieldCheckIcon,
  WalletIcon,
  SparklesIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'

export default function TwitterAuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<'magic' | 'reown' | null>(null)
  const [error, setError] = useState<string>('')
  const router = useRouter()

  const handleMagicAuth = async () => {
    try {
      setIsLoading(true)
      setError('')
      await authenticateWithTwitterMagic()
      // Redirect happens automatically in Magic SDK
    } catch (error) {
      console.error('Magic authentication failed:', error)
      setError(error instanceof Error ? error.message : 'Magic認証に失敗しました')
      setIsLoading(false)
    }
  }

  const handleReownAuth = async () => {
    try {
      setIsLoading(true)
      setError('')
      await connectWithTwitter()
      // Redirect happens automatically in Reown SDK
    } catch (error) {
      console.error('Reown authentication failed:', error)
      setError(error instanceof Error ? error.message : 'Reown認証に失敗しました')
      setIsLoading(false)
    }
  }

  const authMethods = [
    {
      id: 'magic' as const,
      name: 'Magic Link (推奨)',
      description: 'ガス代不要のスマートウォレットを自動作成',
      icon: SparklesIcon,
      features: [
        'Twitter認証のみでウォレット作成',
        'ガス代なしでPlay Token受け取り',
        'シードフレーズ管理不要',
        'モバイルでも簡単アクセス'
      ],
      badge: '推奨',
      badgeColor: 'bg-green-100 text-green-800',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      action: handleMagicAuth
    },
    {
      id: 'reown' as const,
      name: 'MetaMask連携',
      description: '既存のMetaMaskウォレットとTwitterを連携',
      icon: WalletIcon,
      features: [
        '既存ウォレットを使用',
        'Sepolia ETHが必要（ガス代）',
        'フル機能のウォレット',
        'DeFiエコシステム対応'
      ],
      badge: '上級者向け',
      badgeColor: 'bg-yellow-100 text-yellow-800',
      buttonColor: 'bg-gray-600 hover:bg-gray-700',
      action: handleReownAuth
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <UserIcon className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Futarchy Platform
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Twitter認証でPlay Tokenを受け取り、予測市場に参加しましょう
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
            <ShieldCheckIcon className="w-4 h-4" />
            <span>セキュアなブロックチェーン認証</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {authMethods.map((method) => (
            <div
              key={method.id}
              className={`relative border-2 rounded-2xl p-6 transition-all cursor-pointer hover:shadow-lg ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedMethod(method.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <method.icon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{method.name}</h3>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${method.badgeColor}`}>
                  {method.badge}
                </span>
              </div>

              <ul className="space-y-2 mb-4">
                {method.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedMethod(method.id)
                  method.action()
                }}
                disabled={isLoading}
                className={`w-full px-4 py-3 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${method.buttonColor}`}
              >
                {isLoading && selectedMethod === method.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>認証中...</span>
                  </>
                ) : (
                  <>
                    <span>{method.name}で始める</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-red-800">
              <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="font-medium">認証エラー</div>
                <div className="text-sm mt-1">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 mb-3">🎯 Play Token Airdrop & Futarchy PoC</h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <div className="font-medium text-gray-900 mb-1">1. Twitter認証</div>
              <p>Twitterアカウントでログインし、ブロックチェーンウォレットを取得</p>
            </div>
            <div>
              <div className="font-medium text-gray-900 mb-1">2. Play Token受け取り</div>
              <p>1,000 PT（Play Token）を無料で受け取り（実証実験用トークン）</p>
            </div>
            <div>
              <div className="font-medium text-gray-900 mb-1">3. 予測市場参加</div>
              <p>社会課題の解決策に投資し、集合知による意思決定に貢献</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            このサービスは実証実験です。Play Tokenに金銭的価値はありません。
            <br />
            セキュリティとプライバシーを最優先に設計されています。
          </p>
        </div>
      </div>
    </div>
  )
}