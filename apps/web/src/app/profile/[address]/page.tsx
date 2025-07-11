'use client';

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
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
import { useToken } from '@/hooks/useToken';
import { useMetaMask } from '@/hooks/useMetaMask';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { NETWORKS } from '@/config/networks';
import { isAddress } from 'viem';
import Header from '@/components/Header';
import { getUserAvatarUrl } from '@/utils/pixelAvatar';

interface ProfilePageProps {
  params: {
    address: string;
  };
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  const { getCurrentChainId } = useMetaMask();
  const router = useRouter();
  const { address: profileAddress } = params;
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
  const currentChainId = getCurrentChainId();
  const currentNetwork = currentChainId ? Object.values(NETWORKS).find(network => network.chainId === currentChainId) : null;
  const currentNetworkKey = currentNetwork ? Object.keys(NETWORKS).find(key => NETWORKS[key].chainId === currentChainId) || 'sepolia' : 'sepolia';

  const { 
    positionTokens, 
    totalPortfolioValue, 
    isLoading: portfolioLoading 
  } = useOnChainPortfolio(profileAddress);

  const { balance: tokenBalance } = useToken(profileAddress, currentNetworkKey);

  // Block explorer URLを動的に生成
  const getBlockExplorerUrl = (address: string) => {
    if (!currentNetwork?.blockExplorer) {
      // デフォルトはSepolia
      return `https://sepolia.etherscan.io/address/${address}`;
    }
    return `${currentNetwork.blockExplorer}/address/${address}`;
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
              <p className="text-gray-600">
                {isOwnProfile ? 'アカウント情報とポートフォリオ概要' : 'ユーザーの公開ポートフォリオ情報'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" asChild>
                <a
                  href={getBlockExplorerUrl(profileAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  <span>{getBlockExplorerName()}</span>
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Network Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${currentNetwork?.isTestnet ? 'bg-yellow-400' : 'bg-green-400'}`} />
              <div>
                <p className="text-sm font-medium text-gray-900">{currentNetwork?.displayName || 'Unknown Network'}</p>
                <p className="text-xs text-gray-500">
                  {currentNetwork?.isTestnet ? 'テストネット' : 'メインネット'} •
                  PT • チェーンID: {currentNetwork?.chainId}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-xs text-gray-500">
                アドレス: {shortAddress}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="bg-white border-gray-200 shadow-sm mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <div className="h-20 w-20 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 relative">
                  <img
                    src={getUserAvatarUrl({
                      profileImage: isOwnProfile ? currentUser.profileImage : undefined,
                      walletAddress: profileAddress,
                      twitterId: isOwnProfile ? currentUser.twitterId : undefined
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
                    {isOwnProfile && currentUser.displayName ? currentUser.displayName : shortAddress}
                  </h2>
                  {isOwnProfile && currentUser.twitterUsername && (
                    <span className="text-sm text-gray-500">
                      @{currentUser.twitterUsername}
                    </span>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3">
                  <p className="text-sm text-gray-600 font-mono">
                    {profileAddress}
                  </p>
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <span className="flex items-center space-x-2">
                    <WalletIcon className="h-4 w-4" />
                    <span>{currentNetwork?.displayName || 'Unknown Network'}</span>
                  </span>
                  {!isOwnProfile && (
                    <span className="flex items-center space-x-2">
                      <ClockIcon className="h-4 w-4" />
                      <span>公開プロフィール</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Cash Card */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-600">Cash</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {portfolioLoading ? '...' : Math.floor(Number(tokenBalance)).toLocaleString()} PT
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

          {/* Positions Card */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-600">Positions</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {positionTokens.length}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    アクティブポジション数
                  </p>
                </div>
                <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="h-8 w-8 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Portfolio Value Card */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-600">Portfolio</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {portfolioLoading ? '...' : Math.floor(totalPortfolioValue).toLocaleString()} PT
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    総資産価値（Cash + ポジション）
                  </p>
                </div>
                <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <TrophyIcon className="h-8 w-8 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Other User Info */}
        {!isOwnProfile && (
          <Card className="bg-white border-gray-200 shadow-sm mb-8">
            <CardContent className="p-6">
              <div className="text-center py-8">
                <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <UserCircleIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {shortAddress} のプロフィール
                </h3>
                <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                  このユーザーの公開ポートフォリオ情報を表示しています。<br />
                  個人設定やTwitter連携などの機能は自分のプロフィールでのみ利用可能です。
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        {isOwnProfile && isConnected && (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    クイックアクション
                  </h3>
                  <p className="text-sm text-gray-600">
                    よく使用する機能への素早いアクセス
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => router.push('/portfolio')}
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    <ChartBarIcon className="h-4 w-4 mr-2" />
                    ポートフォリオ詳細
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/')}
                    className="text-gray-600 border-gray-200 bg-gray-50 hover:bg-gray-100"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    マーケット一覧
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}