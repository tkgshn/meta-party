'use client';

import { usePortfolioValue } from '@/hooks/usePortfolioValue';

export default function PortfolioPage() {
  const { portfolioValue, cash } = usePortfolioValue();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold leading-tight text-gray-900">ポートフォリオ</h1>
          <p className="mt-2 text-lg text-gray-500">あなたの資産状況と取引履歴</p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900">ポートフォリオ合計</h2>
            <p className="mt-2 text-4xl font-bold text-blue-600">{portfolioValue.toLocaleString()} PT</p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900">利用可能キャッシュ</h2>
            <p className="mt-2 text-4xl font-bold text-green-600">{cash.toLocaleString()} PT</p>
          </div>
        </div>

        {/* Placeholder for positions, history, and chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900">現在のポジション</h2>
          <p className="mt-4 text-gray-500">現在、ポジションはありません。</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900">取引履歴</h2>
          <p className="mt-4 text-gray-500">取引履歴はありません。</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900">ポートフォリオ推移</h2>
          <p className="mt-4 text-gray-500">チャートは現在準備中です。</p>
        </div>
      </div>
    </div>
  );
}