'use client';

import React, { useState } from 'react';
import { CurrencyDollarIcon, ArrowsRightLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { mintFullSet, redeemFullSet, calculateArbitrageOpportunity } from '@/utils/futarchyMath';
import type { OutcomeToken } from '@/utils/futarchyMath';

interface FullSetMintBurnProps {
  outcomes: OutcomeToken[];
  userBalance: number; // PT 残高
  userYesTokens: number[]; // 各アウトカムの YES トークン保有数
  onMintFullSet: () => void;
  onRedeemFullSet: () => void;
}

export default function FullSetMintBurn({
  outcomes,
  userBalance,
  userYesTokens,
  onMintFullSet,
  onRedeemFullSet
}: FullSetMintBurnProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<'mint' | 'redeem' | null>(null);

  // フルセット・ミント／バーンの計算
  const mintCalculation = mintFullSet(outcomes.length);
  const redeemCalculation = redeemFullSet(userYesTokens);
  
  // 裁定機会の計算
  const arbitrageInfo = calculateArbitrageOpportunity(outcomes);

  const handleMintFullSet = async () => {
    if (userBalance < mintCalculation.cost) return;
    
    setIsProcessing(true);
    setLastAction('mint');
    
    // 実際のトランザクション処理をシミュレート
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onMintFullSet();
    setIsProcessing(false);
  };

  const handleRedeemFullSet = async () => {
    if (!redeemCalculation.success) return;
    
    setIsProcessing(true);
    setLastAction('redeem');
    
    // 実際のトランザクション処理をシミュレート
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onRedeemFullSet();
    setIsProcessing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <ArrowsRightLeftIcon className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">フルセット操作</h3>
      </div>

      {/* 裁定機会の表示 */}
      {arbitrageInfo.opportunity !== 'none' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-yellow-800">裁定機会を検出</span>
          </div>
          <p className="text-xs text-yellow-700">
            {arbitrageInfo.opportunity === 'mint_and_sell' 
              ? `YES価格合計が ${(arbitrageInfo.totalYesSum * 100).toFixed(1)}% です。フルセットをミントして市場で売却することで利益を得られます。`
              : `YES価格合計が ${(arbitrageInfo.totalYesSum * 100).toFixed(1)}% です。市場で買い集めてフルセットを償還することで利益を得られます。`
            }
          </p>
          <div className="text-xs text-yellow-600 mt-1">
            予想利益: {(arbitrageInfo.profitPotential * 100).toFixed(2)}%
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mint Full Set */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <CurrencyDollarIcon className="w-4 h-4 text-green-600" />
            <h4 className="font-medium text-gray-900">フルセット・ミント</h4>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex justify-between">
              <span>支払い:</span>
              <span>{mintCalculation.cost} PT</span>
            </div>
            <div className="flex justify-between">
              <span>取得:</span>
              <span>{mintCalculation.tokensReceived} YES トークン</span>
            </div>
            <div className="text-xs text-gray-500">
              各アウトカムの YES トークンを 1 枚ずつ取得
            </div>
          </div>

          <button
            onClick={handleMintFullSet}
            disabled={userBalance < mintCalculation.cost || isProcessing}
            className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
              userBalance >= mintCalculation.cost && !isProcessing
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProcessing && lastAction === 'mint' ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>処理中...</span>
              </div>
            ) : (
              `${mintCalculation.cost} PT でミント`
            )}
          </button>

          {userBalance < mintCalculation.cost && (
            <p className="text-xs text-red-600 mt-2">
              残高不足 (現在: {userBalance} PT)
            </p>
          )}
        </div>

        {/* Redeem Full Set */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <ArrowsRightLeftIcon className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium text-gray-900">フルセット・償還</h4>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex justify-between">
              <span>消費:</span>
              <span>{outcomes.length} YES トークン</span>
            </div>
            <div className="flex justify-between">
              <span>取得:</span>
              <span>{redeemCalculation.success ? redeemCalculation.ptReturned : 0} PT</span>
            </div>
            <div className="text-xs text-gray-500">
              各アウトカムの YES トークンを 1 枚ずつ消費
            </div>
          </div>

          {/* ユーザーの YES トークン保有状況 */}
          <div className="mb-4 space-y-1">
            <div className="text-xs text-gray-500 mb-2">保有 YES トークン:</div>
            {outcomes.map((outcome, index) => (
              <div key={outcome.id} className="flex justify-between text-xs">
                <span className="truncate mr-2">{outcome.name}:</span>
                <span className={userYesTokens[index] >= 1 ? 'text-green-600' : 'text-red-600'}>
                  {userYesTokens[index].toFixed(2)}
                  {userYesTokens[index] >= 1 && <CheckCircleIcon className="w-3 h-3 inline ml-1" />}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={handleRedeemFullSet}
            disabled={!redeemCalculation.success || isProcessing}
            className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
              redeemCalculation.success && !isProcessing
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProcessing && lastAction === 'redeem' ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>処理中...</span>
              </div>
            ) : (
              `${redeemCalculation.ptReturned} PT で償還`
            )}
          </button>

          {!redeemCalculation.success && (
            <p className="text-xs text-red-600 mt-2">
              フルセット償還には各 YES トークンを 1 枚以上保有する必要があります
            </p>
          )}
        </div>
      </div>

      {/* 説明 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h5 className="text-sm font-medium text-gray-900 mb-2">🚩 フルセット・ミント／バーンとは</h5>
        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>ミント:</strong> 1 PT を支払って、各アウトカムの YES トークンを 1 枚ずつ取得</p>
          <p><strong>償還:</strong> 各アウトカムの YES トークンを 1 枚ずつ消費して、1 PT を取得</p>
          <p><strong>裁定:</strong> YES 価格の合計が 1 PT と異なる場合、利益機会が発生</p>
        </div>
      </div>
    </div>
  );
}