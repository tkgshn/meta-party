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
  CogIcon,
} from '@heroicons/react/24/outline';
import ClientOnly from './ClientOnly';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useToken } from '@/hooks/useToken';
import { useWagmiToken } from '@/hooks/useWagmiToken';
import { useOnChainPortfolio } from '@/hooks/useOnChainPortfolio';
import { usePlayToken } from '@/hooks/usePlayToken';
import { useSponsoredClaim } from '@/hooks/useSponsoredClaim';
import { useSocialAuth } from '@/hooks/useSocialAuth';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { NETWORKS, getNetworkByChainId, getCurrencySymbol, DEFAULT_NETWORK } from '@/config/networks';
import NetworkSwitcher from './NetworkSwitcher';
import { Button } from '@/components/ui/button';
import { getClaimStatus, setClaimStatus, hasClaimedAnywhere } from '@/lib/claimStorage';

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

  // Use Reown/wagmi hooks
  const { address: account, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  // Detect current network - start with default network from branch
  const [currentNetworkKey, setCurrentNetworkKey] = useState<string | null>(DEFAULT_NETWORK);

  // Get current user information from Twitter authentication
  const currentUser = useCurrentUser();

  // Check if user is authorized admin
  const whitelistedAddress = '0x2c5329fFa2A1f02A241Ec1932b4358bf71e158ae';
  const isAdmin = account && account.toLowerCase() === whitelistedAddress.toLowerCase();

  useEffect(() => {
    const detectNetwork = () => {
      // If we have a chainId from wagmi, use it
      if (chainId) {
        try {
          const network = getNetworkByChainId(chainId);
          if (network) {
            const networkKey = Object.keys(NETWORKS).find(
              key => NETWORKS[key].chainId === chainId
            );
            if (networkKey) {
              setCurrentNetworkKey(networkKey);
              return;
            }
          }
        } catch (error) {
          console.error('Failed to detect network:', error);
        }
      }
      
      // Fallback: If no chainId or detection fails, use default network
      // This handles Twitter auth (Magic Link) cases where chainId might not be available
      if (!currentNetworkKey) {
        setCurrentNetworkKey(DEFAULT_NETWORK);
      }
    };

    detectNetwork();
  }, [chainId, currentNetworkKey]);

  // Use wagmi token hook for social wallets (Reown/WalletConnect)
  const {
    balance: wagmiTokenBalance,
    refreshBalance: wagmiRefreshBalance,
    claimTokens: wagmiClaimTokens,
    hasClaimed: wagmiHasClaimed,
    canClaim: wagmiCanClaim,
    isLoading: wagmiLoading,
    isWagmiAvailable
  } = useWagmiToken(currentNetworkKey || 'sepolia');

  // Use traditional token hook for browser wallets (MetaMask)
  const {
    balance: tokenBalance,
    refreshBalance,
    claimTokens: claimFromTokenHook,
    hasClaimed: tokenHookHasClaimed,
    canClaim: tokenHookCanClaim,
    addTokenToMetaMask: tokenHookAddToMetaMask,
    isLoading: tokenHookLoading
  } = useToken(account || null, currentNetworkKey || 'sepolia');

  // Check localStorage for claim status to ensure consistency across browsers
  const localClaimStatus = account && currentNetworkKey ? getClaimStatus(account, currentNetworkKey) : null;
  
  // For Twitter authenticated users, check if they've claimed anywhere
  const hasClaimedWithTwitter = currentUser.authenticated && currentUser.twitterId ? 
    hasClaimedAnywhere(currentUser.twitterId) : false;

  // Determine which hook to use based on wallet type
  // Use wagmi for social wallets (no window.ethereum) or when wagmi is the only option
  const isUsingWagmi = isWagmiAvailable && (typeof window === 'undefined' || !window.ethereum);
  const actualBalance = isUsingWagmi ? wagmiTokenBalance : tokenBalance;
  const actualRefreshBalance = isUsingWagmi ? wagmiRefreshBalance : refreshBalance;
  const actualClaimTokens = isUsingWagmi ? wagmiClaimTokens : claimFromTokenHook;
  
  // Enhanced hasClaimed logic: check both chain state and localStorage
  const chainHasClaimed = isUsingWagmi ? wagmiHasClaimed : tokenHookHasClaimed;
  const localHasClaimed = localClaimStatus?.hasClaimed || hasClaimedWithTwitter;
  const actualHasClaimed = chainHasClaimed || localHasClaimed;
  
  const actualCanClaim = isUsingWagmi ? wagmiCanClaim : tokenHookCanClaim;
  const actualIsLoading = isUsingWagmi ? wagmiLoading : tokenHookLoading;

  // Use on-chain portfolio data
  const {
    positionTokens,
    totalPortfolioValue,
    isLoading: portfolioLoading
  } = useOnChainPortfolio(account || null);

  // Use Play Token hook for claim status and functionality (only when needed)
  const playTokenHook = usePlayToken(account || null);
  const {
    balance: playTokenBalance,
    hasClaimed,
    isLoading: playTokenLoading,
    claimTokens: claimPlayToken,
    isContractsAvailable,
    currentChainId,
    networkConfig
  } = playTokenHook;

  // Use sponsored claim hook for gasless claiming
  const { claimSponsored, isLoading: sponsoredClaimLoading } = useSponsoredClaim();

  // Calculate portfolio value with Play Token priority
  // Use appropriate balance based on network
  const displayBalance = parseFloat(actualBalance) || 0;

  const positionsValue = positionTokens.reduce((sum, token) => sum + token.value, 0);
  const portfolioValue = isConnected ? (totalPortfolioValue || (displayBalance + positionsValue)) : 0;
  const cashValue = isConnected ? displayBalance : 0;

  // Always use PT as the display symbol across all networks
  const displaySymbol = 'PT';

  // Use appropriate loading state - only show loading during manual refresh
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const isBalanceLoading = manualRefreshing;

  // Handle wallet disconnect
  const handleDisconnect = async () => {
    await disconnect();
    setShowUserMenu(false);
  };

  // Switch to Sepolia network
  const switchToSepolia = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected');
    }

    try {
      // Try to switch to Sepolia
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID
      });
    } catch (switchError: any) {
      // If the chain hasn't been added to MetaMask, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xaa36a7',
            chainName: 'Sepolia Testnet',
            nativeCurrency: {
              name: 'Sepolia Ether',
              symbol: 'SEP',
              decimals: 18
            },
            rpcUrls: ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          }]
        });
      } else {
        throw switchError;
      }
    }
  };


  // Initial load when account changes - for all supported networks
  useEffect(() => {
    if (account) {
      actualRefreshBalance();
    }
  }, [account, currentNetworkKey, actualRefreshBalance]);

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

  // Handle wallet connection with Reown
  const handleConnect = async () => {
    try {
      await open();
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
                {/* Play Token Portfolio Display */}
                <div className="hidden lg:flex items-center space-x-3 text-sm">
                  <Link href="/portfolio" className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer group whitespace-nowrap">
                    <ChartBarIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-600 group-hover:text-blue-700">ポートフォリオ:</span>
                    <span className="font-semibold text-gray-900 group-hover:text-blue-700">
                      {isBalanceLoading ? '...' : Math.floor(portfolioValue).toLocaleString()} PT
                    </span>
                  </Link>
                  <Link href="/portfolio" className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-green-50 transition-colors cursor-pointer group whitespace-nowrap">
                    <CurrencyDollarIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-gray-600 group-hover:text-green-700">キャッシュ:</span>
                    <span className="font-semibold text-gray-900 group-hover:text-green-700">
                      {isBalanceLoading ? '...' : Math.floor(cashValue).toLocaleString()} PT
                    </span>
                  </Link>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  {/* Unified Claim Button - show when network detection is complete */}
                  {account && currentNetworkKey && (
                    <>
                      {/* Show claim button for Sepolia - prioritize showing for first-time users */}
                      {currentNetworkKey === 'sepolia' && (actualCanClaim || (!actualHasClaimed && !isUsingWagmi)) && (
                        <button
                          onClick={async () => {
                            setManualRefreshing(true);
                            try {
                              // Try sponsored claim first for Sepolia, fallback to regular claim
                              let result;
                              if (!isUsingWagmi) {
                                result = await claimSponsored(account);
                                if (!result.success && actualClaimTokens) {
                                  // Fallback to regular claim
                                  result = await actualClaimTokens();
                                }
                              } else if (actualClaimTokens) {
                                // Use regular claim for wagmi wallets
                                result = await actualClaimTokens();
                              } else {
                                result = { success: false, error: 'Claim function not available' };
                              }

                              // Update localStorage on successful claim
                              if (result.success && account && currentNetworkKey) {
                                setClaimStatus({
                                  hasClaimed: true,
                                  claimDate: new Date().toISOString(),
                                  txHash: result.txHash,
                                  twitterId: currentUser.twitterId,
                                  walletAddress: account,
                                  networkKey: currentNetworkKey
                                });
                              }

                          if (!result.success) {
                            if (result.error?.includes('ガス代') || result.error?.includes('insufficient funds')) {
                              let faucetUrl = 'https://faucet.polygon.technology/';
                              let networkName = 'testnet';

                              // Sepolia faucet URL
                              faucetUrl = 'https://sepoliafaucet.com/';
                              networkName = 'Sepolia';

                              alert(`ガス代が不足しています。${networkName}フォーセットからテストトークンを取得してください: ${faucetUrl}`);
                            } else {
                              alert(`エラー: ${result.error || 'トークンの取得に失敗しました'}`);
                            }
                          } else {
                            // Success - refresh balance and auto-add token to MetaMask
                            await actualRefreshBalance();
                            
                            // Update localStorage on successful claim
                            if (account && currentNetworkKey) {
                              setClaimStatus({
                                hasClaimed: true,
                                claimDate: new Date().toISOString(),
                                txHash: result.txHash,
                                twitterId: currentUser.twitterId,
                                walletAddress: account,
                                networkKey: currentNetworkKey
                              });
                            }
                            
                            setTimeout(async () => {
                              try {
                                // Only try to add token if using browser wallet
                                if (!isUsingWagmi && tokenHookAddToMetaMask) {
                                  await tokenHookAddToMetaMask();
                                }
                              } catch (error) {
                                console.log('MetaMask token add failed (optional):', error);
                              }
                            }, 2000);

                            const successMessage = '🎉 1,000 PT を無料で受け取りました！';
                            alert(successMessage);
                          }
                        } catch (error) {
                          console.error('Claim failed:', error);
                          alert('トークンの受け取りに失敗しました。もう一度お試しください。');
                        } finally {
                          setManualRefreshing(false);
                        }
                      }}
                      disabled={sponsoredClaimLoading || actualIsLoading || manualRefreshing}
                      className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-lg transition-colors ${
                        !actualHasClaimed && actualCanClaim 
                          ? 'border-green-600 text-white bg-green-600 hover:bg-green-700 shadow-lg animate-pulse disabled:bg-gray-400' 
                          : 'border-purple-600 text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400'
                      }`}
                      title="1,000 Play Tokenを受け取れます"
                    >
                      <PlusCircleIcon className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">
                          {(sponsoredClaimLoading || manualRefreshing) ? '取得中...' : 
                           (!actualHasClaimed && actualCanClaim ? '🎁 初回ボーナス受け取り' : 'サインアップボーナス')}
                      </span>
                      <span className="sm:hidden">
                        {(sponsoredClaimLoading || manualRefreshing) ? '...' : 
                         (!actualHasClaimed && actualCanClaim ? '🎁 初回' : 'ボーナス')}
                      </span>
                    </button>
                  )}

                  {/* Show network switch button for non-Sepolia networks - show for first-time users */}
                  {currentNetworkKey !== 'sepolia' && (actualCanClaim || (!actualHasClaimed && !isUsingWagmi)) && (
                    <button
                      onClick={async () => {
                        try {
                          await switchToSepolia();
                          alert('Sepoliaネットワークに切り替えました！サインアップボーナスを受け取れます。');
                        } catch (error) {
                          console.error('Network switch failed:', error);
                          alert('ネットワークの切り替えに失敗しました。手動でSepoliaテストネットに切り替えてください。');
                        }
                      }}
                      className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-lg transition-colors ${
                        !actualHasClaimed && (actualCanClaim || (!actualHasClaimed && !isUsingWagmi))
                          ? 'border-orange-500 text-white bg-orange-500 hover:bg-orange-600 shadow-lg animate-pulse'
                          : 'border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100'
                      }`}
                      title="Sepoliaに切り替えてサインアップボーナスを受け取る"
                    >
                      <PlusCircleIcon className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">
                        {!actualHasClaimed && (actualCanClaim || (!actualHasClaimed && !isUsingWagmi)) 
                          ? '🎁 初回ボーナスを受け取る' 
                          : 'Sepoliaに切り替え'}
                      </span>
                      <span className="sm:hidden">
                        {!actualHasClaimed && (actualCanClaim || (!actualHasClaimed && !isUsingWagmi)) 
                          ? '🎁 初回' 
                          : 'Sepolia'}
                      </span>
                    </button>
                  )}
                </>
              )}

                  {/* Legacy Play Token Claim Button - hidden but kept for reference */}
                  {false && tokenHookCanClaim && claimFromTokenHook && (
                    <button
                      onClick={async () => {
                        setManualRefreshing(true);
                        try {
                          const result = await claimFromTokenHook();
                          if (!result.success) {
                            if (result.error?.includes('ガス代') || result.error?.includes('insufficient funds')) {
                              let faucetUrl = 'https://faucet.polygon.technology/';
                              let networkName = 'testnet';

                              // Sepolia faucet URL
                              faucetUrl = 'https://sepoliafaucet.com/';
                              networkName = 'Sepolia';

                              alert(`ガス代が不足しています。${networkName}フォーセットからテストトークンを取得してください: ${faucetUrl}`);
                            } else {
                              alert(`エラー: ${result.error || 'トークンの取得に失敗しました'}`);
                            }
                          } else {
                            // Success - refresh balance and auto-add token to MetaMask
                            await actualRefreshBalance();
                            
                            // Update localStorage on successful claim
                            if (account && currentNetworkKey) {
                              setClaimStatus({
                                hasClaimed: true,
                                claimDate: new Date().toISOString(),
                                txHash: result.txHash,
                                twitterId: currentUser.twitterId,
                                walletAddress: account,
                                networkKey: currentNetworkKey
                              });
                            }
                            
                            setTimeout(async () => {
                              try {
                                // Only try to add token if using browser wallet
                                if (!isUsingWagmi && tokenHookAddToMetaMask) {
                                  await tokenHookAddToMetaMask();
                                }
                              } catch (error) {
                                console.log('MetaMask token add failed (optional):', error);
                              }
                            }, 2000);
                            alert('1,000 PT の受け取りが完了しました！');
                          }
                        } catch (error) {
                          console.error('Claim failed:', error);
                          alert('トークンの受け取りに失敗しました。もう一度お試しください。');
                        } finally {
                          setManualRefreshing(false);
                        }
                      }}
                      disabled={tokenHookLoading || manualRefreshing}
                      className="inline-flex items-center px-3 py-2 border border-green-600 text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    >
                      <PlusCircleIcon className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">
                        {(tokenHookLoading || manualRefreshing) ? 'Claiming...' : '1,000 PT受け取る'}
                      </span>
                      <span className="sm:hidden">
                        {(tokenHookLoading || manualRefreshing) ? '...' : 'Claim'}
                      </span>
                    </button>
                  )}

                  {/* Network Status Message - for unsupported networks */}
                  {!actualCanClaim && !actualClaimTokens && currentChainId && (
                    <div className="flex items-center space-x-2">
                      <div className="inline-flex items-center px-3 py-2 border border-yellow-400 text-sm font-medium rounded-lg text-yellow-700 bg-yellow-50">
                        <InformationCircleIcon className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">
                          サポート対象外のネットワークです
                        </span>
                        <span className="sm:hidden">
                          未対応
                        </span>
                      </div>
                      <NetworkSwitcher className="text-sm" />
                    </div>
                  )}

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
                          <Link href={`/profile/${account}`} className="text-sm font-medium text-gray-900 hover:underline">
                            {account.slice(0, 6)}...{account.slice(-4)}
                          </Link>
                          <div className="flex items-center space-x-2 text-xs mt-1">
                            <span className="text-gray-500">
                              {NETWORKS[currentNetworkKey]?.displayName || 'Unknown Network'}
                            </span>
                            {NETWORKS[currentNetworkKey]?.isTestnet && (
                              <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                テストネット
                              </span>
                            )}
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
                            href={`/profile/${account}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 mr-2" />
                              プロフィール
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
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">
                                {(portfolioLoading || isBalanceLoading) ? '...' : Math.floor(displayBalance).toLocaleString()} PT
                              </div>
                              <div className="text-xs text-green-600">Live</div>
                            </div>
                          </div>
                        </Link>

                        {/* Admin Dashboard - only show for authorized users */}
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <div className="flex items-center">
                              <CogIcon className="h-4 w-4 mr-2" />
                              管理ダッシュボード
                            </div>
                          </Link>
                        )}

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
              <Button
                onClick={handleConnect}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <WalletIcon className="h-4 w-4 mr-2" />
                サインアップ
              </Button>
            )}
            </ClientOnly>
          </div>
        </div>
      </div>

      {/* Aboutモーダル */}
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} step={aboutStep} setStep={setAboutStep} account={account || null} />

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
