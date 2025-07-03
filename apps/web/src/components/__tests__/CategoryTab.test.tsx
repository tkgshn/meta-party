import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoryTab from '../CategoryTab'

/**
 * CategoryTab Component Tests
 * 
 * Following t-wada testing principles:
 * - Clear test names describing expected behavior
 * - Arrange-Act-Assert pattern
 * - Boundary value testing
 * - Edge case coverage
 */

describe('CategoryTab', () => {
  const mockCategories = [
    { id: 'all', name: 'すべて', count: 10 },
    { id: 'social', name: '社会保障', count: 3 },
    { id: 'government', name: '行政効率', count: 4 },
    { id: 'education', name: '教育', count: 3 },
  ]

  const mockOnCategoryChange = jest.fn()

  beforeEach(() => {
    mockOnCategoryChange.mockClear()
  })

  describe('Tab Rendering (タブレンダリング)', () => {
    it('すべてのカテゴリタブが正しく表示される', () => {
      // Arrange & Act
      render(
        <CategoryTab
          categories={mockCategories}
          selectedCategory="all"
          onCategoryChange={mockOnCategoryChange}
        />
      )

      // Assert
      expect(screen.getByText('すべて')).toBeInTheDocument()
      expect(screen.getByText('社会保障')).toBeInTheDocument()
      expect(screen.getByText('行政効率')).toBeInTheDocument()
      expect(screen.getByText('教育')).toBeInTheDocument()
    })

    it('各カテゴリの件数が正しく表示される', () => {
      // Arrange & Act
      render(
        <CategoryTab
          categories={mockCategories}
          selectedCategory="all"
          onCategoryChange={mockOnCategoryChange}
        />
      )

      // Assert
      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
      // Note: There are two '3's, so we check that at least one exists
      expect(screen.getAllByText('3')).toHaveLength(2)
    })

    it('選択されたタブが視覚的にハイライトされる', () => {
      // Arrange & Act
      render(
        <CategoryTab
          categories={mockCategories}
          selectedCategory="social"
          onCategoryChange={mockOnCategoryChange}
        />
      )

      // Assert
      const selectedTab = screen.getByRole('button', { name: /社会保障/ })
      expect(selectedTab).toHaveClass('border-blue-500', 'text-blue-600')
      
      const unselectedTab = screen.getByRole('button', { name: /すべて/ })
      expect(unselectedTab).toHaveClass('border-transparent', 'text-gray-500')
    })

    it('選択されたタブのカウントバッジがハイライトされる', () => {
      // Arrange & Act
      render(
        <CategoryTab
          categories={mockCategories}
          selectedCategory="government"
          onCategoryChange={mockOnCategoryChange}
        />
      )

      // Assert
      const selectedTabButton = screen.getByRole('button', { name: /行政効率/ })
      const countBadge = selectedTabButton.querySelector('span:last-child')
      expect(countBadge).toHaveClass('bg-blue-100', 'text-blue-600')
    })
  })

  describe('Tab Interaction (タブ操作)', () => {
    it('タブをクリックするとonCategoryChangeが呼ばれる', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <CategoryTab
          categories={mockCategories}
          selectedCategory="all"
          onCategoryChange={mockOnCategoryChange}
        />
      )

      // Act
      await user.click(screen.getByRole('button', { name: /社会保障/ }))

      // Assert
      expect(mockOnCategoryChange).toHaveBeenCalledWith('social')
      expect(mockOnCategoryChange).toHaveBeenCalledTimes(1)
    })

    it('既に選択されているタブをクリックしてもonCategoryChangeが呼ばれる', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <CategoryTab
          categories={mockCategories}
          selectedCategory="social"
          onCategoryChange={mockOnCategoryChange}
        />
      )

      // Act
      await user.click(screen.getByRole('button', { name: /社会保障/ }))

      // Assert
      expect(mockOnCategoryChange).toHaveBeenCalledWith('social')
    })

    it('複数のタブを連続してクリックできる', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <CategoryTab
          categories={mockCategories}
          selectedCategory="all"
          onCategoryChange={mockOnCategoryChange}
        />
      )

      // Act
      await user.click(screen.getByRole('button', { name: /社会保障/ }))
      await user.click(screen.getByRole('button', { name: /教育/ }))
      await user.click(screen.getByRole('button', { name: /すべて/ }))

      // Assert
      expect(mockOnCategoryChange).toHaveBeenCalledTimes(3)
      expect(mockOnCategoryChange).toHaveBeenNthCalledWith(1, 'social')
      expect(mockOnCategoryChange).toHaveBeenNthCalledWith(2, 'education')
      expect(mockOnCategoryChange).toHaveBeenNthCalledWith(3, 'all')
    })
  })

  describe('Keyboard Navigation (キーボードナビゲーション)', () => {
    it('タブキーでフォーカスを移動できる', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <CategoryTab
          categories={mockCategories}
          selectedCategory="all"
          onCategoryChange={mockOnCategoryChange}
        />
      )

      // Act: Tab through elements
      const firstTab = screen.getByRole('button', { name: /すべて/ })
      firstTab.focus()
      
      await user.tab()
      const secondTab = screen.getByRole('button', { name: /社会保障/ })
      
      // Assert
      expect(secondTab).toHaveFocus()
    })

    it('Enterキーでタブを選択できる', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <CategoryTab
          categories={mockCategories}
          selectedCategory="all"
          onCategoryChange={mockOnCategoryChange}
        />
      )

      // Act
      const socialTab = screen.getByRole('button', { name: /社会保障/ })
      socialTab.focus()
      await user.keyboard('[Enter]')

      // Assert
      expect(mockOnCategoryChange).toHaveBeenCalledWith('social')
    })

    it('スペースキーでタブを選択できる', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <CategoryTab
          categories={mockCategories}
          selectedCategory="all"
          onCategoryChange={mockOnCategoryChange}
        />
      )

      // Act
      const educationTab = screen.getByRole('button', { name: /教育/ })
      educationTab.focus()
      await user.keyboard('[Space]')

      // Assert
      expect(mockOnCategoryChange).toHaveBeenCalledWith('education')
    })
  })

  describe('Edge Cases and Boundary Values (エッジケースと境界値)', () => {
    it('空のカテゴリリストでもクラッシュしない', () => {
      // Arrange & Act
      expect(() => {
        render(
          <CategoryTab
            categories={[]}
            selectedCategory=""
            onCategoryChange={mockOnCategoryChange}
          />
        )
      }).not.toThrow()

      // Assert: No tabs should be rendered
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('カテゴリが1つの場合も正しく動作する', () => {
      // Arrange
      const singleCategory = [{ id: 'only', name: '唯一', count: 1 }]

      // Act
      render(
        <CategoryTab
          categories={singleCategory}
          selectedCategory="only"
          onCategoryChange={mockOnCategoryChange}
        />
      )

      // Assert
      const tab = screen.getByRole('button', { name: /唯一/ })
      expect(tab).toBeInTheDocument()
      expect(tab).toHaveClass('border-blue-500')
    })

    it('非常に長いカテゴリ名でも適切に表示される', () => {
      // Arrange
      const longNameCategories = [
        { 
          id: 'long', 
          name: 'これは非常に長いカテゴリ名です'.repeat(3), 
          count: 1 
        },
      ]

      // Act
      render(
        <CategoryTab
          categories={longNameCategories}
          selectedCategory="long"
          onCategoryChange={mockOnCategoryChange}
        />
      )

      // Assert
      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('カウントが0の場合も正しく表示される', () => {
      // Arrange
      const zeroCountCategories = [
        { id: 'empty', name: '空', count: 0 },
      ]

      // Act
      render(
        <CategoryTab
          categories={zeroCountCategories}
          selectedCategory="empty"
          onCategoryChange={mockOnCategoryChange}
        />
      )

      // Assert
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('非常に大きなカウント数でも正しく表示される', () => {
      // Arrange
      const largeCountCategories = [
        { id: 'huge', name: '巨大', count: 999999 },
      ]

      // Act
      render(
        <CategoryTab
          categories={largeCountCategories}
          selectedCategory="huge"
          onCategoryChange={mockOnCategoryChange}
        />
      )

      // Assert
      expect(screen.getByText('999999')).toBeInTheDocument()
    })

    it('存在しないカテゴリが選択されている場合でもクラッシュしない', () => {
      // Arrange & Act
      expect(() => {
        render(
          <CategoryTab
            categories={mockCategories}
            selectedCategory="nonexistent"
            onCategoryChange={mockOnCategoryChange}
          />
        )
      }).not.toThrow()

      // Assert: All tabs should be unselected
      mockCategories.forEach(category => {
        const tab = screen.getByRole('button', { name: new RegExp(category.name) })
        expect(tab).toHaveClass('border-transparent')
      })
    })
  })

  describe('Accessibility (アクセシビリティ)', () => {
    it('各タブが適切なARIA属性を持っている', () => {
      // Arrange & Act
      render(
        <CategoryTab
          categories={mockCategories}
          selectedCategory="social"
          onCategoryChange={mockOnCategoryChange}
        />
      )

      // Assert
      const selectedTab = screen.getByRole('button', { name: /社会保障/ })
      expect(selectedTab).toHaveAttribute('aria-current', 'page')

      const unselectedTab = screen.getByRole('button', { name: /すべて/ })
      expect(unselectedTab).not.toHaveAttribute('aria-current')
    })

    it('navランドマークが適切に設定されている', () => {
      // Arrange & Act
      render(
        <CategoryTab
          categories={mockCategories}
          selectedCategory="all"
          onCategoryChange={mockOnCategoryChange}
        />
      )

      // Assert
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByLabelText('Tabs')).toBeInTheDocument()
    })

    it('カウントバッジがスクリーンリーダーで適切に読み上げられる', () => {
      // Arrange & Act
      render(
        <CategoryTab
          categories={mockCategories}
          selectedCategory="all"
          onCategoryChange={mockOnCategoryChange}
        />
      )

      // Assert: Count should be part of the button text for screen readers
      expect(screen.getByRole('button', { name: /すべて.*10/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /社会保障.*3/ })).toBeInTheDocument()
    })
  })

  describe('Performance (パフォーマンス)', () => {
    it('大量のカテゴリでも効率的にレンダリングされる', () => {
      // Arrange
      const manyCategories = Array.from({ length: 100 }, (_, i) => ({
        id: `category-${i}`,
        name: `カテゴリ ${i}`,
        count: i,
      }))

      // Act: This should not cause performance issues
      const startTime = performance.now()
      
      render(
        <CategoryTab
          categories={manyCategories}
          selectedCategory="category-50"
          onCategoryChange={mockOnCategoryChange}
        />
      )
      
      const endTime = performance.now()

      // Assert: Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(100) // Less than 100ms
      expect(screen.getAllByRole('button')).toHaveLength(100)
    })
  })
})