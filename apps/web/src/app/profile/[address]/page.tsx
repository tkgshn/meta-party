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
  ClockIcon
} from '@heroicons/react/24/outline';
import TwitterVolunteerCard from '@/components/TwitterVolunteerCard';
import { useOnChainPortfolio } from '@/hooks/useOnChainPortfolio';
import { useToken } from '@/hooks/useToken';
import { useMetaMask } from '@/hooks/useMetaMask';
import { NETWORKS } from '@/config/networks';
import { isAddress } from 'viem';
import Header from '@/components/Header';

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
  const currentNetworkKey = currentNetwork ? Object.keys(NETWORKS).find(key => NETWORKS[key].chainId === currentChainId) || 'polygonAmoy' : 'polygonAmoy';

  const { 
    positionTokens, 
    totalPortfolioValue, 
    isLoading: portfolioLoading 
  } = useOnChainPortfolio(profileAddress);

  const { balance: tokenBalance } = useToken(profileAddress, currentNetworkKey);

  // Block explorer URLを動的に生成
  const getBlockExplorerUrl = (address: string) => {
    if (!currentNetwork?.blockExplorer) {
      // デフォルトはPolygon Amoy
      return `https://amoy.polygonscan.com/address/${address}`;
    }
    return `${currentNetwork.blockExplorer}/address/${address}`;
  };

  const getBlockExplorerName = () => {
    if (currentChainId === 137) return 'PolygonScan'; // Polygon Mainnet
    if (currentChainId === 80002) return 'PolygonScan (Amoy)'; // Polygon Amoy
    if (currentChainId === 11155111) return 'Etherscan (Sepolia)'; // Sepolia
    return 'BlockExplorer';
  };

  // アドレスの短縮表示
  const shortAddress = `${profileAddress.slice(0, 6)}...${profileAddress.slice(-4)}`;

  return (
    <>
      <Header showSearch={false} />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full"
        style={{ backgroundColor: '#f9fafb' }}>
        {/* プロフィールヘッダー */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <UserCircleIcon className="h-12 w-12 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {isOwnProfile ? 'マイプロフィール' : 'ユーザープロフィール'}
                </h1>
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
            
            {/* 外部リンク */}
            <div className="flex space-x-3">
              <a
                href={getBlockExplorerUrl(profileAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200 hover:border-blue-200"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                <span>{getBlockExplorerName()}</span>
              </a>
            </div>
          </div>
        </div>

        {/* ポートフォリオ概要 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <ChartBarIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              ポートフォリオ概要
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-600 font-medium mb-2">
                    キャッシュ
                  </div>
                  <div className="text-3xl font-bold text-blue-900 mb-1">
                    {portfolioLoading ? '...' : Math.floor(Number(tokenBalance)).toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700 font-medium">PT</div>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <WalletIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-green-600 font-medium mb-2">
                    ポジション数
                  </div>
                  <div className="text-3xl font-bold text-green-900 mb-1">
                    {positionTokens.length}
                  </div>
                  <div className="text-sm text-green-700 font-medium">マーケット</div>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-purple-600 font-medium mb-2">
                    総資産価値
                  </div>
                  <div className="text-3xl font-bold text-purple-900 mb-1">
                    {portfolioLoading ? '...' : Math.floor(totalPortfolioValue).toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-700 font-medium">PT</div>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <LinkIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* 他人のプロフィールを見ている場合の情報 */}
        {!isOwnProfile && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="text-center py-8">
              <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <UserCircleIcon className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {shortAddress} のプロフィール
              </h3>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                このユーザーの公開ポートフォリオ情報を表示しています。<br />
                個人設定やTwitter連携などの機能は自分のプロフィールでのみ利用可能です。
              </p>
            </div>
          </div>
        )}

        {/* アクションボタン（自分のプロフィールの場合） */}
        {isOwnProfile && isConnected && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  クイックアクション
                </h3>
                <p className="text-sm text-gray-600">
                  よく使用する機能への素早いアクセス
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => router.push('/portfolio')}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                >
                  <ChartBarIcon className="h-5 w-5" />
                  <span>ポートフォリオ詳細</span>
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
                >
                  <LinkIcon className="h-5 w-5" />
                  <span>マーケット一覧</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}