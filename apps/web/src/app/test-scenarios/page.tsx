'use client';

import { useState, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { usePlayToken } from '@/hooks/usePlayToken';
import { useToken } from '@/hooks/useToken';
import { NETWORKS, getNetworkByChainId } from '@/config/networks';
import Header from '@/components/Header';
import TestAnalysis from './analysis';
import HeaderStateInspector from './header-state';

/**
 * 実際のシナリオテスト用ページ
 * 各種ボタンの動作確認とネットワーク切り替えテスト
 */
export default function TestScenariosPage() {
  const [testResults, setTestResults] = useState<Array<{
    timestamp: string;
    scenario: string;
    result: string;
    status: 'success' | 'error' | 'info';
  }>>([]);

  const { address: account, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  const [currentNetworkKey, setCurrentNetworkKey] = useState<string>('polygonAmoy');

  // Detect current network
  useEffect(() => {
    if (!chainId) return;
    
    try {
      const network = getNetworkByChainId(chainId);
      if (network) {
        const networkKey = Object.keys(NETWORKS).find(
          key => NETWORKS[key].chainId === chainId
        );
        if (networkKey) {
          setCurrentNetworkKey(networkKey);
          addTestResult('Network Detection', `Switched to ${NETWORKS[networkKey].displayName}`, 'info');
        }
      }
    } catch (error) {
      addTestResult('Network Detection', `Error: ${error}`, 'error');
    }
  }, [chainId]);

  // Play Token hook
  const playTokenHook = usePlayToken(account || null);
  const {
    balance: playTokenBalance,
    hasClaimed,
    isLoading: playTokenLoading,
    claimTokens: claimPlayToken,
    addTokenToMetaMask,
    refreshBalance: refreshPlayTokenBalance,
    refreshClaimStatus
  } = playTokenHook;

  // Regular token hook for other networks
  const {
    balance: tokenBalance,
    symbol: tokenSymbol,
    isLoading: tokenLoading,
    refreshBalance
  } = useToken(account || null, currentNetworkKey);

  const addTestResult = (scenario: string, result: string, status: 'success' | 'error' | 'info') => {
    setTestResults(prev => [{
      timestamp: new Date().toLocaleTimeString(),
      scenario,
      result,
      status
    }, ...prev.slice(0, 19)]); // Keep last 20 results
  };

  // Test scenarios
  const testConnectWallet = async () => {
    try {
      addTestResult('Wallet Connection', 'Attempting to connect...', 'info');
      await open();
      addTestResult('Wallet Connection', 'Connection initiated successfully', 'success');
    } catch (error) {
      addTestResult('Wallet Connection', `Failed: ${error}`, 'error');
    }
  };

  const testPlayTokenClaim = async () => {
    if (!account) {
      addTestResult('Play Token Claim', 'No wallet connected', 'error');
      return;
    }

    if (currentNetworkKey !== 'polygonAmoy') {
      addTestResult('Play Token Claim', 'Not on Polygon Amoy network', 'error');
      return;
    }

    if (hasClaimed) {
      addTestResult('Play Token Claim', 'Already claimed tokens', 'info');
      return;
    }

    try {
      addTestResult('Play Token Claim', 'Attempting to claim 1,000 PT...', 'info');
      const result = await claimPlayToken();
      
      if (result.success) {
        addTestResult('Play Token Claim', `Success! TX: ${result.txHash}`, 'success');
        // Auto-add to MetaMask after claim
        setTimeout(async () => {
          const added = await addTokenToMetaMask();
          addTestResult('MetaMask Token Add', added ? 'PT token added to MetaMask' : 'Failed to add token', added ? 'success' : 'error');
        }, 2000);
      } else {
        addTestResult('Play Token Claim', `Failed: ${result.error}`, 'error');
      }
    } catch (error) {
      addTestResult('Play Token Claim', `Exception: ${error}`, 'error');
    }
  };

  const testAddTokenToMetaMask = async () => {
    try {
      addTestResult('Add PT to MetaMask', 'Attempting to add token...', 'info');
      const success = await addTokenToMetaMask();
      addTestResult('Add PT to MetaMask', success ? 'Successfully added' : 'Failed or cancelled', success ? 'success' : 'error');
    } catch (error) {
      addTestResult('Add PT to MetaMask', `Error: ${error}`, 'error');
    }
  };

  const testBalanceRefresh = async () => {
    try {
      addTestResult('Balance Refresh', 'Refreshing balances...', 'info');
      
      if (currentNetworkKey === 'polygonAmoy') {
        await refreshPlayTokenBalance();
        await refreshClaimStatus();
        addTestResult('Balance Refresh', 'Play Token balance refreshed', 'success');
      } else {
        await refreshBalance();
        addTestResult('Balance Refresh', 'Token balance refreshed', 'success');
      }
    } catch (error) {
      addTestResult('Balance Refresh', `Error: ${error}`, 'error');
    }
  };

  const testNetworkSwitch = async (targetNetworkKey: string) => {
    try {
      const targetNetwork = NETWORKS[targetNetworkKey];
      if (!targetNetwork) {
        addTestResult('Network Switch', `Unknown network: ${targetNetworkKey}`, 'error');
        return;
      }

      addTestResult('Network Switch', `Switching to ${targetNetwork.displayName}...`, 'info');
      
      // Use MetaMask to switch network
      await window.ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetNetwork.chainId.toString(16)}` }],
      });
      
      addTestResult('Network Switch', `Switched to ${targetNetwork.displayName}`, 'success');
    } catch (error: any) {
      if (error.code === 4902) {
        addTestResult('Network Switch', 'Network not added to wallet', 'error');
      } else {
        addTestResult('Network Switch', `Error: ${error.message}`, 'error');
      }
    }
  };

  const testDisconnectWallet = async () => {
    try {
      addTestResult('Wallet Disconnect', 'Disconnecting wallet...', 'info');
      await disconnect();
      addTestResult('Wallet Disconnect', 'Wallet disconnected successfully', 'success');
    } catch (error) {
      addTestResult('Wallet Disconnect', `Error: ${error}`, 'error');
    }
  };

  const getCurrentBalance = () => {
    if (currentNetworkKey === 'polygonAmoy') {
      return playTokenBalance;
    }
    return tokenBalance;
  };

  const getCurrentSymbol = () => {
    return 'PT'; // Always PT as per unified design
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">実際のシナリオテスト</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current State */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">現在の状態</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">ウォレット接続:</span>
                <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? '接続済み' : '未接続'}
                </span>
              </div>
              
              {isConnected && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">アドレス:</span>
                    <span className="font-mono text-sm">
                      {account?.slice(0, 6)}...{account?.slice(-4)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">ネットワーク:</span>
                    <span className="font-medium">
                      {NETWORKS[currentNetworkKey]?.displayName || 'Unknown'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">チェーンID:</span>
                    <span className="font-medium">{chainId}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">残高:</span>
                    <span className="font-medium">
                      {(playTokenLoading || tokenLoading) ? '読み込み中...' : 
                        `${Math.floor(parseFloat(getCurrentBalance())).toLocaleString()} ${getCurrentSymbol()}`
                      }
                    </span>
                  </div>
                  
                  {currentNetworkKey === 'polygonAmoy' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">クレーム状態:</span>
                      <span className={`font-medium ${hasClaimed ? 'text-green-600' : 'text-orange-600'}`}>
                        {hasClaimed ? 'クレーム済み' : '未クレーム'}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Test Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">テストアクション</h2>
            <div className="space-y-3">
              {!isConnected ? (
                <button
                  onClick={testConnectWallet}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ウォレット接続テスト
                </button>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => testNetworkSwitch('polygonAmoy')}
                      disabled={currentNetworkKey === 'polygonAmoy'}
                      className="px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                    >
                      Polygon Amoy
                    </button>
                    <button
                      onClick={() => testNetworkSwitch('sepolia')}
                      disabled={currentNetworkKey === 'sepolia'}
                      className="px-3 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
                    >
                      Sepolia
                    </button>
                  </div>
                  
                  <button
                    onClick={testBalanceRefresh}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    残高更新テスト
                  </button>
                  
                  {currentNetworkKey === 'polygonAmoy' && !hasClaimed && (
                    <button
                      onClick={testPlayTokenClaim}
                      disabled={playTokenLoading}
                      className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
                    >
                      {playTokenLoading ? 'クレーム中...' : 'Play Tokenクレームテスト'}
                    </button>
                  )}
                  
                  {currentNetworkKey === 'polygonAmoy' && (
                    <button
                      onClick={testAddTokenToMetaMask}
                      className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      MetaMaskにPT追加テスト
                    </button>
                  )}
                  
                  <button
                    onClick={testDisconnectWallet}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    ウォレット切断テスト
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Test Results */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">テスト結果ログ</h2>
          <div className="bg-gray-50 rounded p-4 h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                テストを実行してください...
              </div>
            ) : (
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded text-sm ${
                      result.status === 'success' 
                        ? 'bg-green-100 text-green-800' 
                        : result.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{result.scenario}</div>
                        <div className="mt-1">{result.result}</div>
                      </div>
                      <div className="text-xs opacity-75">{result.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Test Scenarios Guide */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">テストシナリオガイド</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-medium text-blue-900">新規ユーザーフロー</h3>
              <ol className="mt-2 text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>ウォレット接続</li>
                <li>Polygon Amoyに切り替え</li>
                <li>「1,000 PT受け取る」ボタン確認</li>
                <li>Play Tokenクレーム実行</li>
                <li>MetaMaskに自動追加確認</li>
                <li>ヘッダーの残高表示確認</li>
              </ol>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-medium text-green-900">既存ユーザーフロー</h3>
              <ol className="mt-2 text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>ウォレット接続</li>
                <li>残高の即座表示確認</li>
                <li>クレームボタンが非表示確認</li>
                <li>「PT追加」ボタン確認</li>
                <li>PT記号の統一表示確認</li>
              </ol>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-medium text-purple-900">ネットワーク切り替え</h3>
              <ol className="mt-2 text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Sepoliaで接続</li>
                <li>PT記号表示確認（SEPではない）</li>
                <li>ボタン非表示確認</li>
                <li>Polygon Amoyに切り替え</li>
                <li>ボタン表示確認</li>
                <li>自動検出確認</li>
              </ol>
            </div>
          </div>
        </div>
        
        {/* Header State Inspector */}
        <HeaderStateInspector />
        
        {/* Test Analysis Section */}
        <TestAnalysis />
      </div>
    </div>
  );
}