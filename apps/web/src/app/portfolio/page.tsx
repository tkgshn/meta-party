'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  WalletIcon,
  BanknotesIcon,
  ChartBarIcon,
  TrophyIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useMetaMask } from '@/hooks/useMetaMask';
import { useToken } from '@/hooks/useToken';
import { useOnChainPortfolio } from '@/hooks/useOnChainPortfolio';
import { NETWORKS, getNetworkByChainId, getCurrencySymbol } from '@/config/networks';
import NetworkSwitcher from '@/components/NetworkSwitcher';
import Header from '@/components/Header';

export default function PortfolioPage() {
  const { account, isConnected, getCurrentChainId } = useMetaMask();
  const [currentNetworkKey, setCurrentNetworkKey] = useState<string>('polygon');
  const [selectedTab, setSelectedTab] = useState<'positions' | 'history' | 'analytics'>('positions');
  
  // Get current network info
  const currentNetwork = NETWORKS[currentNetworkKey];
  const currencySymbol = getCurrencySymbol(currentNetworkKey);
  
  // Use token hook for current network
  const {
    balance: tokenBalance,
    symbol: tokenSymbol,
    // decimals: tokenDecimals,
    isLoading: tokenLoading,
    error: tokenError,
    lastUpdated: tokenLastUpdated,
    // hasClaimed,
    canClaim,
    claimTokens,
    addTokenToMetaMask,
    refreshBalance
  } = useToken(account, currentNetworkKey);
  
  // Use portfolio hook (mainly for position tracking)
  const {
    positionTokens,
    totalPortfolioValue,
    isLoading: portfolioLoading,
    error: portfolioError,
    lastUpdated: portfolioLastUpdated,
    refreshPortfolio
  } = useOnChainPortfolio(account);
  
  // Detect current network from MetaMask
  useEffect(() => {
    const detectNetwork = async () => {
      try {
        const chainId = await getCurrentChainId();
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
    };
    
    if (account) {
      detectNetwork();
    }
  }, [account, getCurrentChainId]);

  // Handle network switching
  const handleNetworkChange = (networkKey: string) => {
    setCurrentNetworkKey(networkKey);
  };
  
  // Calculate portfolio summary using live on-chain data only
  const portfolioSummary = useMemo(() => {
    const cash = parseFloat(tokenBalance) || 0;
    const positionsValue = positionTokens.reduce((sum, token) => sum + token.value, 0);
    const portfolioTotal = totalPortfolioValue || (cash + positionsValue);

    // Calculate P&L from real positions only
    const unrealizedPnL = positionTokens.reduce((sum) => {
      // For real positions, we need to calculate P&L based on purchase price vs current price
      // For now, we'll show 0 until we have historical purchase data
      return sum + 0;
    }, 0);
    const realizedPnL = 0; // This would come from transaction history
    const totalPnL = unrealizedPnL + realizedPnL;

    const totalCost = positionTokens.reduce((sum, token) => {
      // This would be the total amount spent on positions
      // For now, we'll use current value as cost (0 P&L)
      return sum + token.value;
    }, 0);
    const pnlPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    return {
      cash,
      positionsValue,
      portfolioTotal,
      unrealizedPnL,
      realizedPnL,
      totalPnL,
      pnlPercent,
      activePositions: positionTokens.length,
      lastUpdated: tokenLastUpdated || portfolioLastUpdated,
      currencySymbol: tokenSymbol || currencySymbol,
      isTestnet: currentNetwork?.isTestnet
    };
  }, [tokenBalance, positionTokens, totalPortfolioValue, tokenLastUpdated, portfolioLastUpdated, tokenSymbol, currencySymbol, currentNetwork]);

  if (!isConnected) {
    return (
      <>
        <Header/>
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="text-center py-12">
            <WalletIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ウォレット未接続</h2>
            <p className="text-gray-600 mb-6">
              ポートフォリオを表示するには、MetaMaskを接続してください。
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header/>
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">ポートフォリオ</h1>
              <p className="text-gray-600">予測市場でのポジション管理と収益追跡</p>
            </div>
            <NetworkSwitcher onNetworkChange={handleNetworkChange} />
          </div>
        </div>

        {/* Network Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${currentNetwork?.isTestnet ? 'bg-yellow-400' : 'bg-green-400'}`} />
              <div>
                <p className="text-sm font-medium text-gray-900">{currentNetwork?.displayName}</p>
                <p className="text-xs text-gray-500">
                  {currentNetwork?.isTestnet ? 'テストネット' : 'メインネット'} • 
                  {currencySymbol} • チェーンID: {currentNetwork?.chainId}
                </p>
              </div>
            </div>
            {canClaim && (
              <button
                onClick={async () => {
                  if (claimTokens) {
                    const result = await claimTokens();
                    if (result.success) {
                      refreshBalance();
                    }
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                テストトークンを取得
              </button>
            )}
          </div>
        </div>
        
        {/* Portfolio Status */}
        {(tokenLoading || portfolioLoading) && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">データを読み込み中...</p>
          </div>
        )}
        
        {(tokenError || portfolioError) && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-800">エラー: {tokenError || portfolioError}</p>
            <button 
              onClick={() => {
                refreshBalance();
                refreshPortfolio();
              }}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              再読み込み
            </button>
          </div>
        )}

        {/* Main Portfolio and Cash Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Portfolio Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-600">Portfolio</p>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Live
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {portfolioSummary.currencySymbol === 'MATIC' 
                    ? portfolioSummary.portfolioTotal.toFixed(4)
                    : portfolioSummary.portfolioTotal.toFixed(0)
                  } {portfolioSummary.currencySymbol}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Cash + ポジション時価評価額
                </p>
                {portfolioSummary.lastUpdated && (
                  <p className="text-xs text-gray-400 mt-1">
                    最終更新: {format(portfolioSummary.lastUpdated, 'HH:mm:ss')}
                  </p>
                )}
              </div>
              <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrophyIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Cash Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-600">Cash</p>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Live
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {portfolioSummary.currencySymbol === 'MATIC' 
                    ? portfolioSummary.cash.toFixed(4)
                    : portfolioSummary.cash.toFixed(0)
                  } {portfolioSummary.currencySymbol}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  今すぐ使える{portfolioSummary.currencySymbol}残高
                </p>
                {portfolioSummary.lastUpdated && (
                  <p className="text-xs text-gray-400 mt-1">
                    最終更新: {format(portfolioSummary.lastUpdated, 'HH:mm:ss')}
                  </p>
                )}
              </div>
              <div className="h-16 w-16 bg-green-100 rounded-lg flex items-center justify-center">
                <BanknotesIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Performance Chart - Coming Soon */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ポートフォリオ推移</h2>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">チャート機能は準備中です</h3>
              <p className="text-gray-500">
                ポートフォリオの過去のパフォーマンスを追跡する機能を開発中です。<br/>
                今後のアップデートでご利用いただけるようになります。
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'positions', name: 'ポジション', icon: ChartBarIcon },
                { id: 'history', name: '取引履歴', icon: ClockIcon },
                { id: 'analytics', name: '分析', icon: TrophyIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as 'positions' | 'history' | 'analytics')}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {selectedTab === 'positions' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">現在のポジション</h3>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => {
                        refreshBalance();
                        refreshPortfolio();
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      更新
                    </button>
                    <button
                      onClick={addTokenToMetaMask}
                      className="text-sm text-green-600 hover:text-green-800 underline"
                    >
                      🦊 トークンを追加
                    </button>
                  </div>
                </div>
                
                {/* Live positions from on-chain data */}
                {positionTokens.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-3 rounded-lg mb-4">
                      <p className="text-sm text-green-800 font-medium">✓ ライブポジション</p>
                    </div>
                    {positionTokens.map((token) => (
                      <div key={token.address} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{token.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{token.symbol}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span>残高: {parseFloat(token.balance).toFixed(2)}</span>
                              <span>アドレス: {token.address.slice(0, 10)}...</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{token.value.toFixed(2)} PT</p>
                            <p className="text-sm text-gray-600">現在価値</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">ポジションがありません</h3>
                    <p className="text-gray-500 mb-4">
                      現在、予測市場でのアクティブなポジションはありません。
                    </p>
                    <Link 
                      href="/"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      市場を探す
                    </Link>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'history' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">取引履歴</h3>
                <div className="text-center py-8">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">取引履歴は準備中です</h4>
                  <p className="text-gray-500">
                    オンチェーンの取引履歴追跡機能を開発中です。<br/>
                    今後のアップデートでご利用いただけるようになります。
                  </p>
                </div>
              </div>
            )}

            {selectedTab === 'analytics' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">分析データ</h3>
                <div className="text-center py-8">
                  <TrophyIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">分析機能は準備中です</h4>
                  <p className="text-gray-500">
                    詳細なポートフォリオ分析機能を開発中です。<br/>
                    勝率、利益率、リスク分析などの機能を今後追加予定です。
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}