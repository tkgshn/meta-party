'use client';

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { notFound } from 'next/navigation';
import {
  UserCircleIcon,
  WalletIcon,
  ChartBarIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  BanknotesIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TwitterVolunteerCard from '@/components/TwitterVolunteerCard';
import { useOnChainPortfolio } from '@/hooks/useOnChainPortfolio';
import { usePortfolioHistory } from '@/hooks/usePortfolioHistory';
import { useToken } from '@/hooks/useToken';
import { useMetaMask } from '@/hooks/useMetaMask';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useUserProfile } from '@/hooks/useUserProfile';
import { NETWORKS } from '@/config/networks';
import { isAddress } from 'viem';
import Header from '@/components/Header';
import PortfolioChart from '@/components/PortfolioChart';
import TransactionHistory from '@/components/TransactionHistory';
import { getUserAvatarUrl } from '@/utils/pixelAvatar';

interface ProfilePageProps {
  params: Promise<{
    address: string;
  }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { address: connectedAddress, isConnected, chainId } = useAccount();
  const { getCurrentChainId } = useMetaMask();
  const router = useRouter();
  const resolvedParams = use(params);
  const { address: profileAddress } = resolvedParams;
  const currentUser = useCurrentUser();

  // アドレスの形式チェック
  if (!isAddress(profileAddress)) {
    notFound();
  }

  // 自分以外のプロフィールを見ている場合
  const isOwnProfile = connectedAddress?.toLowerCase() === profileAddress.toLowerCase();

  // 未接続で自分のプロフィールを見ようとした場合はホームにリダイレクト
  useEffect(() => {
    if (!isConnected && isOwnProfile) {
      router.push('/');
    }
  }, [isConnected, isOwnProfile, router]);

  // 現在のネットワーク情報を取得
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [currentNetworkKey, setCurrentNetworkKey] = useState<string>('sepolia');
  const currentNetwork = currentChainId ? Object.values(NETWORKS).find(network => network.chainId === currentChainId) : null;

  // ネットワーク情報の初期化
  useEffect(() => {
    const initializeNetwork = async () => {
      try {
        // Use wagmi chainId first, fallback to MetaMask
        const detectedChainId = chainId || await getCurrentChainId();
        if (detectedChainId) {
          setCurrentChainId(detectedChainId);
          const network = Object.values(NETWORKS).find(network => network.chainId === detectedChainId);
          if (network) {
            const networkKey = Object.keys(NETWORKS).find(key => NETWORKS[key].chainId === detectedChainId);
            if (networkKey) {
              setCurrentNetworkKey(networkKey);
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize network:', error);
        // デフォルトのSepoliaネットワークを使用
        setCurrentChainId(11155111);
        setCurrentNetworkKey('sepolia');
      }
    };

    initializeNetwork();
  }, [chainId, getCurrentChainId]);

  const {
    positionTokens,
    totalPortfolioValue,
    isLoading: portfolioLoading
  } = useOnChainPortfolio(profileAddress);

  const { balance: tokenBalance, isLoading: tokenLoading } = useToken(profileAddress, currentNetworkKey);

  // Use portfolio history hook for chart data
  const {
    historyData,
    transactions,
    isLoading: historyLoading,
    error: historyError,
    refreshHistory,
    profitLoss,
    setPeriod
  } = usePortfolioHistory(profileAddress, currentNetworkKey);

  // Get external user profile information
  const { userProfile: externalUserProfile, isLoading: profileLoading } = useUserProfile(
    !isOwnProfile ? profileAddress : null
  );

  // Portfolio calculations (same logic as Header)
  const displayBalance = parseFloat(tokenBalance) || 0;
  const positionsValue = positionTokens.reduce((sum, token) => sum + token.value, 0);
  const calculatedPortfolioValue = totalPortfolioValue || (displayBalance + positionsValue);
  const portfolioValue = calculatedPortfolioValue;
  const cashValue = displayBalance;

  // Calculate trading metrics from on-chain data only
  // Exclude 'claim' transactions (token claims) from trading volume
  const volumeTraded = transactions?.reduce((sum, tx) => {
    // Only count actual trading activity, not token claims
    if (tx.type === 'claim') return sum;
    return sum + (tx.value || 0);
  }, 0) || 0;
  const uniqueMarkets = new Set(positionTokens.map(token => token.marketId)).size;
  const marketsTraded = uniqueMarkets;

  // Simple profit/loss calculation - just show current positions value minus cash invested
  const simpleProfitLoss = positionsValue > 0 ? positionsValue - 1000 : 0; // Assume 1000 PT initial investment

  // Debug logging for portfolio data
  useEffect(() => {
    console.log('Profile Portfolio Debug:', {
      profileAddress,
      currentNetworkKey,
      tokenBalance,
      displayBalance,
      positionTokens: positionTokens.length,
      totalPortfolioValue,
      portfolioValue,
      cashValue,
      tokenLoading,
      portfolioLoading
    });
  }, [profileAddress, currentNetworkKey, tokenBalance, displayBalance, positionTokens, totalPortfolioValue, portfolioValue, cashValue, tokenLoading, portfolioLoading]);

  // Block explorer URLを動的に生成
  const getBlockExplorerUrl = (address: string) => {
    if (!currentNetwork?.blockExplorerUrls || currentNetwork.blockExplorerUrls.length === 0) {
      // デフォルトはSepolia
      return `https://sepolia.etherscan.io/address/${address}`;
    }
    return `${currentNetwork.blockExplorerUrls[0]}/address/${address}`;
  };

  const getBlockExplorerName = () => {
    if (currentChainId === 11155111) return 'Etherscan (Sepolia)'; // Sepolia
    if (currentChainId === 31337) return 'Local Explorer'; // Anvil
    return 'BlockExplorer';
  };

  // アドレスの短縮表示
  const shortAddress = `${profileAddress.slice(0, 6)}...${profileAddress.slice(-4)}`;

  return (
    <>
      <Header showSearch={false} />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isOwnProfile ? 'マイプロフィール' : 'ユーザープロフィール'}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              {/* Block Explorer button removed - wallet address now clickable */}
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <div className="h-20 w-20 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 relative">
                  <img
                    src={getUserAvatarUrl({
                      profileImage: isOwnProfile
                        ? currentUser.profileImage
                        : externalUserProfile?.profileImage,
                      walletAddress: profileAddress,
                      twitterId: isOwnProfile
                        ? currentUser.twitterId
                        : externalUserProfile?.twitterUsername
                    }, 80)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallbackElement = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallbackElement) {
                        fallbackElement.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="w-full h-full bg-gray-600 rounded-full items-center justify-center absolute inset-0 hidden">
                    <UserCircleIcon className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-xl font-semibold text-gray-900">
                    <a
                      href={getBlockExplorerUrl(profileAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline cursor-pointer"
                    >
                      {isOwnProfile
                        ? (currentUser.displayName || profileAddress)
                        : (externalUserProfile?.displayName || profileAddress)
                      }
                    </a>
                  </h2>
                  {((isOwnProfile && currentUser.twitterUsername) ||
                    (!isOwnProfile && externalUserProfile?.twitterUsername)) && (
                      <span className="text-sm text-gray-500">
                        @{isOwnProfile ? currentUser.twitterUsername : externalUserProfile?.twitterUsername}
                      </span>
                    )}
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <span className="flex items-center space-x-2">
                    <WalletIcon className="h-4 w-4" />
                    <span>{currentNetwork?.displayName || 'Unknown Network'}</span>
                  </span>
                  {/* Twitter account information */}
                  {((isOwnProfile && currentUser.twitterUsername) ||
                    (!isOwnProfile && externalUserProfile?.twitterUsername)) && (
                      <a
                        href={`https://x.com/${isOwnProfile ? currentUser.twitterUsername : externalUserProfile?.twitterUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        <span>@{isOwnProfile ? currentUser.twitterUsername : externalUserProfile?.twitterUsername}</span>
                      </a>
                    )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Portfolio Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Positions Value Card */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-600">ポジション価値</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {portfolioLoading ? '読み込み中...' : Math.floor(positionsValue || 0).toLocaleString()} PT
                  </p>
                </div>
                <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="h-8 w-8 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profit/Loss Card */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-600">損益</p>
                  </div>
                  <p className={`text-3xl font-bold ${
                    simpleProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {portfolioLoading ? '読み込み中...' : `${simpleProfitLoss >= 0 ? '+' : ''}${Math.floor(simpleProfitLoss).toLocaleString()}`} PT
                  </p>
                </div>
                <div className={`h-16 w-16 rounded-lg flex items-center justify-center ${
                  simpleProfitLoss >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <TrophyIcon className={`h-8 w-8 ${
                    simpleProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Volume Traded Card */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-600">取引量</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {portfolioLoading ? '読み込み中...' : Math.floor(volumeTraded || 0).toLocaleString()} PT
                  </p>
                </div>
                <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BanknotesIcon className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Markets Traded Card */}
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-600">参加マーケット</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {portfolioLoading ? '読み込み中...' : marketsTraded}
                  </p>
                </div>
                <div className="h-16 w-16 bg-purple-100 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Performance Chart */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">ポートフォリオ推移</h2>
              {historyError && (
                <button
                  onClick={refreshHistory}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  再読み込み
                </button>
              )}
            </div>

            {historyError && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  💡 履歴データを取得できませんでした。デモデータを表示しています。
                </p>
              </div>
            )}

            <PortfolioChart
              data={historyData}
              profitLoss={profitLoss}
              period={profitLoss.period}
              onPeriodChange={setPeriod}
              isLoading={historyLoading}
              currencySymbol="PT"
            />
          </CardContent>
        </Card>

        {/* Transaction History */}
        <TransactionHistory
          transactions={transactions}
          currentAddress={profileAddress}
          isLoading={historyLoading}
          blockExplorerUrl={currentNetwork?.blockExplorerUrls?.[0] || 'https://sepolia.etherscan.io'}
        />

        {/* Other User Info */}
        {!isOwnProfile && (
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm mb-8">
            <CardContent className="p-6">
              <div className="text-center py-8">
                <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <UserCircleIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {(externalUserProfile?.displayName || profileAddress)} のプロフィール
                </h3>
                {externalUserProfile?.hasProfile ? (
                  <div className="space-y-2">
                    {externalUserProfile.twitterUsername && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Twitter:</span> @{externalUserProfile.twitterUsername}
                      </p>
                    )}
                    <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                      このユーザーの公開ポートフォリオ情報を表示しています。
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                    このアドレスのユーザー情報は公開されていません。<br />
                    ポートフォリオ情報のみ表示されています。
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}


      </main>
    </>
  );
}
