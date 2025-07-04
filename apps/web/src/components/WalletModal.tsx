'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon, WalletIcon, ArrowUpIcon, ArrowDownIcon, EyeIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
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
  address?: string;
  decimals?: number;
  type: 'native' | 'erc20';
}

// 一般的なERC-20トークンのリスト（Polygon Amoy Testnet）
const COMMON_TOKENS = [
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582', // Amoy testnet USDC
    decimals: 6,
    icon: '💰'
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: '0xa6fa4fb5f76172d178d61b04b0ecd319c5d1c0aa', // Amoy testnet WETH
    decimals: 18,
    icon: '🔶'
  },
  {
    symbol: 'LINK',
    name: 'Chainlink Token',
    address: '0x0fb3b2c2b2fa6b30ef0ad9b3b60c1b7e5b0b5b9e', // Mock address
    decimals: 18,
    icon: '🔗'
  }
];

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

  // Get ERC-20 token balance
  const getTokenBalance = async (tokenAddress: string, decimals: number) => {
    if (!account || !window.ethereum) return '0';

    try {
      // ERC-20 balanceOf function signature
      const balanceOfData = `0x70a08231000000000000000000000000${account.slice(2)}`;
      
      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: tokenAddress,
          data: balanceOfData
        }, 'latest']
      });

      if (result && result !== '0x') {
        const balance = parseInt(result, 16);
        const formattedBalance = balance / Math.pow(10, decimals);
        return formattedBalance.toFixed(4);
      }
      return '0';
    } catch (error) {
      console.error(`Failed to fetch token balance for ${tokenAddress}:`, error);
      return '0';
    }
  };

  // Fetch all token balances
  useEffect(() => {
    const fetchAllTokenBalances = async () => {
      if (!account) return;
      
      setIsLoading(true);
      const tokens: TokenBalance[] = [];

      // Add native token
      tokens.push({
        symbol: 'POL',
        name: 'Polygon',
        balance: nativeBalance,
        value: '¥0',
        icon: '🟣',
        type: 'native'
      });

      // Add Play Token
      tokens.push({
        symbol: 'PT',
        name: 'Play Token',
        balance: playTokenBalance,
        value: '¥0',
        icon: '🎮',
        address: process.env.NEXT_PUBLIC_PLAY_TOKEN_ADDRESS,
        decimals: 18,
        type: 'erc20'
      });

      // Add common ERC-20 tokens (always show all)
      for (const token of COMMON_TOKENS) {
        const balance = await getTokenBalance(token.address, token.decimals);
        tokens.push({
          symbol: token.symbol,
          name: token.name,
          balance,
          value: '¥0',
          icon: token.icon,
          address: token.address,
          decimals: token.decimals,
          type: 'erc20'
        });
      }

      setTokenBalances(tokens);
      setIsLoading(false);
    };

    fetchAllTokenBalances();
  }, [account, nativeBalance, playTokenBalance]);

  // Add token to MetaMask
  const addTokenToMetaMask = async (token: TokenBalance) => {
    if (!window.ethereum || !token.address) return;

    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: token.address,
            symbol: token.symbol,
            decimals: token.decimals,
          },
        },
      });
    } catch (error) {
      console.error('Failed to add token to MetaMask:', error);
    }
  };

  // View on explorer
  const viewOnExplorer = (address: string) => {
    const explorerUrl = chainId === 80002 
      ? `https://amoy.polygonscan.com/address/${address}`
      : `https://polygonscan.com/address/${address}`;
    window.open(explorerUrl, '_blank');
  };

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
    <>
      {/* Background overlay for closing */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Popup positioned relative to header */}
      <div className="fixed top-16 right-4 z-50 w-96 max-w-sm">
        <div className="relative transform overflow-hidden rounded-lg bg-white border border-gray-200 shadow-2xl transition-all">
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

          <div className="p-6">
            <div className="flex items-start">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                <WalletIcon className="h-5 w-5 text-blue-600" aria-hidden="true" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold leading-6 text-gray-900">
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
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">保有資産</h4>
              <span className="text-xs text-gray-500 flex items-center">
                <EyeIcon className="h-3 w-3 mr-1" />
                全て表示中
              </span>
            </div>
            
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tokenBalances.map((token) => (
                  <div key={`${token.symbol}-${token.address}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="text-xl">{token.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900">{token.symbol}</p>
                          {parseFloat(token.balance) === 0 && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                              残高なし
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{token.name}</p>
                        {token.address && (
                          <p className="text-xs text-gray-400 truncate">{truncateAddress(token.address)}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="font-medium text-gray-900 text-sm">{token.balance}</p>
                        <p className="text-xs text-gray-500">{token.value}</p>
                      </div>
                      
                      {/* Token Actions */}
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {token.type === 'erc20' && token.address && (
                          <button
                            onClick={() => addTokenToMetaMask(token)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="MetaMaskに追加"
                          >
                            🦊
                          </button>
                        )}
                        {token.address && (
                          <button
                            onClick={() => viewOnExplorer(token.address!)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="エクスプローラーで表示"
                          >
                            <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {tokenBalances.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">トークンが見つかりません</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 border-t pt-6 px-6 pb-6">
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
  );
}