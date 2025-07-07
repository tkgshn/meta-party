'use client';

import { useState, useEffect } from 'react';
import { ChevronDownIcon, GlobeAltIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { NETWORKS, getNetworkByChainId, getCurrencySymbol } from '@/config/networks';
import { useMetaMask } from '@/hooks/useMetaMask';

interface NetworkSwitcherProps {
  onNetworkChange?: (networkKey: string) => void;
  className?: string;
}

export default function NetworkSwitcher({ onNetworkChange, className = '' }: NetworkSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('polygon');
  const [anvilAvailable, setAnvilAvailable] = useState(false);
  const { switchNetwork, getCurrentChainId } = useMetaMask();

  // Check if Anvil is available
  const checkAnvilAvailability = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8545', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Check if it's actually Anvil (chain ID 31337)
        setAnvilAvailable(data.result === '0x7a69');
      } else {
        setAnvilAvailable(false);
      }
    } catch {
      setAnvilAvailable(false);
    }
  };

  // Check Anvil availability on component mount
  useEffect(() => {
    checkAnvilAvailability();
    // Check every 30 seconds in case Anvil is started later
    const interval = setInterval(checkAnvilAvailability, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get current network from MetaMask
  useEffect(() => {
    const getCurrentNetwork = async () => {
      try {
        const currentChainId = await getCurrentChainId();
        if (!currentChainId) return;
        const currentNetwork = getNetworkByChainId(currentChainId);
        if (currentNetwork) {
          const networkKey = Object.keys(NETWORKS).find(
            key => NETWORKS[key].chainId === currentChainId
          );
          if (networkKey) {
            setSelectedNetwork(networkKey);
          }
        }
      } catch (error) {
        console.error('Failed to get current network:', error);
      }
    };

    getCurrentNetwork();
  }, [getCurrentChainId]);

  const handleNetworkSelect = async (networkKey: string) => {
    try {
      const network = NETWORKS[networkKey];
      if (!network) return;

      // Check if trying to switch to Anvil when it's not available
      if (networkKey === 'anvil' && !anvilAvailable) {
        alert('Anvil ローカルネットワークは利用できません。\n\nFoundry をインストールし、以下のコマンドでAnvilを起動してください：\n\n初回セットアップ: npm run setup:foundry\n起動コマンド: npm run dev:with-anvil');
        return;
      }

      // Switch network in MetaMask
      const success = await switchNetwork(network.chainId);
      
      if (success) {
        setSelectedNetwork(networkKey);
        setIsOpen(false);
        onNetworkChange?.(networkKey);
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  const currentNetwork = NETWORKS[selectedNetwork];
  const currencySymbol = getCurrencySymbol(selectedNetwork);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <GlobeAltIcon className="h-4 w-4 text-gray-500" />
        <span className="hidden sm:inline">{currentNetwork?.displayName}</span>
        <span className="sm:hidden">{currencySymbol}</span>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
          {currencySymbol}
        </span>
        <ChevronDownIcon className="h-4 w-4 text-gray-500" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">ネットワークを選択</h3>
              <div className="space-y-2">
                {Object.entries(NETWORKS).map(([key, network]) => {
                  const isSelected = selectedNetwork === key;
                  const currency = getCurrencySymbol(key);
                  const isAnvilUnavailable = key === 'anvil' && !anvilAvailable;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => handleNetworkSelect(key)}
                      disabled={isAnvilUnavailable}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isAnvilUnavailable
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          isAnvilUnavailable 
                            ? 'bg-gray-300' 
                            : network.isTestnet 
                            ? 'bg-yellow-400' 
                            : 'bg-green-400'
                        }`} />
                        <div className="text-left">
                          <div className={`font-medium text-sm flex items-center space-x-2 ${
                            isAnvilUnavailable ? 'text-gray-400' : ''
                          }`}>
                            <span>{network.displayName}</span>
                            {isAnvilUnavailable && (
                              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <div className={`text-xs ${
                            isAnvilUnavailable ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {isAnvilUnavailable 
                              ? 'Foundry が必要です' 
                              : `${network.isTestnet ? 'テストネット' : 'メインネット'} • ${currency}`
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          isAnvilUnavailable 
                            ? 'bg-gray-100 text-gray-400'
                            : currency === 'USDC' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {currency}
                        </span>
                        {isSelected && !isAnvilUnavailable && (
                          <CheckIcon className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600">
                  <div className="font-medium mb-1">現在の設定:</div>
                  <div>ネットワーク: {currentNetwork?.displayName}</div>
                  <div>通貨: {currencySymbol}</div>
                  <div>チェーンID: {currentNetwork?.chainId}</div>
                </div>
              </div>

              {!anvilAvailable && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-yellow-800">
                      <div className="font-medium mb-1">Anvil ローカルネットワークについて</div>
                      <div className="space-y-1">
                        <div>• Foundry のインストールが必要です</div>
                        <div>• 開発者向けの高速ローカルチェーンです</div>
                        <div>• 起動コマンド: <code className="bg-yellow-100 px-1 rounded">npm run anvil</code></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}