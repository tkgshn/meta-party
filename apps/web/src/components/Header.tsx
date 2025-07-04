'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  BellIcon,
  UserIcon,
  ChevronDownIcon,
  WalletIcon,
  CurrencyDollarIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  PlusCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import '@/types/ethereum';
import { usePlayToken } from '@/hooks/usePlayToken';

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
  const pathname = usePathname();
  const [account, setAccount] = useState<string | null>(null);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [aboutStep, setAboutStep] = useState(0);

  // Use PlayToken hook for real balance
  const { balance: playTokenBalance, refreshBalance } = usePlayToken(account);

  /**
   * ウォレット接続処理。多重リクエストを防止し、エラー時はユーザーに分かりやすいメッセージを表示する。
   */
  const connectWallet = async () => {
    if (isConnecting) return; // 多重リクエスト防止
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        setIsConnecting(true);
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setAccount((accounts as string[])[0]);

        // Switch to Polygon Amoy if needed
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x13882' }], // Polygon Amoy
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            // Network not added, add it
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x13882',
                chainName: 'Polygon Amoy Testnet',
                nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
                rpcUrls: ['https://rpc-amoy.polygon.technology/'],
                blockExplorerUrls: ['https://amoy.polygonscan.com/'],
              }],
            });
          }
        }
      } catch (error: any) {
        console.error('Failed to connect wallet:', error);
        // MetaMaskのエラー内容をユーザーに表示
        let message = 'ウォレット接続に失敗しました。';
        if (error && error.message) {
          message += `\n${error.message}`;
        }
        alert(message);
      } finally {
        setIsConnecting(false);
      }
    } else {
      alert('MetaMaskが見つかりません。MetaMaskをインストールしてください。');
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setPortfolioValue(0);
    setShowUserMenu(false);
  };

  // Check if already connected
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts) => {
          const accountsArray = accounts as string[];
          if (accountsArray.length > 0) {
            setAccount(accountsArray[0]);
          }
        });
    }
  }, []);

  // Refresh balance when account changes
  useEffect(() => {
    if (account) {
      refreshBalance();
      // Mock portfolio value for now - can be replaced with actual calculation
      setPortfolioValue(Number(playTokenBalance));
    } else {
      setPortfolioValue(0);
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

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                demo
              </h1>
            </Link>

            {/* Search Bar */}
            {showSearch && (
              <div className="hidden md:flex items-center ml-8 space-x-4">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={handleSearchChange}
                    placeholder="市場を検索..."
                    className="block w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </form>
                {/* 仕組みについてボタン */}
                {!account && (
                  <button
                    className="ml-4 flex items-center text-blue-600 hover:underline text-sm font-medium transition-colors focus:outline-none"
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
            {account ? (
              <div className="flex items-center space-x-4">
                {/* Portfolio Value */}
                <div className="hidden lg:flex items-center space-x-4 text-sm">
                  <Link href="/portfolio" className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer group">
                    <ChartBarIcon className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-600 group-hover:text-blue-700">ポートフォリオ:</span>
                    <span className="font-semibold text-gray-900 group-hover:text-blue-700">
                      {portfolioValue.toLocaleString()} PT
                    </span>
                  </Link>
                  <Link href="/portfolio" className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer group">
                    <CurrencyDollarIcon className="h-4 w-4 text-green-600" />
                    <span className="text-gray-600 group-hover:text-blue-700">キャッシュ:</span>
                    <span className="font-semibold text-gray-900 group-hover:text-blue-700">
                      {Number(playTokenBalance).toLocaleString()} PT
                    </span>
                  </Link>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <Link
                    href="/portfolio"
                    className="inline-flex items-center px-3 py-2 border border-blue-600 text-sm font-medium rounded-lg text-blue-600 bg-white hover:bg-blue-50 transition-colors"
                  >
                    <PlusCircleIcon className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">デポジット</span>
                  </Link>

                  <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    <BellIcon className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
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
                            Polygon Amoy Testnet
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
                          <div className="flex items-center">
                            <ChartBarIcon className="h-4 w-4 mr-2" />
                            ポートフォリオ
                          </div>
                        </Link>



                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="flex items-center">
                            <Cog6ToothIcon className="h-4 w-4 mr-2" />
                            設定
                          </div>
                        </button>

                        <div className="border-t border-gray-200 mt-1">
                          <button
                            onClick={disconnectWallet}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <div className="flex items-center">
                              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
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
                onClick={connectWallet}
                disabled={isConnecting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <WalletIcon className="h-4 w-4 mr-2" />
                {isConnecting ? 'ウォレット接続中...' : 'ウォレット接続'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Aboutモーダル */}
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} step={aboutStep} setStep={setAboutStep} account={account} />

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
