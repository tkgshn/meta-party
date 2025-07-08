'use client';

import { useState, useEffect } from 'react';
import { useTwitterLink } from '@/hooks/useTwitterLink';
import { useSocialAuth } from '@/hooks/useSocialAuth';
import { 
  UserGroupIcon, 
  GiftIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface TwitterVolunteerCardProps {
  networkKey?: string;
}

export default function TwitterVolunteerCard({ networkKey = 'polygonAmoy' }: TwitterVolunteerCardProps) {
  const [twitterInput, setTwitterInput] = useState('');
  const [bonusStatus, setBonusStatus] = useState<{
    loading: boolean;
    success: boolean;
    error: string | null;
    txHash?: string;
    volunteerInfo?: any;
    checkingVolunteer: boolean;
  }>({
    loading: false,
    success: false,
    error: null,
    checkingVolunteer: false
  });

  const {
    isLinked,
    twitterId: linkedTwitterId,
    loading: linkLoading,
    error: linkError,
    linkTwitter,
    unlinkTwitter
  } = useTwitterLink();

  const { 
    isConnected, 
    address, 
    checkVolunteerStatus, 
    claimVolunteerBonus 
  } = useSocialAuth();

  // 既存の連携があれば自動設定
  useEffect(() => {
    if (isLinked && linkedTwitterId && !twitterInput) {
      setTwitterInput(linkedTwitterId);
      // 自動的にボランティア状態をチェック
      handleCheckVolunteer(linkedTwitterId);
    }
  }, [isLinked, linkedTwitterId]);

  /**
   * ボランティア状態確認
   */
  const handleCheckVolunteer = async (twitterId?: string) => {
    const idToCheck = twitterId || twitterInput.trim();
    
    if (!idToCheck) {
      setBonusStatus(prev => ({ 
        ...prev, 
        error: 'Twitter IDを入力してください',
        checkingVolunteer: false
      }));
      return;
    }

    if (!isConnected || !address) {
      setBonusStatus(prev => ({ 
        ...prev, 
        error: 'ウォレットを接続してください',
        checkingVolunteer: false
      }));
      return;
    }

    setBonusStatus(prev => ({ ...prev, checkingVolunteer: true, error: null }));

    try {
      const result = await checkVolunteerStatus(idToCheck, address);
      
      if (result.isVolunteer) {
        setBonusStatus(prev => ({
          ...prev,
          checkingVolunteer: false,
          error: null,
          volunteerInfo: result.volunteerInfo
        }));
      } else {
        setBonusStatus(prev => ({
          ...prev,
          checkingVolunteer: false,
          error: 'このTwitter IDはボランティアリストに登録されていません'
        }));
      }
    } catch (error) {
      setBonusStatus(prev => ({
        ...prev,
        checkingVolunteer: false,
        error: 'ボランティア状態の確認に失敗しました'
      }));
    }
  };

  /**
   * Twitter連携実行
   */
  const handleLinkTwitter = async () => {
    if (!twitterInput.trim()) return;

    const success = await linkTwitter(twitterInput.trim());
    if (success) {
      // 連携成功後、自動的にボランティア状態をチェック
      await handleCheckVolunteer(twitterInput.trim());
    }
  };

  /**
   * ボランティアボーナス請求
   */
  const handleClaimBonus = async () => {
    setBonusStatus(prev => ({ ...prev, loading: true }));

    try {
      const result = await claimVolunteerBonus(twitterInput, networkKey);
      
      if (result.success) {
        setBonusStatus(prev => ({
          ...prev,
          loading: false,
          success: true,
          error: null,
          txHash: result.txHash
        }));
      } else {
        setBonusStatus(prev => ({
          ...prev,
          loading: false,
          success: false,
          error: result.message || 'ボーナス請求に失敗しました'
        }));
      }
    } catch (error: any) {
      setBonusStatus(prev => ({
        ...prev,
        loading: false,
        success: false,
        error: error.message || 'ボーナス請求に失敗しました'
      }));
    }
  };

  /**
   * Twitter連携解除
   */
  const handleUnlinkTwitter = async () => {
    if (confirm('Twitter連携を解除しますか？ボランティアボーナスの受け取りができなくなります。')) {
      const success = await unlinkTwitter();
      if (success) {
        setTwitterInput('');
        setBonusStatus({
          loading: false,
          success: false,
          error: null,
          checkingVolunteer: false
        });
      }
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <div className="flex-shrink-0">
          <UserGroupIcon className="h-8 w-8 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Twitter連携・ボランティアボーナス
          </h3>
          <p className="text-sm text-gray-600">
            Twitter IDを連携してボランティアボーナス（2,000 PT）を受け取り
          </p>
        </div>
      </div>

      {/* 連携状態表示 */}
      {isLinked && linkedTwitterId ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <div>
                <span className="font-medium text-green-800">Twitter連携済み</span>
                <p className="text-sm text-green-700">{linkedTwitterId}</p>
              </div>
            </div>
            <button
              onClick={handleUnlinkTwitter}
              disabled={linkLoading}
              className="text-sm text-red-600 hover:text-red-800 hover:underline disabled:text-gray-400"
            >
              {linkLoading ? '処理中...' : '連携解除'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Twitter ID入力 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Twitter ID
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={twitterInput}
                onChange={(e) => setTwitterInput(e.target.value)}
                placeholder="@your_twitter_id"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                disabled={linkLoading || bonusStatus.loading}
              />
              <button
                onClick={handleLinkTwitter}
                disabled={linkLoading || bonusStatus.loading || !twitterInput.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors whitespace-nowrap"
              >
                {linkLoading ? '連携中...' : '連携'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ボランティア情報表示 */}
      {bonusStatus.volunteerInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <UserIcon className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-800">
              ボランティア認証済み
            </span>
          </div>
          <div className="text-sm text-blue-700">
            <p><strong>名前:</strong> {bonusStatus.volunteerInfo.name}</p>
            <p><strong>役割:</strong> {bonusStatus.volunteerInfo.role}</p>
            <p><strong>Twitter:</strong> {bonusStatus.volunteerInfo.twitter_id}</p>
          </div>
          
          {!bonusStatus.success && (
            <button
              onClick={handleClaimBonus}
              disabled={bonusStatus.loading}
              className="mt-3 w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:bg-gray-400 transition-all"
            >
              <GiftIcon className="h-5 w-5" />
              <span>
                {bonusStatus.loading ? 'ボーナス請求中...' : '2,000 PTボーナス請求'}
              </span>
            </button>
          )}
        </div>
      )}

      {/* ボランティア確認ボタン（連携済みで未確認の場合） */}
      {isLinked && linkedTwitterId && !bonusStatus.volunteerInfo && !bonusStatus.success && (
        <button
          onClick={() => handleCheckVolunteer()}
          disabled={bonusStatus.checkingVolunteer}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors mb-4"
        >
          <UserGroupIcon className="h-5 w-5" />
          <span>
            {bonusStatus.checkingVolunteer ? 'ボランティア確認中...' : 'ボランティア状態を確認'}
          </span>
        </button>
      )}

      {/* 成功メッセージ */}
      {bonusStatus.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">
              ボーナス付与完了！
            </span>
          </div>
          <p className="text-sm text-green-700 mb-2">
            2,000 PTのボランティアボーナスが付与されました。
          </p>
          {bonusStatus.txHash && (
            <a
              href={`https://amoy.polygonscan.com/tx/${bonusStatus.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              トランザクション詳細 →
            </a>
          )}
        </div>
      )}

      {/* エラーメッセージ */}
      {(bonusStatus.error || linkError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">エラー</span>
          </div>
          <p className="text-sm text-red-700 mt-1">
            {bonusStatus.error || linkError}
          </p>
        </div>
      )}

      {/* 説明 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">ご利用の流れ</h4>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. Twitter IDを入力して連携</li>
          <li>2. ボランティア状態の自動確認</li>
          <li>3. 登録済みの場合、2,000 PTボーナス請求</li>
          <li>4. 未登録でも基本の1,000 PTは別途請求可能</li>
        </ol>
        <p className="text-xs text-gray-500 mt-3">
          ※ ボランティアボーナスは各アドレス1回限りです
        </p>
      </div>
    </div>
  );
}