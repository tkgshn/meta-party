'use client';

import React, { useState } from 'react';
import { TrophyIcon, CheckCircleIcon, XMarkIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { resolveMarket } from '@/utils/futarchyMath';
import type { OutcomeToken } from '@/utils/futarchyMath';

interface MarketResolutionProps {
  outcomes: OutcomeToken[];
  userYesTokens: number[];
  userNoTokens: number[];
  onResolution: (winnerIndex: number, payout: number) => void;
  isAdmin?: boolean;
}

export default function MarketResolution({
  outcomes,
  userYesTokens,
  userNoTokens,
  onResolution,
  isAdmin = false
}: MarketResolutionProps) {
  const [selectedWinner, setSelectedWinner] = useState<number | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // 各アウトカムが勝利した場合のペイアウトを計算
  const calculatePayoutForWinner = (winnerIndex: number) => {
    const userHoldings = {
      yesTokens: userYesTokens,
      noTokens: userNoTokens
    };
    
    const resolution = resolveMarket(winnerIndex, userHoldings);
    return resolution;
  };

  const handleResolveMarket = async () => {
    if (selectedWinner === null) return;
    
    setIsResolving(true);
    
    // 実際の決着処理をシミュレート
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const resolution = calculatePayoutForWinner(selectedWinner);
    onResolution(selectedWinner, resolution.totalPayout);
    
    setIsResolving(false);
    setShowConfirmation(false);
  };

  const previewPayout = selectedWinner !== null ? calculatePayoutForWinner(selectedWinner) : null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <TrophyIcon className="w-5 h-5 text-yellow-600" />
        <h3 className="text-lg font-semibold text-gray-900">市場決着</h3>
      </div>

      {/* ユーザーの保有トークン表示 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">あなたの保有トークン</h4>
        <div className="space-y-2">
          {outcomes.map((outcome, index) => (
            <div key={outcome.id} className="flex justify-between text-sm">
              <span className="text-gray-700">{outcome.name}:</span>
              <div className="flex space-x-4">
                <span className="text-green-600">
                  YES: {userYesTokens[index]?.toFixed(2) || '0.00'}
                </span>
                <span className="text-red-600">
                  NO: {userNoTokens[index]?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 勝者選択 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          {isAdmin ? '勝利したアウトカムを選択してください' : '予想される決着結果'}
        </h4>
        <div className="space-y-2">
          {outcomes.map((outcome, index) => {
            const isSelected = selectedWinner === index;
            const payout = selectedWinner === index ? previewPayout : null;
            
            return (
              <div
                key={outcome.id}
                className={`border rounded-lg p-3 transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!isAdmin ? 'cursor-default' : ''}`}
                onClick={() => isAdmin && setSelectedWinner(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isSelected ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{outcome.name}</div>
                      <div className="text-xs text-gray-500">
                        現在の確率: {(outcome.yesPrice * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  {payout && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        +{payout.totalPayout.toFixed(2)} PT
                      </div>
                      <div className="text-xs text-gray-500">
                        あなたの獲得額
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ペイアウト詳細 */}
      {previewPayout && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="text-sm font-medium text-blue-900 mb-3">
            🏆 決着時のペイアウト詳細
          </h5>
          <div className="space-y-2 text-sm">
            <div className="font-medium text-blue-900 mb-2">YES トークンからの償還:</div>
            {previewPayout.yesTokenPayouts.map((payout, index) => (
              <div key={`yes-${index}`} className="flex justify-between text-blue-700">
                <span>{outcomes[index].name} YES:</span>
                <span>{payout.toFixed(2)} PT</span>
              </div>
            ))}
            
            <div className="font-medium text-blue-900 mb-2 mt-3">NO トークンからの償還:</div>
            {previewPayout.noTokenPayouts.map((payout, index) => (
              <div key={`no-${index}`} className="flex justify-between text-blue-700">
                <span>{outcomes[index].name} NO:</span>
                <span>{payout.toFixed(2)} PT</span>
              </div>
            ))}
            
            <div className="border-t border-blue-300 pt-2 mt-3">
              <div className="flex justify-between font-medium text-blue-900">
                <span>合計獲得:</span>
                <span>{previewPayout.totalPayout.toFixed(2)} PT</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 決着ボタン (管理者のみ) */}
      {isAdmin && (
        <div className="space-y-3">
          <button
            onClick={() => setShowConfirmation(true)}
            disabled={selectedWinner === null || isResolving}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              selectedWinner !== null && !isResolving
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isResolving ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>決着処理中...</span>
              </div>
            ) : (
              '市場を決着させる'
            )}
          </button>
          
          {selectedWinner === null && (
            <p className="text-xs text-red-600 text-center">
              勝利したアウトカムを選択してください
            </p>
          )}
        </div>
      )}

      {/* 確認ダイアログ */}
      {showConfirmation && selectedWinner !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-2 mb-4">
              <TrophyIcon className="w-6 h-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">決着の確認</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              <strong>{outcomes[selectedWinner].name}</strong> を勝利者として市場を決着させますか？
              この操作は取り消すことができません。
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleResolveMarket}
                className="flex-1 py-2 px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                決着させる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 説明 */}
      <div className="mt-6 p-3 bg-gray-50 rounded-lg">
        <h5 className="text-sm font-medium text-gray-900 mb-2">🚩 決着フローについて</h5>
        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>勝者 YES トークン:</strong> 1 PT で償還（勝利者のみ）</p>
          <p><strong>敗者 YES トークン:</strong> 価値ゼロ</p>
          <p><strong>勝者 NO トークン:</strong> 価値ゼロ（勝利したため）</p>
          <p><strong>敗者 NO トークン:</strong> 1 PT で償還（その他すべて）</p>
        </div>
      </div>
    </div>
  );
}