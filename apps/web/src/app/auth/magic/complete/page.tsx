'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeMagicAuthentication } from '@/lib/magic'
import { CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function MagicCompleteAuthPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string>('')
  const [userInfo, setUserInfo] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const completeAuth = async () => {
      try {
        setStatus('loading')
        
        // Complete Magic authentication
        const authResult = await completeMagicAuthentication()
        
        // Send DID token to our backend for validation and user creation
        const response = await fetch('/api/auth/magic/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            didToken: authResult.didToken,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || result.error || 'Authentication failed')
        }

        setUserInfo(result.user)
        setStatus('success')
        
        // Redirect to dashboard after successful authentication
        setTimeout(() => {
          router.push('/')
        }, 2000)

      } catch (error) {
        console.error('Magic authentication completion failed:', error)
        setError(error instanceof Error ? error.message : 'Unknown error occurred')
        setStatus('error')
      }
    }

    completeAuth()
  }, [router])

  const handleRetry = () => {
    router.push('/auth/twitter')
  }

  const handleGoHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">認証を完了しています...</h1>
              <p className="text-gray-600 mb-6">
                Magic Link による Twitter 認証とウォレット作成を処理中です。
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">処理中:</p>
                  <ul className="text-left space-y-1">
                    <li>✓ Twitter OAuth 認証</li>
                    <li>✓ ブロックチェーンウォレット作成</li>
                    <li>🔄 ユーザーアカウント設定</li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">認証完了！</h1>
              <p className="text-gray-600 mb-6">
                Twitter 認証とウォレット作成が完了しました。
              </p>
              {userInfo && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="text-sm text-green-800">
                    <div className="font-medium mb-2">アカウント情報:</div>
                    <div className="text-left space-y-1">
                      <div className="flex justify-between">
                        <span>Twitter:</span>
                        <span className="font-mono">@{userInfo.twitter.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ウォレット:</span>
                        <span className="font-mono text-xs">
                          {userInfo.walletAddress.slice(0, 6)}...{userInfo.walletAddress.slice(-4)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500">
                2秒後にダッシュボードに移動します...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">認証に失敗しました</h1>
              <p className="text-gray-600 mb-4">
                認証処理中にエラーが発生しました。
              </p>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="text-sm text-red-800">
                    <div className="font-medium mb-1">エラー詳細:</div>
                    <div className="text-left">{error}</div>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  再試行
                </button>
                <button
                  onClick={handleGoHome}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ホームに戻る
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}