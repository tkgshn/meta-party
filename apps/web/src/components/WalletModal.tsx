'use client';

import { useEffect, useState } from 'react';
import { 
  XMarkIcon, 
  WalletIcon, 
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  ArrowPathIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
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
    symbol: 'WMATIC',
    name: 'Wrapped MATIC',
    address: '0x0ae690aad8663aab12a671a6a0d74242332de85f', // Amoy testnet WMATIC
    decimals: 18,
    icon: '🟣'
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: '0x7ceb23fd6f0a6bd8bdc1e8c3e5a44b3e6cc77e5e', // Amoy testnet WETH
    decimals: 18,
    icon: '🔶'
  }
];

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  console.log('WalletModal rendered with isOpen:', isOpen);
  
  const { account, chainId } = useMetaMask();
  const { balance: playTokenBalance } = usePlayToken(account || '');
  const [nativeBalance, setNativeBalance] = useState<string>('0');
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'bridge'>('deposit');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [gasEstimate, setGasEstimate] = useState('$0.21');
  const [timeEstimate, setTimeEstimate] = useState('<30s');

  // Get native token balance (POL)
  useEffect(() => {
    const fetchNativeBalance = async () => {
      if (!account || !window.ethereum) return;

      try {
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [account, 'latest']
        }) as string;
        
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
      }) as string;

      if (result && result !== '0x' && result !== '0x0') {
        const balance = parseInt(result, 16);
        const formattedBalance = balance / Math.pow(10, decimals);
        return formattedBalance.toFixed(4);
      }
      return '0';
    } catch (error) {
      // Silently handle errors for tokens that don't exist or are not accessible
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Could not fetch balance for token ${tokenAddress}:`, errorMessage);
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
          type: 'ERC20' as const,
          options: {
            address: token.address,
            symbol: token.symbol,
            decimals: token.decimals,
          },
        } as any,
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
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  // Set default selected token
  useEffect(() => {
    if (tokenBalances.length > 0 && !selectedToken) {
      setSelectedToken(tokenBalances.find(t => t.symbol === 'PT') || tokenBalances[0]);
    }
  }, [tokenBalances, selectedToken]);

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.001) return '<0.001';
    if (num < 1) return num.toFixed(3);
    return num.toFixed(2);
  };

  const handleMaxClick = () => {
    if (selectedToken) {
      setAmount(selectedToken.balance);
    }
  };

  const getPercentageAmount = (percentage: number) => {
    if (selectedToken) {
      const value = (parseFloat(selectedToken.balance) * percentage / 100).toString();
      setAmount(value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-3xl bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl transition-all w-full max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center space-x-4">
              <h3 className="text-2xl font-bold text-gray-900">Deposit</h3>
              <div className="flex items-center px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-violet-500 rounded-full mr-2"></div>
                Polygon Amoy
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="flex">
            {/* Left Panel - Wallet Summary */}
            <div className="w-1/3 p-6 border-r border-gray-100 bg-gray-50/50">
              {/* Wallet Info */}
              {account && (
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center">
                      <WalletIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{truncateAddress(account)}</p>
                      <p className="text-sm text-gray-500">MetaMask</p>
                    </div>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {isCopied ? (
                      <>
                        <CheckIcon className="h-4 w-4 text-green-500" />
                        <span className="text-green-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <DocumentDuplicateIcon className="h-4 w-4" />
                        <span>Copy Address</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Balance List */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Your Assets</h4>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-12 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tokenBalances.map((token) => (
                      <div 
                        key={`${token.symbol}-${token.address}`} 
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer ${
                          selectedToken?.symbol === token.symbol 
                            ? 'bg-blue-100 border-2 border-blue-200' 
                            : 'hover:bg-gray-100 border-2 border-transparent'
                        }`}
                        onClick={() => setSelectedToken(token)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{token.icon}</div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{token.symbol}</p>
                            <p className="text-xs text-gray-500">{formatBalance(token.balance)}</p>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          {token.type === 'erc20' && token.address && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addTokenToMetaMask(token);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Add to MetaMask"
                            >
                              🦊
                            </button>
                          )}
                          {token.address && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                viewOnExplorer(token.address!);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="View on Explorer"
                            >
                              <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Action Area */}
            <div className="flex-1 p-6">
              {/* Tabs */}
              <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg mb-6">
                {(['deposit', 'withdraw', 'bridge'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab === 'deposit' ? 'Deposit' : tab === 'withdraw' ? 'Withdraw' : 'Bridge'}
                  </button>
                ))}
              </div>

              {/* Main Action Area */}
              <div className="space-y-6">
                {/* Token Selector */}
                {selectedToken && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Asset</label>
                    <div className="relative">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{selectedToken.icon}</div>
                          <div>
                            <p className="font-semibold text-gray-900">{selectedToken.symbol}</p>
                            <p className="text-sm text-gray-500">{selectedToken.name}</p>
                          </div>
                        </div>
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Amount Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Amount</label>
                    {selectedToken && (
                      <button
                        onClick={handleMaxClick}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        MAX: {formatBalance(selectedToken.balance)}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full p-4 text-2xl font-semibold bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
                    />
                    {selectedToken && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-medium text-gray-500">
                        {selectedToken.symbol}
                      </div>
                    )}
                  </div>
                  
                  {/* Percentage Buttons */}
                  <div className="flex space-x-2 mt-3">
                    {[25, 50, 75, 100].map((percentage) => (
                      <button
                        key={percentage}
                        onClick={() => getPercentageAmount(percentage)}
                        className="flex-1 py-2 px-3 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        {percentage}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gas & Time Estimate */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <ArrowPathIcon className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-900">Network fee: {gasEstimate}</span>
                  </div>
                  <span className="text-sm text-blue-700">≈ {timeEstimate}</span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    disabled={!amount || parseFloat(amount) === 0}
                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-violet-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {activeTab === 'deposit' ? 'Deposit & Sign' : activeTab === 'withdraw' ? 'Withdraw' : 'Bridge Assets'}
                  </button>
                  
                  <button className="w-full py-3 px-6 border-2 border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
                    <CreditCardIcon className="h-5 w-5" />
                    <span>Buy with Card</span>
                  </button>
                </div>

                {/* QR Code & Copy */}
                <div className="flex space-x-3">
                  <button className="flex-1 py-2 px-4 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                    QR Code
                  </button>
                  <button 
                    onClick={copyToClipboard}
                    className="flex-1 py-2 px-4 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                    <span>Copy Address</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Recent Transactions */}
          <div className="p-6 border-t border-gray-100 bg-gray-50/30">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h4>
            <div className="text-sm text-gray-500 text-center py-4">
              No recent transactions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}