'use client';

import { useState, useEffect } from 'react';

// Mock data for development
const mockMarkets = [
  {
    id: '1',
    title: '社会保障制度の捕捉率向上プロジェクト',
    kpiDescription: '社会保障制度の対象だが、抜け漏れている人たちの捕捉率を10%向上させることができるか？',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'TRADING' as const,
    totalVolume: '5,240 PT',
    numProposals: 3,
    topPrice: 0.65,
  },
  {
    id: '2',
    title: 'デジタル政府サービス効率化',
    kpiDescription: '行政手続きのデジタル化により、処理時間を30%短縮できるか？',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    status: 'TRADING' as const,
    totalVolume: '3,840 PT',
    numProposals: 5,
    topPrice: 0.42,
  },
  {
    id: '3',
    title: '教育格差是正プログラム',
    kpiDescription: '低所得世帯の子どもの学力向上により、格差指標を15%改善できるか？',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    status: 'CLOSED' as const,
    totalVolume: '8,960 PT',
    numProposals: 4,
    topPrice: 0.78,
  },
];

const categories = [
  { id: 'all', name: 'すべて', count: 3 },
  { id: 'social', name: '社会保障', count: 1 },
  { id: 'government', name: '行政効率', count: 1 },
  { id: 'education', name: '教育', count: 1 },
];

export default function HomePage() {
  const [account, setAccount] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Simple MetaMask connection
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        setAccount(accounts[0]);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    } else {
      alert('MetaMask not found. Please install MetaMask.');
    }
  };

  // Check if already connected
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        });
    }
  }, []);

  const filteredMarkets = selectedCategory === 'all' 
    ? mockMarkets 
    : mockMarkets.filter(market => {
        if (selectedCategory === 'social') return market.id === '1';
        if (selectedCategory === 'government') return market.id === '2';
        if (selectedCategory === 'education') return market.id === '3';
        return false;
      });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            予測市場
          </h1>
          <p className="text-gray-600 mt-2">
            社会課題の解決策に投資して、より良い未来を予測しましょう
          </p>
        </div>
        {account ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
            <button
              onClick={() => setAccount(null)}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Connect Wallet
          </button>
        )}
      </div>

      {/* Welcome Message for New Users */}
      {account && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                ウォレットが接続されました！
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  1,000 Play Token (PT) を無料で取得して予測市場に参加できます。
                  <a href="/dashboard" className="font-medium underline hover:text-blue-600">
                    マイページ
                  </a>
                  でトークンを請求してください。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedCategory === category.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {category.name}
              <span className="ml-2 py-0.5 px-2 text-xs rounded-full bg-gray-100 text-gray-900">
                {category.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Market Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMarkets.map((market) => (
          <div key={market.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  market.status === 'TRADING' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {market.status === 'TRADING' ? '取引中' : '終了'}
                </span>
                <span className="text-sm text-gray-500">
                  {market.deadline.toLocaleDateString('ja-JP')}
                </span>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {market.title}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                {market.kpiDescription}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>出来高: {market.totalVolume}</span>
                <span>提案数: {market.numProposals}</span>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-semibold text-blue-600">
                  {(market.topPrice * 100).toFixed(0)}%
                </span>
                <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                  詳細を見る
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMarkets.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A9.971 9.971 0 0124 24c4.21 0 7.813 2.602 9.288 6.286" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">市場がありません</h3>
          <p className="mt-1 text-sm text-gray-500">選択されたカテゴリには市場がありません。</p>
        </div>
      )}

      {/* Getting Started Section */}
      {!account && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Futarchy プラットフォームへようこそ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-medium text-gray-900">ウォレット接続</h3>
              <p className="text-sm text-gray-500 mt-1">
                MetaMaskなどのウォレットを接続
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h3 className="font-medium text-gray-900">PT取得</h3>
              <p className="text-sm text-gray-500 mt-1">
                無料で1,000 Play Tokenを取得
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h3 className="font-medium text-gray-900">予測投資</h3>
              <p className="text-sm text-gray-500 mt-1">
                最適な解決策に投資して予測
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
