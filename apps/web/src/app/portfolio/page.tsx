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
  PlusCircleIcon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAccount } from 'wagmi';
import { useMetaMask } from '@/hooks/useMetaMask';
import { useToken } from '@/hooks/useToken';
import { useWagmiToken } from '@/hooks/useWagmiToken';
import { useOnChainPortfolio } from '@/hooks/useOnChainPortfolio';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { NETWORKS, getNetworkByChainId, getCurrencySymbol } from '@/config/networks';
import NetworkSwitcher from '@/components/NetworkSwitcher';
import Header from '@/components/Header';
import TwitterVolunteerCard from '@/components/TwitterVolunteerCard';

export default function PortfolioPage() {
  // Use wagmi's useAccount for broader wallet support
  const { address: wagmiAccount, isConnected: wagmiIsConnected, chainId } = useAccount();
  // Keep useMetaMask for network detection functionality
  const { getCurrentChainId } = useMetaMask();

  // Use wagmi account first, fallback to MetaMask if needed
  const account = wagmiAccount || null;
  const isConnected = wagmiIsConnected;

  const [currentNetworkKey, setCurrentNetworkKey] = useState<string>('sepolia');
  const [selectedTab, setSelectedTab] = useState<'positions' | 'history' | 'analytics'>('positions');
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [volunteerBonusStatus, setVolunteerBonusStatus] = useState<{
    hasClaimedBonus: boolean;
    isVolunteer: boolean;
    loading: boolean;
  }>({ hasClaimedBonus: false, isVolunteer: false, loading: true });

  // Get current user information
  const currentUser = useCurrentUser();

  // Get current network info
  const currentNetwork = NETWORKS[currentNetworkKey];
  const currencySymbol = 'PT'; // Play Tokenで固定

  // Use wagmi token hook for social wallets (Reown/WalletConnect)
  const {
    balance: wagmiTokenBalance,
    isLoading: wagmiTokenLoading,
    error: wagmiTokenError,
    canClaim: wagmiCanClaim,
    claimTokens: wagmiClaimTokens,
    refreshBalance: wagmiRefreshBalance,
    isWagmiAvailable
  } = useWagmiToken(currentNetworkKey);

  // Use traditional token hook for browser wallets (MetaMask)
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
    isTokenAddedToMetaMask,
    refreshBalance
  } = useToken(account, currentNetworkKey);

  // Determine which hook to use based on wallet type
  const isUsingWagmi = isWagmiAvailable && (typeof window === 'undefined' || !window.ethereum);
  const actualBalance = isUsingWagmi ? wagmiTokenBalance : tokenBalance;
  const actualCanClaim = isUsingWagmi ? wagmiCanClaim : canClaim;
  const actualClaimTokens = isUsingWagmi ? wagmiClaimTokens : claimTokens;
  const actualRefreshBalance = isUsingWagmi ? wagmiRefreshBalance : refreshBalance;
  const actualTokenLoading = isUsingWagmi ? wagmiTokenLoading : tokenLoading;
  const actualTokenError = isUsingWagmi ? wagmiTokenError : tokenError;

  // Use portfolio hook (mainly for position tracking)
  const {
    positionTokens,
    totalPortfolioValue,
    isLoading: portfolioLoading,
    error: portfolioError,
    lastUpdated: portfolioLastUpdated,
    refreshPortfolio
  } = useOnChainPortfolio(account);

  // Detect current network from wallet
  useEffect(() => {
    const detectNetwork = async () => {
      try {
        // Use wagmi chainId first, fallback to MetaMask
        const detectedChainId = chainId || await getCurrentChainId();
        if (!detectedChainId) return;
        const network = getNetworkByChainId(detectedChainId);
        if (network) {
          const networkKey = Object.keys(NETWORKS).find(
            key => NETWORKS[key].chainId === detectedChainId
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
  }, [account, chainId, getCurrentChainId]);

  // Check volunteer bonus status
  useEffect(() => {
    const checkVolunteerBonusStatus = async () => {
      console.log('🔍 Checking volunteer bonus status:', {
        account,
        authenticated: currentUser.authenticated,
        twitterId: currentUser.twitterId,
        networkKey: currentNetworkKey,
        loading: currentUser.isLoading
      });

      if (!account || currentNetworkKey !== 'sepolia') {
        console.log('❌ Conditions not met for volunteer check');
        setVolunteerBonusStatus({ hasClaimedBonus: false, isVolunteer: false, loading: false });
        return;
      }

      // Check if user is authenticated and has Twitter ID
      if (currentUser.isLoading) {
        console.log('⏳ User data still loading...');
        return;
      }

      try {
        // Check volunteer bonus status using the existing API
        const response = await fetch(
          `/api/claim/volunteer-bonus?address=${account}&network=${currentNetworkKey}`
        );

        console.log('📡 Volunteer API response:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Volunteer API data:', data);
          setVolunteerBonusStatus({
            hasClaimedBonus: data.hasClaimedVolunteerBonus,
            isVolunteer: true,
            loading: false
          });
        } else {
          console.log('❌ Volunteer API error:', response.status);
          // Not a volunteer or other error
          setVolunteerBonusStatus({
            hasClaimedBonus: false,
            isVolunteer: false,
            loading: false
          });
        }
      } catch (error) {
        console.error('Failed to check volunteer bonus status:', error);
        setVolunteerBonusStatus({
          hasClaimedBonus: false,
          isVolunteer: false,
          loading: false
        });
      }
    };

    checkVolunteerBonusStatus();
  }, [account, currentUser.authenticated, currentUser.twitterId, currentUser.isLoading, currentNetworkKey]);

  // Handle network switching
  const handleNetworkChange = (networkKey: string) => {
    setCurrentNetworkKey(networkKey);
  };

  // Calculate portfolio summary using live on-chain data only
  const portfolioSummary = useMemo(() => {
    const cash = parseFloat(actualBalance) || 0;
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
      currencySymbol: 'PT', // Play Tokenで固定
      isTestnet: currentNetwork?.isTestnet
    };
  }, [actualBalance, positionTokens, totalPortfolioValue, tokenLastUpdated, portfolioLastUpdated, currentNetwork]);

  if (!isConnected) {
    return (
      <>
        <Header />
        <main className={"flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full"}>
          <div className="text-center py-12">
            <WalletIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ウォレット未接続</h2>
            <p className="text-gray-600 mb-6">
              ポートフォリオを表示するには、ウォレットを接続してください。
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={"flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full"}>
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
              <div className={`w-3 h-3 rounded-full ${currentNetwork?.isTestnet ? 'bg-orange-400' : 'bg-green-400'}`} />
              <div>
                <p className="text-sm font-medium text-gray-900">{currentNetwork?.displayName}</p>
                <p className="text-xs text-gray-500">
                  {currentNetwork?.isTestnet ? 'テストネット' : 'メインネット'} •
                  {currencySymbol} • チェーンID: {currentNetwork?.chainId}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {actualCanClaim && (
                <Button
                  onClick={async () => {
                    if (actualClaimTokens) {
                      const result = await actualClaimTokens();
                      if (result.success) {
                        await actualRefreshBalance();
                        alert(isUsingWagmi ?
                          '🎉 1,000 PT を受け取りました！' :
                          '🎉 1,000 PT の受け取りが完了しました！'
                        );
                      } else {
                        alert(`エラー: ${result.error || 'トークンの取得に失敗しました'}`);
                      }
                    }
                  }}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                  disabled={actualTokenLoading}
                >
                  {actualTokenLoading ? '取得中...' : 'サインアップボーナス（1,000PT）を取得'}
                </Button>
              )}
              {!actualCanClaim && !isUsingWagmi && !isTokenAddedToMetaMask && currentNetworkKey === 'sepolia' && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await addTokenToMetaMask();
                      alert('Play TokenをMetaMaskに追加しました！');
                    } catch (error) {
                      console.error('Failed to add token to MetaMask:', error);
                      alert('MetaMaskへのトークン追加に失敗しました。手動で追加してください。');
                    }
                  }}
                  className="text-gray-600 border-gray-200 bg-gray-50 hover:bg-gray-100"
                >
                  <PlusCircleIcon className="h-4 w-4 mr-2" />
                  $PTをMetamaskからも可視化
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Portfolio Status */}
        {(actualTokenLoading || portfolioLoading) && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">データを読み込み中...</p>
          </div>
        )}

        {(actualTokenError || portfolioError) && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-800">エラー: {actualTokenError || portfolioError}</p>
            <button
              onClick={() => {
                actualRefreshBalance();
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
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-600">Portfolio</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {portfolioSummary.portfolioTotal.toFixed(2)} PT
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Cash + ポジション時価評価額（PT）
                  </p>
                </div>
                <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <TrophyIcon className="h-8 w-8 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cash Card */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-600">Cash</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {portfolioSummary.cash.toFixed(2)} PT
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    今すぐ使えるPlay Token残高
                  </p>
                </div>
                <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <BanknotesIcon className="h-8 w-8 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <p><strong>🔍 Debug Info:</strong></p>
            <p>Network: {currentNetworkKey}</p>
            <p>Account: {account}</p>
            <p>User Auth: {currentUser.authenticated ? 'Yes' : 'No'}</p>
            <p>Twitter ID: {currentUser.twitterId || 'None'}</p>
            <p>User Loading: {currentUser.isLoading ? 'Yes' : 'No'}</p>
            <p>Volunteer Status: {JSON.stringify(volunteerBonusStatus)}</p>
            <p>Show Section: {(currentNetworkKey === 'sepolia' && volunteerBonusStatus.isVolunteer && !volunteerBonusStatus.loading).toString()}</p>
          </div>
        )}

        {/* Volunteer Bonus Section - show after cash cards */}
        {currentNetworkKey === 'sepolia' && volunteerBonusStatus.isVolunteer && !volunteerBonusStatus.loading && (
          <Card className="bg-white border-gray-200 shadow-sm mb-8">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${volunteerBonusStatus.hasClaimedBonus
                      ? 'bg-gradient-to-r from-green-500 to-blue-500'
                      : 'bg-gray-900'
                    }`}>
                    {volunteerBonusStatus.hasClaimedBonus ? (
                      <CheckCircleIcon className="h-6 w-6 text-white" />
                    ) : (
                      <span className="text-xl">🎁</span>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {volunteerBonusStatus.hasClaimedBonus ? 'ボランティア特典獲得済み' : 'ボランティア特典プログラム'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {volunteerBonusStatus.hasClaimedBonus
                      ? 'チームみらいのボランティア特典（2,000 PT）を獲得済みです'
                      : 'チームみらいのボランティア活動に参加している方限定の特典です'
                    }
                  </p>
                  <div className={`border rounded-lg p-4 ${volunteerBonusStatus.hasClaimedBonus
                      ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {volunteerBonusStatus.hasClaimedBonus ? '✅ 特典獲得完了' : '追加ボーナス配布中'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {volunteerBonusStatus.hasClaimedBonus
                            ? 'ボランティア活動への参加ありがとうございます'
                            : '対象者には自動的に配布されます'
                          }
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {volunteerBonusStatus.hasClaimedBonus ? '2,000' : '+2,000'}
                          </div>
                          <div className="text-sm text-gray-600">PT</div>
                        </div>
                        {!volunteerBonusStatus.hasClaimedBonus && (
                          <Button
                            onClick={() => setShowVolunteerModal(true)}
                            className="bg-gray-900 hover:bg-gray-800 text-white"
                            size="sm"
                          >
                            詳細・申請
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Performance Chart - Coming Soon */}
        <Card className="bg-white border-gray-200 shadow-sm mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ポートフォリオ推移</h2>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">チャート機能は準備中です</h3>
                <p className="text-gray-500">
                  ポートフォリオの過去のパフォーマンスを追跡する機能を開発中です。<br />
                  今後のアップデートでご利用いただけるようになります。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <Card className="bg-white border-gray-200 shadow-sm mb-8">
          {/* <div className="border-b border-gray-200"> */}
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
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${selectedTab === tab.id
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

          <CardContent className="p-6">
            {selectedTab === 'positions' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">現在のポジション</h3>
                  <div className="flex items-center space-x-2">
                  </div>
                </div>

                {/* Live positions from on-chain data */}
                {positionTokens.length > 0 ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <p className="text-sm text-gray-800 font-medium">✓ ライブポジション</p>
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
                    <Button asChild>
                      <Link href="/">
                        市場を探す
                      </Link>
                    </Button>
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
                    オンチェーンの取引履歴追跡機能を開発中です。<br />
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
                    詳細なポートフォリオ分析機能を開発中です。<br />
                    勝率、利益率、リスク分析などの機能を今後追加予定です。
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Volunteer Modal */}
        {showVolunteerModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowVolunteerModal(false)}></div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      ボランティア特典プログラム
                    </h3>
                    <button
                      onClick={() => setShowVolunteerModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <TwitterVolunteerCard networkKey={currentNetworkKey} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
