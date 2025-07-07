'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  PlusIcon, 
  XMarkIcon,
  CalendarIcon,
  DocumentTextIcon,
  TagIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { MARKET_CATEGORIES, type MarketCategory } from '@/lib/rbac'

interface MarketCreationFormProps {
  isOpen: boolean
  onClose: () => void
  userRoles: any
}

export default function MarketCreationForm({ isOpen, onClose, userRoles }: MarketCreationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as MarketCategory | '',
    resolutionCriteria: '',
    endDate: '',
    initialLiquidity: 1000,
    options: ['Yes', 'No']
  })

  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setValidationErrors([]) // Clear validation errors on input change
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData(prev => ({ ...prev, options: newOptions }))
  }

  const addOption = () => {
    if (formData.options.length < 10) {
      setFormData(prev => ({ ...prev, options: [...prev.options, ''] }))
    }
  }

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, options: newOptions }))
    }
  }

  const validateForm = () => {
    const errors: string[] = []

    if (!formData.title || formData.title.trim().length < 10) {
      errors.push('市場タイトルは最低10文字必要です')
    }

    if (!formData.description || formData.description.trim().length < 50) {
      errors.push('市場説明は最低50文字必要です')
    }

    if (!formData.category) {
      errors.push('カテゴリを選択してください')
    }

    if (!formData.resolutionCriteria || formData.resolutionCriteria.trim().length < 20) {
      errors.push('解決基準は最低20文字必要です')
    }

    if (!formData.endDate) {
      errors.push('終了日を設定してください')
    } else {
      const endDate = new Date(formData.endDate)
      if (endDate <= new Date()) {
        errors.push('終了日は未来の日付である必要があります')
      }
    }

    if (formData.initialLiquidity < 100) {
      errors.push('初期流動性は最低100 PT必要です')
    }

    const validOptions = formData.options.filter(opt => opt.trim().length > 0)
    if (validOptions.length < 2) {
      errors.push('最低2つの選択肢が必要です')
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/markets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.validationErrors) {
          setValidationErrors(result.validationErrors)
        }
        throw new Error(result.message || result.error || '市場作成に失敗しました')
      }

      setSuccess('市場が正常に作成されました！')
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '' as MarketCategory | '',
        resolutionCriteria: '',
        endDate: '',
        initialLiquidity: 1000,
        options: ['Yes', 'No']
      })

      // Redirect to the new market
      setTimeout(() => {
        router.push(`/market/${result.marketId}`)
      }, 2000)

    } catch (error) {
      console.error('Market creation failed:', error)
      setError(error instanceof Error ? error.message : '不明なエラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <PlusIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">新しい市場を作成</h2>
              <p className="text-sm text-gray-600">予測市場を作成して集合知による意思決定を促進</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error/Success Messages */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-red-800">入力エラー</h3>
                  <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-800">
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-800">
                <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{success}</span>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  市場タイトル *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="例: 日本は2050年までにカーボンニュートラルを達成するか？"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">最低10文字</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  カテゴリ *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">カテゴリを選択</option>
                  {MARKET_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category === 'government' && '政府・行政'}
                      {category === 'social' && '社会・福祉'}
                      {category === 'education' && '教育'}
                      {category === 'environment' && '環境・エネルギー'}
                      {category === 'business' && 'ビジネス・経済'}
                      {category === 'technology' && 'テクノロジー'}
                      {category === 'healthcare' && 'ヘルスケア'}
                      {category === 'infrastructure' && 'インフラ・都市'}
                    </option>
                  ))}
                </select>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  終了日 *
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Initial Liquidity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  初期流動性 (PT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.initialLiquidity}
                    onChange={(e) => handleInputChange('initialLiquidity', parseInt(e.target.value))}
                    min="100"
                    step="100"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <CurrencyDollarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
                <p className="text-xs text-gray-500 mt-1">最低100 PT</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  市場説明 *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  placeholder="この市場の背景、重要性、予測対象について詳しく説明してください..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">最低50文字</p>
              </div>

              {/* Resolution Criteria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  解決基準 *
                </label>
                <textarea
                  value={formData.resolutionCriteria}
                  onChange={(e) => handleInputChange('resolutionCriteria', e.target.value)}
                  rows={3}
                  placeholder="どのような条件が満たされた時に各選択肢が正解となるかを明確に定義してください..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">最低20文字</p>
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  選択肢 *
                </label>
                <div className="space-y-2">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`選択肢 ${index + 1}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {formData.options.length < 10 && (
                    <button
                      type="button"
                      onClick={addOption}
                      className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4 inline mr-2" />
                      選択肢を追加
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">2-10個の選択肢</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-2"></div>
                  作成中...
                </>
              ) : (
                '市場を作成'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}