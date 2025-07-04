'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon, WalletIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { useMetaMask } from '@/hooks/useMetaMask';
import { usePlayToken } from '@/hooks/usePlayToken';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  value?: string;
  icon?: string;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  console.log('WalletModal rendered with isOpen:', isOpen);
  
  const { account, chainId } = useMetaMask();
  const { balance: playTokenBalance } = usePlayToken();
  const [nativeBalance, setNativeBalance] = useState<string>('0');
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get native token balance (POL)
  useEffect(() => {
    const fetchNativeBalance = async () => {
      if (!account || !window.ethereum) return;

      try {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [account, 'latest']
        });
        
        // Convert from hex to decimal and format
        const balanceInWei = parseInt(balance, 16);
        const balanceInEth = balanceInWei / 1e18;
        setNativeBalance(balanceInEth.toFixed(4));
      } catch (error) {
        console.error('Failed to fetch native balance:', error);
      }
    };

    fetchNativeBalance();
  }, [account]);

  // Set token balances
  useEffect(() => {
    if (!account) return;

    const tokens: TokenBalance[] = [
      {
        symbol: 'POL',
        name: 'Polygon',
        balance: nativeBalance,
        value: '¥0',
        icon: '🟣'
      },
      {
        symbol: 'PT',
        name: 'Play Token',
        balance: playTokenBalance,
        value: '¥0',
        icon: '🎮'
      }
    ];

    setTokenBalances(tokens);
    setIsLoading(false);
  }, [nativeBalance, playTokenBalance]);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = async () => {
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      />
      
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">閉じる</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <WalletIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                      ウォレット概要
                    </h3>
                    
                    {account && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm text-gray-500">接続中のアドレス</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">
                              {truncateAddress(account)}
                            </p>
                          </div>
                          <button
                            onClick={copyToClipboard}
                            className="text-sm text-blue-600 hover:text-blue-500"
                          >
                            コピー
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">保有資産</h4>
                  
                  {isLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-16 bg-gray-200 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tokenBalances.map((token) => (
                        <div key={token.symbol} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{token.icon}</div>
                            <div>
                              <p className="font-medium text-gray-900">{token.symbol}</p>
                              <p className="text-sm text-gray-500">{token.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{token.balance}</p>
                            <p className="text-sm text-gray-500">{token.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 border-t pt-6">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      onClick={() => {
                        // デポジット機能は後で実装
                        console.log('Deposit clicked');
                      }}
                    >
                      <ArrowDownIcon className="h-4 w-4 mr-2" />
                      入金
                    </button>
                    <button
                      type="button"
                      className="inline-flex w-full justify-center items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      onClick={() => {
                        // 出金機能は後で実装
                        console.log('Withdraw clicked');
                      }}
                    >
                      <ArrowUpIcon className="h-4 w-4 mr-2" />
                      出金
                    </button>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    ネットワーク: {chainId === 80002 ? 'Polygon Amoy Testnet' : `Chain ID: ${chainId}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}