'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowPathIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CogIcon
} from '@heroicons/react/24/outline';

import OnboardingFlow from '@/components/OnboardingFlow';
import { useMetaMask } from '@/hooks/useMetaMask';
import { usePlayToken } from '@/hooks/usePlayToken';
import '@/types/ethereum';

export default function DashboardPage() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [txMonitoring, setTxMonitoring] = useState<{
    hash: string;
    status: 'pending' | 'confirmed' | 'failed';
  } | null>(null);

  // MetaMask state management
  const {
    account,
    chainId,
    isConnected,
    isCorrectNetwork,
    isMetaMaskAvailable,
    isInitialized,
    connect,
    disconnect,
    switchToAmoy,
    addAmoyNetwork,
    refreshConnection,
  } = useMetaMask();

  // Play Token state management
  const {
    balance,
    hasClaimed,
    isLoading: isTokenLoading,
    lastClaimTxHash,
    claimHistory,
    refreshBalance,
    refreshClaimStatus,
    claimTokens,
    addTokenToMetaMask,
    checkTransactionStatus,
  } = usePlayToken(account);

  // Determine if user needs onboarding
  const needsOnboarding = isInitialized && (
    !isMetaMaskAvailable ||
    !isConnected ||
    !isCorrectNetwork ||
    parseFloat(balance) === 0
  );

  // Auto-refresh data periodically
  useEffect(() => {
    if (account && isCorrectNetwork) {
      const interval = setInterval(() => {
        refreshBalance();
        refreshClaimStatus();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [account, isCorrectNetwork, refreshBalance, refreshClaimStatus]);

  // Monitor pending transactions
  useEffect(() => {
    if (txMonitoring && txMonitoring.status === 'pending') {
      const checkTx = async () => {
        const { confirmed, success } = await checkTransactionStatus(txMonitoring.hash);
        if (confirmed) {
          setTxMonitoring(prev => prev ? {
            ...prev,
            status: success ? 'confirmed' : 'failed'
          } : null);
          
          if (success) {
            // Refresh data after successful transaction
            setTimeout(() => {
              refreshBalance();
              refreshClaimStatus();
            }, 2000);
          }
        }
      };

      const interval = setInterval(checkTx, 3000);
      return () => clearInterval(interval);
    }
  }, [txMonitoring, checkTransactionStatus, refreshBalance, refreshClaimStatus]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refreshConnection(),
      refreshBalance(),
      refreshClaimStatus(),
    ]);
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  // Handle claim tokens
  const handleClaimTokens = async () => {
    if (!isCorrectNetwork) {
      const switched = await switchToAmoy();
      if (!switched) {
        await addAmoyNetwork();
      }
      return;
    }

    const result = await claimTokens();
    
    if (result.success && result.txHash) {
      setTxMonitoring({
        hash: result.txHash,
        status: 'pending'
      });
    } else if (result.error) {
      alert(result.error);
    }
  };

  // Handle auto-setup (network + token)
  const handleAutoSetup = async () => {
    try {
      // Add/switch to Amoy network
      const switched = await switchToAmoy();
      if (!switched) {
        await addAmoyNetwork();
      }
      
      // Add PT token to MetaMask
      await addTokenToMetaMask();
      
      alert('✅ セットアップが完了しました！');
    } catch (error) {
      console.error('Auto-setup failed:', error);
      alert('❌ セットアップに失敗しました。手動で設定してください。');
    }
  };

  // Show onboarding if needed
  if (needsOnboarding && showOnboarding) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">マイページ</h1>
        <div className="flex items-center space-x-2">
          {lastRefresh && (
            <span className="text-sm text-gray-500">
              最終更新: {lastRefresh.toLocaleTimeString('ja-JP')}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            title="データを更新"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* MetaMask Status Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <CogIcon className="w-5 h-5 mr-2" />
          接続状況
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">MetaMask</span>
            <div className="flex items-center">
              {isMetaMaskAvailable ? (
                <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
              )}
              <span className={isMetaMaskAvailable ? 'text-green-600' : 'text-red-600'}>
                {isMetaMaskAvailable ? '利用可能' : '未インストール'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">ウォレット接続</span>
            <div className="flex items-center">
              {isConnected ? (
                <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
              )}
              <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                {isConnected ? '接続済み' : '未接続'}
              </span>
              {isConnected && account && (
                <span className="ml-2 text-xs font-mono text-gray-500">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600">ネットワーク</span>
            <div className="flex items-center">
              {isCorrectNetwork ? (
                <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
              )}
              <span className={isCorrectNetwork ? 'text-green-600' : 'text-red-600'}>
                {isCorrectNetwork ? 'Polygon Amoy' : chainId ? `Chain ${chainId}` : '未確認'}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex space-x-2">
          {!isConnected && (
            <button
              onClick={connect}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              ウォレット接続
            </button>
          )}
          
          {isConnected && (
            <button
              onClick={disconnect}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              切断
            </button>
          )}

          {!isCorrectNetwork && isConnected && (
            <button
              onClick={handleAutoSetup}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              🔧 ワンクリック設定
            </button>
          )}

          {needsOnboarding && (
            <button
              onClick={() => setShowOnboarding(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              📚 ガイドを見る
            </button>
          )}
        </div>
      </div>

      {/* Play Token Balance Card */}
      {isConnected && isCorrectNetwork && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Play Token (PT)</h2>
          
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {balance} PT
          </div>
          
          <p className="text-gray-600 text-sm mb-4">
            予測市場で使用できるゲーム内通貨です（実際の金銭的価値はありません）
          </p>

          {/* Claim status */}
          <div className="flex items-center mb-4">
            {hasClaimed ? (
              <>
                <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-600">受け取り済み</span>
                {lastClaimTxHash && (
                  <a
                    href={`https://amoy.polygonscan.com/tx/${lastClaimTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-xs text-blue-600 hover:underline"
                  >
                    トランザクションを確認
                  </a>
                )}
              </>
            ) : (
              <>
                <InformationCircleIcon className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-blue-600">1,000 PT を受け取れます</span>
              </>
            )}
          </div>

          {/* Transaction monitoring */}
          {txMonitoring && (
            <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center">
                {txMonitoring.status === 'pending' && (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                )}
                {txMonitoring.status === 'confirmed' && (
                  <CheckCircleIcon className="w-4 h-4 text-green-600 mr-2" />
                )}
                {txMonitoring.status === 'failed' && (
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-600 mr-2" />
                )}
                <span className="text-sm">
                  {txMonitoring.status === 'pending' && 'トランザクション確認中...'}
                  {txMonitoring.status === 'confirmed' && 'トランザクション完了！'}
                  {txMonitoring.status === 'failed' && 'トランザクション失敗'}
                </span>
              </div>
              <a
                href={`https://amoy.polygonscan.com/tx/${txMonitoring.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                {txMonitoring.hash.slice(0, 10)}...{txMonitoring.hash.slice(-8)}
              </a>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex space-x-2">
            {!hasClaimed && (
              <button
                onClick={handleClaimTokens}
                disabled={isTokenLoading || txMonitoring?.status === 'pending'}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isTokenLoading || txMonitoring?.status === 'pending' ? '処理中...' : '1,000 PT を受け取る'}
              </button>
            )}

            <button
              onClick={addTokenToMetaMask}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              🦊 MetaMaskに追加
            </button>

            <button
              onClick={refreshBalance}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              残高更新
            </button>
          </div>

          {/* Claim history */}
          {claimHistory.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">受け取り履歴</h4>
              {claimHistory.map((txHash, index) => (
                <div key={txHash} className="text-xs">
                  <a
                    href={`https://amoy.polygonscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    #{index + 1}: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Next Steps Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">次のステップ</h2>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-blue-600 font-semibold text-sm">1</span>
            </div>
            <div className="flex-grow">
              <h3 className="text-sm font-medium text-gray-900">予測市場に参加</h3>
              <p className="text-sm text-gray-500">
                <Link href="/" className="text-blue-600 hover:text-blue-500 underline">
                  ホームページ
                </Link>
                から市場を選んで予測投資を行います
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-gray-600 font-semibold text-sm">2</span>
            </div>
            <div className="flex-grow">
              <h3 className="text-sm font-medium text-gray-900">管理者機能（実装予定）</h3>
              <p className="text-sm text-gray-500">
                新しい予測市場の作成や結果の判定
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting Card */}
      <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
          トラブルシューティング
        </h2>
        
        <div className="space-y-3 text-sm text-gray-700">
          <div>
            <strong>トークン受け取りでエラーが出る場合:</strong>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Polygon AmoyネットワークでPOLトークン（ガス代）が十分にあるか確認</li>
              <li>
                <a 
                  href="https://www.alchemy.com/faucets/polygon-amoy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Alchemy Faucet
                </a>
                または
                <a 
                  href="https://faucet.polygon.technology/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Polygon Faucet
                </a>
                で追加のPOLを取得
              </li>
              <li>数分待ってから再試行（ネットワークが混雑している場合）</li>
              <li>MetaMaskでガス価格を手動で上げる</li>
            </ul>
          </div>
          
          <div>
            <strong>残高が表示されない場合:</strong>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>「🦊 MetaMaskに追加」ボタンでトークンを追加</li>
              <li>「残高更新」ボタンで最新状態を取得</li>
              <li>ページを再読み込みして再試行</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}