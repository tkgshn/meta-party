'use client';

import { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * テスト結果分析コンポーネント
 * 実際のボタン動作とシナリオテストの結果を分析・表示
 */
export default function TestAnalysis() {
  const [testStatus, setTestStatus] = useState({
    walletConnection: 'pending',
    networkSwitching: 'pending',
    claimButton: 'pending',
    ptDisplay: 'pending',
    errorHandling: 'confirmed',
  });

  // 現在確認されている状況の分析
  const analysisResults = [
    {
      category: 'Play Token Claim機能',
      status: 'confirmed',
      details: [
        '✅ スマートコントラクトレベルでの重複防止が正常動作',
        '✅ "PlayToken: Already claimed" エラーで既クレーム検出',
        '✅ 管理者アドレス(0x2c5329...)は既にクレーム済み',
        '⚠️ 未クレームアドレスでの動作確認が必要',
      ]
    },
    {
      category: 'ヘッダーUI統合',
      status: 'implemented',
      details: [
        '✅ PT symbol統一表示の実装完了',
        '✅ ポートフォリオ・キャッシュのヘッダーレベル表示',
        '✅ クレームボタンの条件分岐ロジック',
        '✅ 管理者権限チェックの実装',
      ]
    },
    {
      category: 'ネットワーク切り替え',
      status: 'needs_testing',
      details: [
        '⏳ Polygon Amoy ↔ Sepolia切り替えテスト',
        '⏳ ボタン表示・非表示の自動切り替え',
        '⏳ ネットワーク検出の精度確認',
        '⏳ PT記号の一貫表示確認',
      ]
    },
    {
      category: 'エラーハンドリング',
      status: 'confirmed',
      details: [
        '✅ スマートコントラクトエラーの適切な検出',
        '✅ Already claimedエラーの正確な識別',
        '✅ ガス不足エラーハンドリングの実装',
        '✅ フォーセットガイダンスの組み込み',
      ]
    }
  ];

  // テストに必要なシナリオ
  const testScenarios = [
    {
      title: '新規ユーザーシナリオ（未クレーム）',
      priority: 'high',
      steps: [
        '1. 新しいMetaMaskアカウント作成',
        '2. Polygon Amoyネットワーク追加',
        '3. フォーセットでPOL取得',
        '4. アプリに接続',
        '5. "1,000 PT受け取る"ボタン確認',
        '6. クレーム実行',
        '7. MetaMask自動追加確認',
      ],
      currentStatus: 'ガス不足のテストユーザーが必要'
    },
    {
      title: 'ネットワーク切り替えシナリオ',
      priority: 'high',
      steps: [
        '1. Sepoliaネットワークで接続',
        '2. PTシンボル表示確認（SEPではない）',
        '3. クレーム/追加ボタン非表示確認',
        '4. Polygon Amoyに切り替え',
        '5. ボタン表示確認',
        '6. 残高の正確な表示確認',
      ],
      currentStatus: 'テスト実行可能'
    },
    {
      title: '既存ユーザー（クレーム済み）',
      priority: 'medium',
      steps: [
        '1. クレーム済みアドレスで接続',
        '2. クレームボタン非表示確認 ✅',
        '3. "PT追加"ボタン表示確認',
        '4. 残高の即座表示確認',
        '5. PT記号統一確認',
      ],
      currentStatus: '管理者アドレスで一部確認済み'
    }
  ];

  // エラー分析
  const errorAnalysis = {
    contractError: {
      message: 'PlayToken: Already claimed',
      contract: '0x237B9E4EEE4AeAf712B5B240Ab03C973310B6bD1',
      fromAddress: '0x2c5329fFa2A1f02A241Ec1932b4358bf71e158ae',
      analysis: [
        '✅ スマートコントラクトが正常にデプロイされている',
        '✅ クレーム状態の追跡が機能している',
        '✅ 重複クレーム防止が動作している',
        '⚠️ UIでのhasClaimed状態と実際の状態の同期確認が必要',
      ]
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'implemented':
        return <CheckCircleIcon className="h-5 w-5 text-blue-600" />;
      case 'needs_testing':
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'border-green-200 bg-green-50';
      case 'implemented':
        return 'border-blue-200 bg-blue-50';
      case 'needs_testing':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">テスト結果分析 & 次のステップ</h1>
      
      {/* 現在の確認状況 */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">実装・動作確認状況</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analysisResults.map((result, index) => (
            <div key={index} className={`border rounded-lg p-6 ${getStatusColor(result.status)}`}>
              <div className="flex items-center mb-3">
                {getStatusIcon(result.status)}
                <h3 className="ml-2 text-lg font-medium">{result.category}</h3>
              </div>
              <ul className="space-y-1 text-sm">
                {result.details.map((detail, idx) => (
                  <li key={idx} className="text-gray-700">{detail}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* エラー分析 */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">発生エラーの詳細分析</h2>
        <div className="border-l-4 border-red-500 pl-4 mb-4">
          <h3 className="font-medium text-red-900">Contract Revert Error</h3>
          <code className="text-sm text-red-700 bg-red-100 px-2 py-1 rounded">
            {errorAnalysis.contractError.message}
          </code>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-600">Contract Address</div>
            <div className="font-mono text-xs">{errorAnalysis.contractError.contract}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">From Address</div>
            <div className="font-mono text-xs">{errorAnalysis.contractError.fromAddress}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Status</div>
            <div className="text-green-600 font-medium">Expected Behavior ✅</div>
          </div>
        </div>
        <div className="space-y-1 text-sm">
          {errorAnalysis.contractError.analysis.map((item, idx) => (
            <div key={idx}>{item}</div>
          ))}
        </div>
      </div>

      {/* 次のテストシナリオ */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">実行すべきテストシナリオ</h2>
        <div className="space-y-6">
          {testScenarios.map((scenario, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium">{scenario.title}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  scenario.priority === 'high' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {scenario.priority === 'high' ? '高優先度' : '中優先度'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <ol className="space-y-1 text-sm text-gray-700">
                    {scenario.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">現在の状況</div>
                  <div className="text-sm font-medium text-blue-600">{scenario.currentStatus}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 推奨アクション */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">推奨される次のアクション</h2>
        <div className="space-y-3 text-blue-800">
          <div className="flex items-start">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3">1</span>
            <div>
              <div className="font-medium">新しいテストアカウントでの未クレームシナリオテスト</div>
              <div className="text-sm">新しいMetaMaskアカウントを作成し、Play Tokenクレーム機能の完全なフローを確認</div>
            </div>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3">2</span>
            <div>
              <div className="font-medium">ネットワーク切り替えの包括的テスト</div>
              <div className="text-sm">Sepolia ↔ Polygon Amoy間でのボタン表示制御とPT記号表示の確認</div>
            </div>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3">3</span>
            <div>
              <div className="font-medium">ガス不足エラーハンドリングテスト</div>
              <div className="text-sm">POLトークンが不足したアカウントでのエラーメッセージとフォーセットガイダンスの確認</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}