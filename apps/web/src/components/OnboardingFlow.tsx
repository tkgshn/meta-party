'use client';

import { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import '@/types/ethereum';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  action?: () => Promise<void>;
  errorMessage?: string;
}

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userBalance, setUserBalance] = useState<string>('0');
  
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'metamask-check',
      title: 'MetaMask確認',
      description: 'MetaMaskが正しくインストールされているか確認します',
      status: 'pending'
    },
    {
      id: 'connect-wallet',
      title: 'ウォレット接続',
      description: 'MetaMaskでウォレットを接続します',
      status: 'pending'
    },
    {
      id: 'network-setup',
      title: 'ネットワーク設定',
      description: 'Polygon Amoyテストネットを追加・切り替えます',
      status: 'pending'
    },
    {
      id: 'get-pol-tokens',
      title: 'POLトークン取得',
      description: 'ガス代用のPOLトークンを取得します（外部サイト）',
      status: 'pending'
    },
    {
      id: 'add-pt-token',
      title: 'PTトークン追加',
      description: 'Play Token (PT) をMetaMaskに追加します',
      status: 'pending'
    },
    {
      id: 'claim-tokens',
      title: 'トークン受け取り',
      description: '1,000 Play Tokenを受け取ります',
      status: 'pending'
    }
  ]);

  // Check MetaMask installation
  const checkMetaMask = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    
    if (!window.ethereum || !window.ethereum.isMetaMask) {
      return false;
    }
    return true;
  };

  // Connect wallet
  const connectWallet = async (): Promise<string | null> => {
    try {
      const accounts = await window.ethereum?.request({
        method: 'eth_requestAccounts',
      });
      return (accounts as string[])?.[0] || null;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return null;
    }
  };

  // Add Polygon Amoy network
  const addPolygonAmoy = async (): Promise<boolean> => {
    try {
      // First try to switch
      await window.ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x13882' }], // 80002 in hex
      });
      return true;
    } catch (switchError: unknown) {
      const err = switchError as { code?: number };
      // If the network doesn't exist, add it
      if (err.code === 4902) {
        try {
          await window.ethereum?.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x13882',
                chainName: 'Polygon Amoy Testnet',
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
          return true;
        } catch (addError) {
          console.error('Failed to add network:', addError);
          return false;
        }
      }
      console.error('Failed to switch network:', switchError);
      return false;
    }
  };

  // Check POL balance
  const checkPOLBalance = async (): Promise<string> => {
    try {
      const accounts = await window.ethereum?.request({
        method: 'eth_accounts',
      });
      
      if (!accounts || (accounts as string[]).length === 0) {
        return '0';
      }

      const balance = await window.ethereum?.request({
        method: 'eth_getBalance',
        params: [(accounts as string[])[0], 'latest'],
      });

      if (balance) {
        const balanceInPOL = parseInt(balance as string, 16) / Math.pow(10, 18);
        return balanceInPOL.toFixed(4);
      }
      return '0';
    } catch (error) {
      console.error('Failed to check POL balance:', error);
      return '0';
    }
  };

  // Add PT token to MetaMask
  const addPTToken = async (): Promise<boolean> => {
    try {
      const wasAdded = await window.ethereum?.request({
        method: 'wallet_watchAsset',
        params: [{
          type: 'ERC20',
          options: {
            address: process.env.NEXT_PUBLIC_PLAY_TOKEN_ADDRESS,
            symbol: 'PT',
            decimals: 18,
            image: '',
          },
        }],
      });
      return Boolean(wasAdded);
    } catch (error) {
      console.error('Failed to add PT token:', error);
      return false;
    }
  };

  // Execute step action
  const executeStep = async (stepId: string) => {
    setIsProcessing(true);
    
    try {
      let success = false;
      let errorMessage = '';

      switch (stepId) {
        case 'metamask-check':
          success = await checkMetaMask();
          if (!success) {
            errorMessage = 'MetaMaskがインストールされていません。https://metamask.io からインストールしてください。';
          }
          break;

        case 'connect-wallet':
          const account = await connectWallet();
          success = Boolean(account);
          if (!success) {
            errorMessage = 'ウォレットの接続に失敗しました。MetaMaskでアカウントが選択されているか確認してください。';
          }
          break;

        case 'network-setup':
          success = await addPolygonAmoy();
          if (!success) {
            errorMessage = 'ネットワークの追加・切り替えに失敗しました。MetaMaskでPolygon Amoyが選択されているか確認してください。';
          }
          break;

        case 'get-pol-tokens':
          // Check current POL balance
          const balance = await checkPOLBalance();
          setUserBalance(balance);
          success = parseFloat(balance) > 0.001; // At least 0.001 POL needed
          if (!success) {
            errorMessage = 'POLトークンが不足しています。Faucetから取得してから「完了」ボタンを押してください。';
          }
          break;

        case 'add-pt-token':
          success = await addPTToken();
          if (!success) {
            errorMessage = 'PTトークンの追加に失敗しました。MetaMaskで手動で追加を試してください。';
          }
          break;

        case 'claim-tokens':
          // This will be handled by the main dashboard
          success = true;
          break;
      }

      // Update step status
      setSteps(prev => prev.map(step => 
        step.id === stepId 
          ? { ...step, status: success ? 'completed' : 'error', errorMessage: success ? undefined : errorMessage }
          : step
      ));

      // Move to next step if successful
      if (success && currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
        // Auto-start next step for non-manual steps
        const nextStep = steps[currentStepIndex + 1];
        if (nextStep && !['get-pol-tokens', 'claim-tokens'].includes(nextStep.id)) {
          setTimeout(() => executeStep(nextStep.id), 500);
        }
      } else if (success && currentStepIndex === steps.length - 1) {
        // All steps completed
        setTimeout(onComplete, 1000);
      }

    } catch (error) {
      console.error('Error executing step:', error);
      setSteps(prev => prev.map(step => 
        step.id === stepId 
          ? { ...step, status: 'error', errorMessage: '予期しないエラーが発生しました。' }
          : step
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-start first step
  useEffect(() => {
    if (steps[0].status === 'pending') {
      executeStep(steps[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update current step status to in_progress
  useEffect(() => {
    setSteps(prev => prev.map((step, index) => 
      index === currentStepIndex && step.status === 'pending'
        ? { ...step, status: 'in_progress' }
        : step
    ));
  }, [currentStepIndex]);

  const currentStep = steps[currentStepIndex];
  const isManualStep = ['get-pol-tokens', 'claim-tokens'].includes(currentStep?.id || '');

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🚀 Play Token取得ガイド
        </h2>
        <p className="text-gray-600">
          ステップバイステップでPlay Tokenを取得しましょう
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>進行状況</span>
          <span>{steps.filter(s => s.status === 'completed').length} / {steps.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps list */}
      <div className="space-y-4 mb-8">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={`flex items-start p-4 rounded-lg border transition-all ${
              index === currentStepIndex 
                ? 'border-blue-300 bg-blue-50' 
                : step.status === 'completed'
                ? 'border-green-300 bg-green-50'
                : step.status === 'error'
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex-shrink-0 mr-3 mt-1">
              {step.status === 'completed' ? (
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              ) : step.status === 'error' ? (
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              ) : step.status === 'in_progress' ? (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
              )}
            </div>
            <div className="flex-grow">
              <h3 className="font-medium text-gray-900">{step.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{step.description}</p>
              {step.errorMessage && (
                <p className="text-sm text-red-600 mt-2">{step.errorMessage}</p>
              )}
              {step.id === 'get-pol-tokens' && index === currentStepIndex && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-gray-700">
                    現在のPOL残高: <span className="font-mono font-bold">{userBalance} POL</span>
                  </p>
                  <div className="flex space-x-2">
                    <a
                      href="https://www.alchemy.com/faucets/polygon-amoy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Alchemy Faucet <ArrowRightIcon className="w-4 h-4 ml-1" />
                    </a>
                    <a
                      href="https://faucet.polygon.technology/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      Polygon Faucet <ArrowRightIcon className="w-4 h-4 ml-1" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex justify-between">
        <button
          onClick={onComplete}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          スキップ
        </button>
        
        {isManualStep && currentStep && (
          <div className="space-x-2">
            {currentStep.id === 'get-pol-tokens' && (
              <button
                onClick={() => executeStep(currentStep.id)}
                disabled={isProcessing}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                残高確認
              </button>
            )}
            {currentStep.id === 'claim-tokens' && (
              <button
                onClick={onComplete}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                トークン受け取りに進む
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}