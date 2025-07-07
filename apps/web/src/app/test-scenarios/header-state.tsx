'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { usePlayToken } from '@/hooks/usePlayToken';
import { useToken } from '@/hooks/useToken';
import { useOnChainPortfolio } from '@/hooks/useOnChainPortfolio';
import { NETWORKS, getNetworkByChainId } from '@/config/networks';

/**
 * ヘッダーの内部状態を詳細に表示・検証するコンポーネント
 */
export default function HeaderStateInspector() {
  const { address: account, isConnected, chainId } = useAccount();
  const [currentNetworkKey, setCurrentNetworkKey] = useState<string>('polygonAmoy');

  // Detect current network
  useEffect(() => {
    if (!chainId) return;
    
    try {
      const network = getNetworkByChainId(chainId);
      if (network) {
        const networkKey = Object.keys(NETWORKS).find(
          key => NETWORKS[key].chainId === chainId
        );
        if (networkKey) {
          setCurrentNetworkKey(networkKey);
        }
      }
    } catch (error) {
      console.error('Failed to detect network:', error);
    }
  }, [chainId]);

  // Play Token hook state
  const playTokenHook = usePlayToken(account || null);
  const {
    balance: playTokenBalance,
    hasClaimed,
    isLoading: playTokenLoading,
    balanceWei,
    lastClaimTxHash,
    claimHistory
  } = playTokenHook;

  // Regular token hook state
  const {
    balance: tokenBalance,
    symbol: tokenSymbol,
    isLoading: tokenLoading,
  } = useToken(account || null, currentNetworkKey);

  // Portfolio hook state
  const {
    positionTokens,
    totalPortfolioValue,
    isLoading: portfolioLoading
  } = useOnChainPortfolio(account || null);

  // Calculate values (same as Header component)
  const displayBalance = currentNetworkKey === 'polygonAmoy' 
    ? parseFloat(playTokenBalance) || 0 
    : parseFloat(tokenBalance) || 0;
    
  const positionsValue = positionTokens.reduce((sum, token) => sum + token.value, 0);
  const portfolioValue = isConnected ? (totalPortfolioValue || (displayBalance + positionsValue)) : 0;
  const cashValue = isConnected ? displayBalance : 0;
  const displaySymbol = 'PT'; // Always PT as per unified design

  // Check if admin
  const whitelistedAddress = '0x2c5329fFa2A1f02A241Ec1932b4358bf71e158ae';
  const isAdmin = account && account.toLowerCase() === whitelistedAddress.toLowerCase();

  // Button visibility logic
  const shouldShowClaimButton = !hasClaimed && currentNetworkKey === 'polygonAmoy';
  const shouldShowAddButton = currentNetworkKey === 'polygonAmoy';

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-8">
      <h2 className="text-xl font-semibold mb-4">ヘッダー内部状態検証</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wallet State */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-blue-900">ウォレット状態</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">接続状態:</span>
              <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                {isConnected ? '✅ 接続済み' : '❌ 未接続'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">アドレス:</span>
              <span className="font-mono text-xs">
                {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'None'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">チェーンID:</span>
              <span>{chainId || 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">検出ネットワーク:</span>
              <span>{NETWORKS[currentNetworkKey]?.displayName || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">管理者権限:</span>
              <span className={isAdmin ? 'text-green-600' : 'text-gray-500'}>
                {isAdmin ? '✅ 管理者' : '❌ 一般ユーザー'}
              </span>
            </div>
          </div>
        </div>

        {/* Play Token State */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-green-900">Play Token状態</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">残高:</span>
              <span>{playTokenBalance} PT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">残高Wei:</span>
              <span className="font-mono text-xs">{balanceWei?.toString() || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">クレーム状態:</span>
              <span className={hasClaimed ? 'text-green-600' : 'text-orange-600'}>
                {hasClaimed ? '✅ クレーム済み' : '⏳ 未クレーム'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">読み込み中:</span>
              <span>{playTokenLoading ? '⏳ はい' : '✅ いいえ'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">最後のクレームTX:</span>
              <span className="font-mono text-xs">
                {lastClaimTxHash ? `${lastClaimTxHash.slice(0, 8)}...` : 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Regular Token State */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-purple-900">通常トークン状態</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">残高:</span>
              <span>{tokenBalance} {tokenSymbol || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">シンボル:</span>
              <span>{tokenSymbol || 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">読み込み中:</span>
              <span>{tokenLoading ? '⏳ はい' : '✅ いいえ'}</span>
            </div>
          </div>
        </div>

        {/* Portfolio State */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-orange-900">ポートフォリオ状態</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ポジション数:</span>
              <span>{positionTokens.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ポジション価値:</span>
              <span>{positionsValue.toFixed(2)} PT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">総ポートフォリオ:</span>
              <span>{totalPortfolioValue?.toFixed(2) || '計算値使用'} PT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">読み込み中:</span>
              <span>{portfolioLoading ? '⏳ はい' : '✅ いいえ'}</span>
            </div>
          </div>
        </div>

        {/* Calculated Values */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-red-900">計算値（ヘッダー表示）</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">表示残高:</span>
              <span className="font-semibold">{displayBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">キャッシュ値:</span>
              <span className="font-semibold">{Math.floor(cashValue).toLocaleString()} {displaySymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ポートフォリオ値:</span>
              <span className="font-semibold">{Math.floor(portfolioValue).toLocaleString()} {displaySymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">表示シンボル:</span>
              <span className="font-semibold text-blue-600">{displaySymbol}</span>
            </div>
          </div>
        </div>

        {/* Button Logic */}
        <div>
          <h3 className="text-lg font-medium mb-3 text-indigo-900">ボタン表示ロジック</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">クレームボタン条件:</span>
              <span>
                {!hasClaimed ? '✅' : '❌'} 未クレーム & {' '}
                {currentNetworkKey === 'polygonAmoy' ? '✅' : '❌'} Amoy
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">クレームボタン表示:</span>
              <span className={shouldShowClaimButton ? 'text-green-600' : 'text-red-600'}>
                {shouldShowClaimButton ? '✅ 表示' : '❌ 非表示'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">PT追加ボタン条件:</span>
              <span>
                {currentNetworkKey === 'polygonAmoy' ? '✅' : '❌'} Amoy
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">PT追加ボタン表示:</span>
              <span className={shouldShowAddButton ? 'text-green-600' : 'text-red-600'}>
                {shouldShowAddButton ? '✅ 表示' : '❌ 非表示'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">管理者メニュー:</span>
              <span className={isAdmin ? 'text-green-600' : 'text-red-600'}>
                {isAdmin ? '✅ 表示' : '❌ 非表示'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium mb-2">現在の状態サマリー</h3>
        <div className="text-sm text-gray-700">
          {isConnected ? (
            <>
              <div>✅ ウォレット接続済み ({NETWORKS[currentNetworkKey]?.displayName})</div>
              <div>💰 キャッシュ: {Math.floor(cashValue).toLocaleString()} {displaySymbol}</div>
              <div>📊 ポートフォリオ: {Math.floor(portfolioValue).toLocaleString()} {displaySymbol}</div>
              {currentNetworkKey === 'polygonAmoy' && (
                <>
                  <div>🎯 Play Token: {hasClaimed ? 'クレーム済み' : '未クレーム'}</div>
                  <div>🔲 クレームボタン: {shouldShowClaimButton ? '表示中' : '非表示'}</div>
                  <div>➕ PT追加ボタン: {shouldShowAddButton ? '表示中' : '非表示'}</div>
                </>
              )}
              {isAdmin && <div>👑 管理者権限: 有効</div>}
            </>
          ) : (
            <div>❌ ウォレット未接続</div>
          )}
        </div>
      </div>
    </div>
  );
}