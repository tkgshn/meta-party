'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  TagIcon,
  DocumentTextIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Header from '@/components/Header';
import { useAccount } from 'wagmi';

interface MarketFormData {
  title: string;
  description: string;
  category: string;
  resolutionCriteria: string;
  endDate: string;
  initialLiquidity: number;
  options: string[];
}

const MARKET_CATEGORIES = [
  { value: 'government', label: '政府・政策' },
  { value: 'social', label: '社会課題' },
  { value: 'education', label: '教育' },
  { value: 'environment', label: '環境' },
  { value: 'business', label: 'ビジネス' },
  { value: 'technology', label: '技術' },
];

/**
 * 市場作成ページ
 * - 管理者・市場作成権限者が新しい予測市場を作成
 * - カテゴリ選択、解決基準設定、初期流動性設定
 */
export default function CreateMarket() {
  const router = useRouter();
  const { address: account, isConnected } = useAccount();
  
  const [formData, setFormData] = useState<MarketFormData>({
    title: '',
    description: '',
    category: '',
    resolutionCriteria: '',
    endDate: '',
    initialLiquidity: 1000,
    options: ['', ''],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // ホワイトリストされたアドレス
  const whitelistedAddress = '0x2c5329fFa2A1f02A241Ec1932b4358bf71e158ae';

  useEffect(() => {
    if (!account) {
      setIsAuthorized(false);
      setAuthLoading(false);
      return;
    }

    // 管理者権限の確認
    const checkAuthorization = () => {
      const isWhitelisted = account.toLowerCase() === whitelistedAddress.toLowerCase();
      setIsAuthorized(isWhitelisted);
      setAuthLoading(false);
    };

    checkAuthorization();
  }, [account]);

  // Form handlers
  const handleInputChange = (field: keyof MarketFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({
      ...prev,
      options: newOptions,
    }));
  };

  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, ''],
      }));
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        options: newOptions,
      }));
    }
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) return 'タイトルを入力してください';
    if (!formData.description.trim()) return '詳細説明を入力してください';
    if (!formData.category) return 'カテゴリを選択してください';
    if (!formData.resolutionCriteria.trim()) return '解決基準を入力してください';
    if (!formData.endDate) return '終了日時を設定してください';
    if (formData.initialLiquidity < 100) return '初期流動性は100 PT以上である必要があります';
    
    const validOptions = formData.options.filter(opt => opt.trim());
    if (validOptions.length < 2) return '選択肢を2つ以上入力してください';
    
    // 終了日時が現在より未来かチェック
    const endDate = new Date(formData.endDate);
    if (endDate <= new Date()) return '終了日時は現在より未来である必要があります';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const validOptions = formData.options.filter(opt => opt.trim());
      
      const response = await fetch('/api/markets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          resolutionCriteria: formData.resolutionCriteria.trim(),
          endDate: formData.endDate,
          initialLiquidity: formData.initialLiquidity,
          options: validOptions,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '市場の作成に失敗しました');
      }

      setSuccess('市場が正常に作成されました！');
      
      // 成功後、少し待ってから管理ダッシュボードに戻る
      setTimeout(() => {
        router.push('/admin');
      }, 2000);

    } catch (err) {
      console.error('Market creation error:', err);
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 未接続時の表示
  if (!isConnected || !account) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                ウォレット接続が必要です
              </h2>
              <p className="mt-2 text-gray-600">
                市場を作成するには、ウォレットを接続してください。
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 認証中のローディング
  if (authLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">権限を確認しています...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 権限がない場合の表示
  if (!isAuthorized) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                市場作成権限がありません
              </h2>
              <p className="mt-2 text-gray-600">
                市場を作成する権限がありません。管理者にお問い合わせください。
              </p>
              <p className="mt-1 text-sm text-gray-500">
                現在のアドレス: {account.slice(0, 6)}...{account.slice(-4)}
              </p>
              <Link href="/admin" className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800">
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                管理ダッシュボードに戻る
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link href="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              管理ダッシュボードに戻る
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">新しい市場を作成</h1>
            <p className="mt-2 text-gray-600">
              Futarchy予測市場を作成して、コミュニティの意見を収集しましょう
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800">{success}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-lg shadow">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                  市場タイトル *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="例: 日本の2030年カーボンニュートラル達成予測"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={200}
                />
                <p className="mt-1 text-sm text-gray-500">{formData.title.length}/200文字</p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  詳細説明 *
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="市場の背景、予測対象の詳細、なぜこの予測が重要なのかを説明してください..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={1000}
                />
                <p className="mt-1 text-sm text-gray-500">{formData.description.length}/1000文字</p>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  <TagIcon className="h-4 w-4 inline mr-1" />
                  カテゴリ *
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">カテゴリを選択してください</option>
                  {MARKET_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  選択肢 * (最低2つ、最大6つ)
                </label>
                <div className="space-y-3">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`選択肢 ${index + 1}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        maxLength={100}
                      />
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="p-2 text-red-600 hover:text-red-800"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {formData.options.length < 6 && (
                    <button
                      type="button"
                      onClick={addOption}
                      className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      選択肢を追加
                    </button>
                  )}
                </div>
              </div>

              {/* Resolution Criteria */}
              <div>
                <label htmlFor="resolutionCriteria" className="block text-sm font-medium text-gray-700 mb-2">
                  解決基準 *
                </label>
                <textarea
                  id="resolutionCriteria"
                  value={formData.resolutionCriteria}
                  onChange={(e) => handleInputChange('resolutionCriteria', e.target.value)}
                  placeholder="この市場をどのような基準で解決するかを明確に記述してください。データソース、判定方法、解決時期などを含めてください..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={500}
                />
                <p className="mt-1 text-sm text-gray-500">{formData.resolutionCriteria.length}/500文字</p>
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  終了日時 *
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">市場の取引が終了する日時</p>
              </div>

              {/* Initial Liquidity */}
              <div>
                <label htmlFor="initialLiquidity" className="block text-sm font-medium text-gray-700 mb-2">
                  <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                  初期流動性 (PT) *
                </label>
                <input
                  type="number"
                  id="initialLiquidity"
                  value={formData.initialLiquidity}
                  onChange={(e) => handleInputChange('initialLiquidity', parseInt(e.target.value) || 0)}
                  min={100}
                  max={100000}
                  step={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-sm text-gray-500">市場の初期流動性を設定します（100〜100,000 PT）</p>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      市場を作成中...
                    </div>
                  ) : (
                    '市場を作成'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}