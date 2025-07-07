'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  BellIcon,
  UserIcon,
  ChevronDownIcon,
  WalletIcon,
  CurrencyDollarIcon,
  ArrowRightStartOnRectangleIcon,
  ChartBarIcon,
  PlusCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import ClientOnly from './ClientOnly';
import { useMetaMask } from '@/hooks/useMetaMask';
import { useToken } from '@/hooks/useToken';
import { useOnChainPortfolio } from '@/hooks/useOnChainPortfolio';
import { NETWORKS, getNetworkByChainId, getCurrencySymbol } from '@/config/networks';
import WalletModal from './WalletModal';

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
  showSearch?: boolean;
}

/**
 * プラットフォーム概要を3ステップで表示するモーダル
 */
function AboutModal({ open, onClose, step, setStep, account }: { open: boolean; onClose: () => void; step: number; setStep: (n: number) => void; account: string | null }) {
  const steps = [
    {
      title: '予測市場で社会課題を解決',
      desc: 'このプラットフォームは、社会課題の解決策を「予測市場」で評価・投資できるサービスです。みんなで未来の出来事や政策の成果を予測し、最適な解決策を見つけます。',
    },
    {
      title: 'Play Tokenで参加・投資',
      desc: 'ユーザーはウォレットを接続し、Play Token（PT）を受け取って市場に参加します。各市場で提案や選択肢にPTを投資し、予測に基づく意思決定に貢献できます。',
    },
    {
      title: '透明で公正な意思決定',
      desc: '取引量や価格の変動を通じて、どの解決策が有望かを可視化します。すべての取引や結果はブロックチェーン上で透明に管理され、公正な意思決定をサポートします。',
    },
  ];
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100/80">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative animate-fade-in">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl"
          onClick={onClose}
          aria-label="閉じる"
        >
          ×
        </button>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{steps[step].title}</h2>
          <p className="text-gray-700 text-sm whitespace-pre-line">{steps[step].desc}</p>
        </div>
        <div className="flex justify-between items-center mt-6">
          <div className="flex space-x-1">
            {steps.map((_, i) => (
              <span key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-blue-600' : 'bg-gray-300'}`}></span>
            ))}
          </div>
          <button
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            onClick={() => step < steps.length - 1 ? setStep(step + 1) : onClose()}
          >
            {step < steps.length - 1 ? '次へ' : (account ? '閉じる' : 'はじめる')}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * designdoc: ウォレット接続の多重リクエスト防止とユーザー向けエラーハンドリング
 *
 * - connectWallet関数は、isConnecting状態で多重リクエストを防止します。
 * - UIボタンもisConnectingでdisabledとなり、ユーザーの連打を防ぎます。
 * - それでも非同期的に多重リクエストが発生する場合、関数先頭でガードし、MetaMaskの"Already processing eth_requestAccounts"エラーを回避します。
 * - エラー発生時は、MetaMaskから返されるエラーメッセージをalertでユーザーに通知し、原因の特定を容易にします。
 */
export default function Header({ onSearch, searchQuery = '', showSearch = true }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [aboutStep, setAboutStep] = useState(0);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // Use enhanced MetaMask hook
  const {
    account,
    chainId,
    isConnected,
    isMetaMaskAvailable,
    isInitialized,
    connect,
    disconnect
  } = useMetaMask();

  // Detect current network
  const [currentNetworkKey, setCurrentNetworkKey] = useState<string>('polygon');

  useEffect(() => {
    const detectNetwork = () => {
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
    };

    detectNetwork();
  }, [chainId]);

  const currencySymbol = getCurrencySymbol(currentNetworkKey);

  // Use token hook for current network (matches portfolio page logic)
  const {
    balance: tokenBalance,
    symbol: tokenSymbol,
    isLoading: tokenLoading,
    refreshBalance
  } = useToken(account, currentNetworkKey);

  // Use on-chain portfolio data
  const {
    positionTokens,
    totalPortfolioValue,
    isLoading: portfolioLoading
  } = useOnChainPortfolio(account);

  // Calculate portfolio value using same logic as portfolio page
  const cash = parseFloat(tokenBalance) || 0;
  const positionsValue = positionTokens.reduce((sum, token) => sum + token.value, 0);
  const portfolioValue = isConnected ? (totalPortfolioValue || (cash + positionsValue)) : 0;
  const cashValue = isConnected ? cash : 0;

  // Handle wallet disconnect
  const handleDisconnect = async () => {
    await disconnect();
    setShowUserMenu(false);
  };

  // Refresh balance when account changes
  useEffect(() => {
    if (account) {
      refreshBalance();
    }
  }, [account, refreshBalance]);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    onSearch?.(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchInput);
  };

  // Handle wallet connection with proper checks
  const handleConnect = async () => {
    if (!isMetaMaskAvailable) {
      alert('MetaMaskがインストールされていません。\n\nMetaMaskをインストールしてから再度お試しください。\n\nhttps://metamask.io/download/');
      return;
    }
    
    if (!isInitialized) {
      alert('MetaMaskを初期化中です。もう一度お試しください。');
      return;
    }
    
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('ウォレット接続に失敗しました。もう一度お試しください。');
    }
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 min-w-0 gap-4">
          {/* Logo and Title */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                demo
              </h1>
            </Link>

            {/* Search Bar */}
            {showSearch && (
              <div className="hidden md:flex items-center ml-6 space-x-4 flex-1 max-w-md">
                <form onSubmit={handleSearchSubmit} className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={handleSearchChange}
                    placeholder="市場を検索..."
                    className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </form>
                {/* 仕組みについてボタン */}
                {!account && (
                  <button
                    className="ml-4 flex items-center text-blue-600 hover:underline text-sm font-medium transition-colors focus:outline-none whitespace-nowrap"
                    onClick={() => { setAboutStep(0); setAboutOpen(true); }}
                    type="button"
                    style={{ background: 'none', border: 'none', padding: 0 }}
                  >
                    <InformationCircleIcon className="w-5 h-5 mr-1" />
                    仕組みについて
                  </button>
                )}
              </div>
            )}
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-6">
            <ClientOnly fallback={
              <div className="w-32 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            }>
            {account ? (
              <div className="flex items-center space-x-4">
                {/* Portfolio Value */}
                <div className="hidden xl:flex items-center space-x-3 text-sm">
                  <Link href="/portfolio" className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer group whitespace-nowrap">
                    <ChartBarIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-600 group-hover:text-blue-700">ポートフォリオ:</span>
                    <span className="font-semibold text-gray-900 group-hover:text-blue-700">
                      {(portfolioLoading || tokenLoading) ? '...' : (
                        (tokenSymbol || currencySymbol) === 'MATIC'
                          ? portfolioValue.toFixed(4)
                          : Math.floor(portfolioValue).toLocaleString()
                      )} {tokenSymbol || currencySymbol}
                    </span>
                    {/* <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded ml-1 flex-shrink-0">
                      Live
                    </span> */}
                  </Link>
                  <Link href="/portfolio" className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer group whitespace-nowrap">
                    <CurrencyDollarIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-gray-600 group-hover:text-blue-700">キャッシュ:</span>
                    <span className="font-semibold text-gray-900 group-hover:text-blue-700">
                      {(portfolioLoading || tokenLoading) ? '...' : (
                        (tokenSymbol || currencySymbol) === 'MATIC'
                          ? cashValue.toFixed(4)
                          : Math.floor(cashValue).toLocaleString()
                      )} {tokenSymbol || currencySymbol}
                    </span>
                    {/* <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded ml-1 flex-shrink-0">
                      Live
                    </span> */}
                  </Link>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsWalletModalOpen(true)}
                    className="inline-flex items-center px-3 py-2 border border-blue-600 text-sm font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-colors"
                  >
                    <PlusCircleIcon className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">デポジット</span>
                  </button>

                  <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    <BellIcon className="h-5 w-5" />
                    {/* <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span> */}
                  </button>

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-white" />
                      </div>
                      <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                    </button>

                    {/* User Dropdown Menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <Link href={`/${account}`} className="text-sm font-medium text-gray-900 hover:underline">
                            {account.slice(0, 6)}...{account.slice(-4)}
                          </Link>
                          <div className="text-xs text-gray-500 mt-1">
                            {NETWORKS[currentNetworkKey]?.displayName || 'Unknown Network'}
                            {NETWORKS[currentNetworkKey]?.isTestnet && ' (テストネット)'}
                          </div>
                        </div>

                        {/* <div className="px-4 py-2 text-sm text-gray-700 bg-gray-50">
                          <Link href="/portfolio" className="flex justify-between">
                            <span>ポートフォリオ:</span>
                            <span className="font-semibold">{portfolioValue.toLocaleString()} PT</span>
                          </Link>
                          <Link href="/portfolio" className="flex justify-between mt-1">
                            <span>キャッシュ:</span>
                            <span className="font-semibold">{Number(playTokenBalance).toLocaleString()} PT</span>
                          </Link>
                        </div> */}

                          <Link
                            href={`/${account}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 mr-2" />
                              マイページ
                            </div>
                          </Link>

                        <Link
                          href="/portfolio"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center">
                              <ChartBarIcon className="h-4 w-4 mr-2" />
                              ポートフォリオ
                            </div>
                            {/* <div className="text-right">
                              <div className="font-semibold text-gray-900">
                                {(portfolioLoading || tokenLoading) ? '...' : (
                                  (tokenSymbol || currencySymbol) === 'MATIC'
                                    ? cashValue.toFixed(4)
                                    : Math.floor(cashValue).toLocaleString()
                                )} {tokenSymbol || currencySymbol}
                              </div>
                              <div className="text-xs text-green-600">Live</div> */}
                            {/* </div> */}
                          </div>
                        </Link>






                        <div className="border-t border-gray-200 mt-1">
                          <button
                            onClick={handleDisconnect}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <div className="flex items-center">
                              <ArrowRightStartOnRectangleIcon className="h-4 w-4 mr-2" />
                              ログアウト
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={!isInitialized}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg transition-colors ${
                  !isInitialized 
                    ? 'text-gray-400 bg-gray-200 cursor-not-allowed' 
                    : 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                <WalletIcon className="h-4 w-4 mr-2" />
                {!isInitialized ? '初期化中...' : 'ウォレット接続'}
              </button>
            )}
            </ClientOnly>
          </div>
        </div>
      </div>

      {/* Aboutモーダル */}
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} step={aboutStep} setStep={setAboutStep} account={account} />

      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />

      {/* Mobile Search */}
      {showSearch && (
        <div className="md:hidden border-t border-gray-200 px-4 py-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="市場を検索..."
              className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </form>
        </div>
      )}
    </header>
  );
}
