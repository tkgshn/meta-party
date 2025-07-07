'use client'

import { useState, useEffect } from 'react'
import { ExclamationTriangleIcon, CheckCircleIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'

interface SepoliaOnboardingFlowProps {
  isNewWallet: boolean
  walletAddress: string
  onComplete: () => void
}

interface FaucetInfo {
  name: string
  url: string
  description: string
  requiresAccount: boolean
  estimatedTime: string
}

const SEPOLIA_FAUCETS: FaucetInfo[] = [
  {
    name: 'Alchemy Sepolia Faucet',
    url: 'https://sepoliafaucet.com/',
    description: '最も信頼性が高く、迅速にETHを取得できます',
    requiresAccount: true,
    estimatedTime: '1-2分'
  },
  {
    name: 'Chainlink Sepolia Faucet',
    url: 'https://faucets.chain.link/sepolia',
    description: 'Chainlink公式のファウセット。安定した配布',
    requiresAccount: false,
    estimatedTime: '2-5分'
  },
  {
    name: 'QuickNode Sepolia Faucet',
    url: 'https://faucet.quicknode.com/ethereum/sepolia',
    description: 'QuickNode提供。複数回の請求が可能',
    requiresAccount: true,
    estimatedTime: '1-3分'
  }
]

export default function SepoliaOnboardingFlow({ 
  isNewWallet, 
  walletAddress, 
  onComplete 
}: SepoliaOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [hasSepoliaETH, setHasSepoliaETH] = useState(false)
  const [isCheckingBalance, setIsCheckingBalance] = useState(false)
  const [ethBalance, setEthBalance] = useState('0')

  const steps = [
    {
      title: '1. Sepoliaテストネットワークに接続',
      description: 'MetaMaskでSepoliaテストネットワークに切り替えます',
      completed: true // Assume already connected if this component is shown
    },
    {
      title: '2. テスト用ETHを取得',
      description: 'ガス代として必要なSepoliaETHをファウセットから取得します',
      completed: hasSepoliaETH
    },
    {
      title: '3. Play Tokenを請求',
      description: '1,000 PTを無料で取得してFutarchy市場に参加開始',
      completed: false
    }
  ]

  // Check Sepolia ETH balance
  const checkBalance = async () => {
    if (!walletAddress) return

    setIsCheckingBalance(true)
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [walletAddress, 'latest']
        })
        
        const balanceInETH = parseInt(balance, 16) / Math.pow(10, 18)
        setEthBalance(balanceInETH.toFixed(6))
        setHasSepoliaETH(balanceInETH > 0.001) // Need at least 0.001 ETH for gas
      }
    } catch (error) {
      console.error('Balance check failed:', error)
    } finally {
      setIsCheckingBalance(false)
    }
  }

  useEffect(() => {
    if (walletAddress) {
      checkBalance()
      // Check balance every 30 seconds
      const interval = setInterval(checkBalance, 30000)
      return () => clearInterval(interval)
    }
  }, [walletAddress])

  const handleFaucetClick = (faucet: FaucetInfo) => {
    // Open faucet in new tab and pre-fill wallet address if possible
    const url = new URL(faucet.url)
    
    // Some faucets support pre-filling address via URL params
    if (faucet.url.includes('sepoliafaucet.com')) {
      url.searchParams.set('address', walletAddress)
    }
    
    window.open(url.toString(), '_blank', 'noopener,noreferrer')
  }

  const handleComplete = () => {
    onComplete()
  }

  if (!isNewWallet && hasSepoliaETH) {
    // Existing wallet with ETH, skip onboarding
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isNewWallet ? 'ウォレットセットアップ' : 'Sepoliaネットワークセットアップ'}
            </h2>
            <p className="text-gray-600">
              Play Tokenを取得するための準備を行います
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${step.completed 
                      ? 'bg-green-100 text-green-800' 
                      : index === currentStep 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-500'
                    }
                  `}>
                    {step.completed ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium text-gray-900">{step.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      hidden md:block absolute top-4 w-full h-0.5 -z-10
                      ${step.completed ? 'bg-green-200' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Current Step Content */}
          {!hasSepoliaETH ? (
            /* Step 2: Get Sepolia ETH */
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Sepoliaテスト用ETHが必要です
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Play Tokenの取得にはガス代としてSepoliaETHが必要です。以下のファウセットから無料で取得できます。
                    </p>
                  </div>
                </div>
              </div>

              {/* Wallet Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">ウォレット情報</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">アドレス:</span>
                    <code className="text-xs bg-white px-2 py-1 rounded border font-mono">
                      {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                    </code>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-600">SepoliaETH残高:</span>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${hasSepoliaETH ? 'text-green-600' : 'text-red-600'}`}>
                        {ethBalance} ETH
                      </span>
                      <button
                        onClick={checkBalance}
                        disabled={isCheckingBalance}
                        className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      >
                        {isCheckingBalance ? '確認中...' : '更新'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Faucet Options */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  おすすめファウセット（無料でETHを取得）
                </h4>
                <div className="space-y-3">
                  {SEPOLIA_FAUCETS.map((faucet, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 mb-1">{faucet.name}</h5>
                          <p className="text-sm text-gray-600 mb-2">{faucet.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>⏱️ {faucet.estimatedTime}</span>
                            {faucet.requiresAccount && (
                              <span>👤 アカウント登録必要</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleFaucetClick(faucet)}
                          className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          取得 <ArrowTopRightOnSquareIcon className="ml-1 h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">📋 手順</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>上記のファウセットのいずれかをクリック</li>
                  <li>ウォレットアドレスを入力（既に入力済みの場合あり）</li>
                  <li>認証を完了（Captcha等）</li>
                  <li>ETH受け取り（通常1-5分で反映）</li>
                  <li>このページで「更新」ボタンをクリックして残高確認</li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={checkBalance}
                  disabled={isCheckingBalance}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {isCheckingBalance ? '確認中...' : '残高を確認'}
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!hasSepoliaETH}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次へ: Play Token取得
                </button>
              </div>
            </div>
          ) : (
            /* Step 3: Ready for Play Token claim */
            <div className="text-center space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400 mb-4" />
                <h3 className="text-lg font-medium text-green-900 mb-2">
                  セットアップ完了！
                </h3>
                <p className="text-green-800">
                  SepoliaETHの取得が完了しました。これでPlay Tokenを取得できます。
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>ネットワーク:</span>
                    <span className="font-medium">Sepolia Testnet</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ETH残高:</span>
                    <span className="font-medium text-green-600">{ethBalance} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>次のステップ:</span>
                    <span className="font-medium">1,000 PT 取得</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleComplete}
                className="w-full px-6 py-3 bg-blue-600 text-white text-base font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Play Tokenを取得する
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}