'use client';

import { useState, useEffect } from 'react';
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
} from '@heroicons/react/24/outline';
import '@/types/ethereum';
import { usePlayToken } from '@/hooks/usePlayToken';

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
  showSearch?: boolean;
}

export default function Header({ onSearch, searchQuery = '', showSearch = true }: HeaderProps) {
  const pathname = usePathname();
  const [account, setAccount] = useState<string | null>(null);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery);

  // Use PlayToken hook for real balance
  const { balance: playTokenBalance, refreshBalance } = usePlayToken(account);

  // MetaMask connection logic
  const connectWallet = async () => {
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
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      } finally {
        setIsConnecting(false);
      }
    } else {
      alert('MetaMask not found. Please install MetaMask.');
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setPlayTokenBalance(0);
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
      setPortfolioValue(1250);
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
                futarchy demo
              </h1>
              {/* <span className="ml-2 text-sm text-gray-500">
                Futarchy Platform
              </span> */}
            </Link>

            {/* Search Bar */}
            {showSearch && (
              <div className="hidden md:block ml-8">
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
              </div>
            )}
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-6">
            {account ? (
              <div className="flex items-center space-x-4">
                {/* Portfolio Value */}
                <div className="hidden lg:flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <ChartBarIcon className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-600">ポートフォリオ:</span>
                    <span className="font-semibold text-gray-900">
                      {portfolioValue.toLocaleString()} PT
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CurrencyDollarIcon className="h-4 w-4 text-green-600" />
                    <span className="text-gray-600">キャッシュ:</span>
                    <span className="font-semibold text-gray-900">
                      {Number(playTokenBalance).toLocaleString()} PT
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <Link
                    href="/dashboard"
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
                          <div className="text-sm font-medium text-gray-900">
                            {account.slice(0, 6)}...{account.slice(-4)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Polygon Amoy Testnet
                          </div>
                        </div>

                        <div className="px-4 py-2 text-sm text-gray-700 bg-gray-50">
                          <div className="flex justify-between">
                            <span>ポートフォリオ:</span>
                            <span className="font-semibold">{portfolioValue.toLocaleString()} PT</span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span>キャッシュ:</span>
                            <span className="font-semibold">{Number(playTokenBalance).toLocaleString()} PT</span>
                          </div>
                        </div>

                        <Link
                          href="/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-2" />
                            プロフィール
                          </div>
                        </Link>

                        <Link
                          href="/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <div className="flex items-center">
                            <WalletIcon className="h-4 w-4 mr-2" />
                            ウォレット
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
