'use client';

import { useState, useEffect } from 'react';

// Play Token Contract ABI (simplified for claim and balance functions)
const PLAY_TOKEN_ABI = [
  {
    inputs: [],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'hasClaimed',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAirdropAmount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const PLAY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_PLAY_TOKEN_ADDRESS as `0x${string}`;

function DashboardPage() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [hasClaimed, setHasClaimed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<'pending' | 'success' | 'failed' | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Fix hydration by ensuring component is mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Switch to Polygon Amoy network
  const switchToAmoy = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        // Try to switch to Polygon Amoy
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13882' }], // 80002 in hex
        });
      } catch (switchError: any) {
        // If the network doesn't exist, add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x13882',
                  chainName: 'Polygon Amoy',
                  nativeCurrency: {
                    name: 'POL',
                    symbol: 'POL',
                    decimals: 18,
                  },
                  rpcUrls: ['https://polygon-amoy.g.alchemy.com/v2/Jmm9344uth8TJQi0gNCbs'],
                  blockExplorerUrls: ['https://amoy.polygonscan.com/'],
                },
              ],
            });
          } catch (addError) {
            console.error('Failed to add network:', addError);
          }
        } else {
          console.error('Failed to switch network:', switchError);
        }
      }
    }
  };

  // Connect wallet function
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setAccount(accounts[0]);
        
        // Get chain ID
        const chainId = await window.ethereum.request({
          method: 'eth_chainId',
        });
        setChainId(parseInt(chainId, 16));
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    }
  };
  
  // Check if already connected and load balance
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum && mounted) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            
            // Get chain ID
            return window.ethereum.request({ method: 'eth_chainId' });
          }
        })
        .then((chainId: string) => {
          if (chainId) {
            setChainId(parseInt(chainId, 16));
          }
        });
    }
  }, [mounted]);

  // Load balance and claim status when account and chainId are available - with delay
  useEffect(() => {
    if (account && chainId === 80002 && mounted) {
      setIsLoadingData(true);
      
      // Add small delay to ensure wallet is ready and avoid initial RPC errors
      const timer = setTimeout(() => {
        loadBalance();
        // Add additional delay for claim status to reduce RPC error chances
        setTimeout(() => {
          checkClaimStatus();
          setIsLoadingData(false);
        }, 500);
      }, 1000);

      return () => {
        clearTimeout(timer);
        setIsLoadingData(false);
      };
    }
  }, [account, chainId, mounted]);

  // Generate function selector from signature
  const getFunctionSelector = (signature: string): string => {
    const encoder = new TextEncoder();
    const data = encoder.encode(signature);
    return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
      const hashArray = new Uint8Array(hashBuffer);
      return '0x' + Array.from(hashArray.slice(0, 4))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    });
  };

  // Check balance with improved error handling
  const loadBalance = async () => {
    if (!account || !PLAY_TOKEN_ADDRESS) return;
    
    try {
      // balanceOf(address) selector: 0x70a08231
      const paddedAddress = account.slice(2).padStart(64, '0');
      const balance = await window.ethereum.request({
        method: 'eth_call',
        params: [
          {
            to: PLAY_TOKEN_ADDRESS,
            data: '0x70a08231' + paddedAddress,
          },
          'latest'
        ],
      });
      
      if (balance && balance !== '0x' && balance !== '0x0') {
        // Convert from wei to PT (assuming 18 decimals)
        const balanceInPT = parseInt(balance, 16) / Math.pow(10, 18);
        const balanceStr = balanceInPT.toFixed(0);
        console.log('Balance loaded successfully:', { raw: balance, parsed: balanceStr });
        setBalance(balanceStr);
      } else {
        console.log('Balance is zero or empty');
        setBalance('0');
      }
    } catch (error) {
      console.log('Balance loading error (non-critical):', error.message);
      setBalance('0');
    }
  };

  // Check if already claimed - with improved error handling
  const checkClaimStatus = async () => {
    if (!account || !PLAY_TOKEN_ADDRESS) return;
    
    try {
      const paddedAddress = account.slice(2).padStart(64, '0');
      
      // Try hasClaimed(address) function first - correct selector: 0x73b2e80e
      try {
        const result = await window.ethereum.request({
          method: 'eth_call',
          params: [
            {
              to: PLAY_TOKEN_ADDRESS,
              data: '0x73b2e80e' + paddedAddress, // hasClaimed(address) - correct selector
            },
            'latest'
          ],
        });
        
        // Parse boolean result
        const claimed = result === '0x0000000000000000000000000000000000000000000000000000000000000001';
        console.log('Claim status check successful:', { result, claimed });
        setHasClaimed(claimed);
        return;
      } catch (error) {
        console.log('hasClaimed function failed, trying fallback approach...');
      }
      
      // Fallback: Try claimed mapping directly - correct selector: 0xc884ef83
      try {
        const result = await window.ethereum.request({
          method: 'eth_call',
          params: [
            {
              to: PLAY_TOKEN_ADDRESS,
              data: '0xc884ef83' + paddedAddress, // claimed(address) mapping
            },
            'latest'
          ],
        });
        
        const claimed = result === '0x0000000000000000000000000000000000000000000000000000000000000001';
        console.log('Mapping check successful:', { result, claimed });
        setHasClaimed(claimed);
        return;
      } catch (error) {
        console.log('Mapping check failed, using balance fallback...');
      }
      
      // Final fallback: if balance > 0, likely claimed
      if (balance && parseInt(balance) > 0) {
        console.log('Using balance fallback - balance > 0, assuming claimed');
        setHasClaimed(true);
      } else {
        console.log('All checks failed, defaulting to not claimed');
        setHasClaimed(false);
      }
      
    } catch (error) {
      console.log('Claim status check error (non-critical):', error.message);
      setHasClaimed(false);
    }
  };
  
  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">マイページ</h1>
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  // Wait for transaction confirmation
  const waitForTransaction = async (txHash: string) => {
    setTxStatus('pending');
    let attempts = 0;
    const maxAttempts = 40; // 2 minutes max
    
    console.log(`Waiting for transaction: ${txHash}`);
    
    while (attempts < maxAttempts) {
      try {
        const receipt = await window.ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        });
        
        if (receipt) {
          if (receipt.status === '0x1') {
            setTxStatus('success');
            console.log('Transaction confirmed successfully!');
            // Reload balance and claim status
            setTimeout(() => {
              loadBalance();
              checkClaimStatus();
            }, 2000);
            return true;
          } else {
            setTxStatus('failed');
            console.log('Transaction failed');
            return false;
          }
        }
      } catch (error: any) {
        // Handle specific RPC errors
        if (error.code === -32603 || error.code === -32000) {
          console.log('Block not found yet, transaction still pending...');
        } else {
          console.error('Error checking transaction:', error);
        }
      }
      
      console.log(`Checking transaction... attempt ${attempts + 1}/${maxAttempts}`);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      attempts++;
    }
    
    console.log('Transaction timeout - checking one more time...');
    
    // One final check
    try {
      const receipt = await window.ethereum.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      });
      
      if (receipt && receipt.status === '0x1') {
        setTxStatus('success');
        setTimeout(() => {
          loadBalance();
          checkClaimStatus();
        }, 2000);
        return true;
      }
    } catch (error) {
      console.error('Final check failed:', error);
    }
    
    // Transaction may still be pending but we've timed out
    console.log('Transaction may still be pending. Check manually on block explorer.');
    alert('Transaction is taking longer than expected. Please check the block explorer link below for status.');
    return false;
  };

  // Check if transaction exists on blockchain
  const checkTransactionExists = async (txHash: string): Promise<boolean> => {
    try {
      const tx = await window.ethereum.request({
        method: 'eth_getTransactionByHash',
        params: [txHash],
      });
      return tx !== null;
    } catch (error) {
      console.error('Error checking transaction existence:', error);
      return false;
    }
  };

  // Claim Play Tokens with improved reliability
  const claimPlayTokens = async () => {
    if (!account || chainId !== 80002) {
      alert('Please connect to Polygon Amoy network');
      return;
    }
    
    if (isLoading) {
      alert('Transaction already in progress. Please wait.');
      return;
    }
    
    setIsLoading(true);
    setTxStatus(null);
    
    try {
      // Get current nonce
      const nonce = await window.ethereum.request({
        method: 'eth_getTransactionCount',
        params: [account, 'pending'],
      });
      
      // Get current gas price and add 50% buffer for Amoy testnet
      const gasPrice = await window.ethereum.request({
        method: 'eth_gasPrice',
      });
      const bufferedGasPrice = '0x' + Math.floor(parseInt(gasPrice, 16) * 1.5).toString(16);
      
      console.log('Sending transaction with:', {
        nonce,
        gasPrice: bufferedGasPrice,
        from: account,
        to: process.env.NEXT_PUBLIC_PLAY_TOKEN_ADDRESS
      });
      
      // Send transaction with explicit nonce and higher gas price
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: process.env.NEXT_PUBLIC_PLAY_TOKEN_ADDRESS,
          data: '0x4e71d92d', // claim() function signature
          gas: '0x1adb0', // 110000 gas limit (increased)
          gasPrice: bufferedGasPrice,
          nonce: nonce,
        }],
      });
      
      console.log('Transaction sent:', txHash);
      setLastTxHash(txHash);
      
      // Wait a few seconds then check if transaction exists on blockchain
      setTimeout(async () => {
        const exists = await checkTransactionExists(txHash);
        if (!exists) {
          console.warn('Transaction not found on blockchain, may have been dropped');
          alert('Transaction may have been dropped. Please try again with a higher gas price.');
          setTxStatus('failed');
          return;
        }
        
        console.log('Transaction confirmed to exist on blockchain');
        setHasClaimed(true);
        
        // Wait for transaction confirmation
        waitForTransaction(txHash);
      }, 5000);
      
    } catch (error: any) {
      console.error('Error claiming tokens:', error);
      setTxStatus('failed');
      
      if (error.code === -4001) {
        alert('Transaction rejected by user.');
      } else if (error.code === -32603) {
        alert('Transaction failed. You may have already claimed your tokens.');
      } else if (error.code === -32000) {
        if (error.message.includes('already known')) {
          alert('Transaction already submitted. Please wait for confirmation.');
        } else {
          alert('Transaction rejected. Please try again with a higher gas price.');
        }
      } else {
        alert('Failed to claim tokens: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">マイページ</h1>
          <p className="text-gray-600 mb-8">
            ウォレットを接続してPlay Tokenを取得し、予測市場に参加しましょう
          </p>
          <button
            onClick={connectWallet}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (chainId !== 80002) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">マイページ</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                ネットワークを切り替えてください
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Polygon Amoy テストネット（チェーンID: 80002）に接続してください。
                  <br />
                  現在のチェーンID: {chainId || '不明'}
                </p>
                <button
                  onClick={switchToAmoy}
                  className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Polygon Amoy に切り替え
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">マイページ</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {account?.slice(0, 6)}...{account?.slice(-4)}
          </span>
          <button
            onClick={() => setAccount(null)}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">ウォレット情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">ウォレットアドレス</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono break-all">{account}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">ネットワーク</dt>
            <dd className="mt-1 text-sm text-gray-900">
              Polygon Amoy (ID: {chainId})
              {chainId === 80002 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  接続済み
                </span>
              )}
            </dd>
          </div>
        </div>
      </div>

      {/* Transaction Status Card */}
      {lastTxHash && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">最新のトランザクション</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">ハッシュ:</span>
              <a 
                href={`https://amoy.polygonscan.com/tx/${lastTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline text-sm font-mono"
              >
                {lastTxHash.slice(0, 10)}...{lastTxHash.slice(-8)}
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">ステータス:</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                txStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                txStatus === 'success' ? 'bg-green-100 text-green-800' :
                txStatus === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {txStatus === 'pending' ? '確認中...' :
                 txStatus === 'success' ? '成功' :
                 txStatus === 'failed' ? '失敗' :
                 '不明'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Play Token Balance Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Play Token残高</h2>
          <button
            onClick={() => {
              setIsLoadingData(true);
              loadBalance();
              setTimeout(() => {
                checkClaimStatus();
                setIsLoadingData(false);
              }, 500);
            }}
            disabled={isLoadingData}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingData ? '更新中...' : '更新'}
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            {isLoadingData ? (
              <div className="animate-pulse">
                <div className="h-9 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-blue-600">
                  {balance} PT
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Play Token（テスト用トークン）
                </p>
              </>
            )}
          </div>
          
          {/* Claim Button */}
          <div>
            {isLoadingData ? (
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded w-32"></div>
              </div>
            ) : hasClaimed ? (
              <div className="space-y-2">
                <div className="text-sm text-green-600 font-medium">
                  ✓ 既に受け取り済み
                </div>
                {lastTxHash && (
                  <div className="text-xs text-gray-500">
                    <a 
                      href={`https://amoy.polygonscan.com/tx/${lastTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      トランザクションを確認
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={claimPlayTokens}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    送信中...
                  </span>
                ) : (
                  '1,000 PT を受け取る'
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Instructions Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">使い方</h2>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="bg-blue-100 rounded-full p-2 w-8 h-8 flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">1</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Play Token を受け取る</h3>
              <p className="text-sm text-gray-500">
                初回のみ1,000 PTを無料で受け取ることができます
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="bg-blue-100 rounded-full p-2 w-8 h-8 flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">2</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">予測市場に参加</h3>
              <p className="text-sm text-gray-500">
                <a href="/" className="text-blue-600 hover:text-blue-500 underline">
                  ホームページ
                </a>
                から市場を選んで予測投資を行います
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="bg-blue-100 rounded-full p-2 w-8 h-8 flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">3</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">配当を受け取る</h3>
              <p className="text-sm text-gray-500">
                予測が当たった場合、配当としてPTを受け取ることができます
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting Card */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-lg font-medium text-yellow-800 mb-4">トラブルシューティング</h2>
        <div className="space-y-3 text-sm">
          <div>
            <h3 className="font-medium text-yellow-800">トランザクションが失敗する場合:</h3>
            <ul className="list-disc list-inside text-yellow-700 mt-1 space-y-1">
              <li>
                <a 
                  href="https://www.alchemy.com/faucets/polygon-amoy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-yellow-600"
                >
                  Alchemy Faucet
                </a>
                からPOLを取得してガス代を確保
              </li>
              <li>
                <a 
                  href="https://faucet.polygon.technology/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-yellow-600"
                >
                  Polygon Faucet
                </a>
                で追加のPOLを取得
              </li>
              <li>数分待ってから再試行（ネットワークが混雑している場合）</li>
              <li>MetaMaskでガス価格を手動で上げる</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-yellow-800">残高が更新されない場合:</h3>
            <ul className="list-disc list-inside text-yellow-700 mt-1 space-y-1">
              <li>「更新」ボタンをクリック</li>
              <li>ページをリロード</li>
              <li>Polygon Scanでトランザクションの確認</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;