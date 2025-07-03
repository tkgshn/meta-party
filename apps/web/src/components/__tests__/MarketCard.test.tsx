import { render, screen } from '@testing-library/react'
import MarketCard from '../MarketCard'

/**
 * MarketCard Component Tests
 * 
 * Following t-wada testing principles:
 * - Clear test names describing expected behavior
 * - Arrange-Act-Assert pattern
 * - Boundary value testing
 * - Edge case coverage
 */

describe('MarketCard', () => {
  const mockMarket = {
    id: '1',
    title: 'テスト市場',
    kpiDescription: 'これはテスト用のKPI説明です。',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    status: 'TRADING' as const,
    totalVolume: '5,240 PT',
    numProposals: 3,
    topPrice: 0.65,
  }

  describe('Market Display (市場表示)', () => {
    it('市場の基本情報が正しく表示される', () => {
      // Arrange & Act
      render(<MarketCard market={mockMarket} />)

      // Assert
      expect(screen.getByText('テスト市場')).toBeInTheDocument()
      expect(screen.getByText('これはテスト用のKPI説明です。')).toBeInTheDocument()
      expect(screen.getByText('5,240 PT')).toBeInTheDocument()
      expect(screen.getByText('3件')).toBeInTheDocument()
    })

    it('取引中ステータスが正しく表示される', () => {
      // Arrange & Act
      render(<MarketCard market={mockMarket} />)

      // Assert
      const statusBadge = screen.getByText('取引中')
      expect(statusBadge).toBeInTheDocument()
      expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('最高予測価格がパーセンテージで表示される', () => {
      // Arrange & Act
      render(<MarketCard market={mockMarket} />)

      // Assert
      expect(screen.getByText('65%')).toBeInTheDocument()
      expect(screen.getByText('信頼度')).toBeInTheDocument()
    })

    it('取引中の市場では締切までの時間が表示される', () => {
      // Arrange & Act
      render(<MarketCard market={mockMarket} />)

      // Assert: Using mocked date-fns
      expect(screen.getByText('2日後')).toBeInTheDocument()
    })
  })

  describe('Market Status Variations (市場ステータスバリエーション)', () => {
    it('取引終了状態の市場が正しく表示される', () => {
      // Arrange
      const closedMarket = {
        ...mockMarket,
        status: 'CLOSED' as const,
      }

      // Act
      render(<MarketCard market={closedMarket} />)

      // Assert
      const statusBadge = screen.getByText('取引終了')
      expect(statusBadge).toBeInTheDocument()
      expect(statusBadge).toHaveClass('bg-yellow-100', 'text-yellow-800')
      expect(screen.getByText('終了済み')).toBeInTheDocument()
    })

    it('解決済み状態の市場が正しく表示される', () => {
      // Arrange
      const resolvedMarket = {
        ...mockMarket,
        status: 'RESOLVED' as const,
      }

      // Act
      render(<MarketCard market={resolvedMarket} />)

      // Assert
      const statusBadge = screen.getByText('解決済み')
      expect(statusBadge).toBeInTheDocument()
      expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800')
    })
  })

  describe('Action Button Behavior (アクションボタンの動作)', () => {
    it('取引中の市場では参加するボタンが表示される', () => {
      // Arrange & Act
      render(<MarketCard market={mockMarket} />)

      // Assert
      const actionButton = screen.getByRole('link', { name: '参加する' })
      expect(actionButton).toBeInTheDocument()
      expect(actionButton).toHaveAttribute('href', '/market/1')
      expect(actionButton).toHaveClass('bg-blue-600')
    })

    it('取引終了の市場では詳細を見るボタンが表示される', () => {
      // Arrange
      const closedMarket = {
        ...mockMarket,
        status: 'CLOSED' as const,
      }

      // Act
      render(<MarketCard market={closedMarket} />)

      // Assert
      const actionButton = screen.getByRole('link', { name: '詳細を見る' })
      expect(actionButton).toBeInTheDocument()
      expect(actionButton).toHaveAttribute('href', '/market/1')
    })

    it('解決済みの市場では詳細を見るボタンが表示される', () => {
      // Arrange
      const resolvedMarket = {
        ...mockMarket,
        status: 'RESOLVED' as const,
      }

      // Act
      render(<MarketCard market={resolvedMarket} />)

      // Assert
      const actionButton = screen.getByRole('link', { name: '詳細を見る' })
      expect(actionButton).toBeInTheDocument()
    })
  })

  describe('Edge Cases and Boundary Values (エッジケースと境界値)', () => {
    it('極端に長いタイトルが適切に表示される', () => {
      // Arrange
      const longTitleMarket = {
        ...mockMarket,
        title: 'これは非常に長いタイトルです。'.repeat(10), // Very long title
      }

      // Act
      render(<MarketCard market={longTitleMarket} />)

      // Assert: Title should be displayed with line-clamp
      const titleElement = screen.getByText(longTitleMarket.title)
      expect(titleElement).toBeInTheDocument()
      expect(titleElement).toHaveClass('line-clamp-2')
    })

    it('極端に長いKPI説明が適切に表示される', () => {
      // Arrange
      const longDescriptionMarket = {
        ...mockMarket,
        kpiDescription: 'これは非常に長いKPI説明です。'.repeat(20),
      }

      // Act
      render(<MarketCard market={longDescriptionMarket} />)

      // Assert
      const descriptionElement = screen.getByText(longDescriptionMarket.kpiDescription)
      expect(descriptionElement).toBeInTheDocument()
      expect(descriptionElement).toHaveClass('line-clamp-3')
    })

    it('0%の予測価格が正しく表示される', () => {
      // Arrange
      const zeroPriceMarket = {
        ...mockMarket,
        topPrice: 0,
      }

      // Act
      render(<MarketCard market={zeroPriceMarket} />)

      // Assert
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('100%の予測価格が正しく表示される', () => {
      // Arrange
      const maxPriceMarket = {
        ...mockMarket,
        topPrice: 1.0,
      }

      // Act
      render(<MarketCard market={maxPriceMarket} />)

      // Assert
      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('小数点以下の予測価格が適切に四捨五入される', () => {
      // Arrange
      const decimalPriceMarket = {
        ...mockMarket,
        topPrice: 0.666, // Should round to 67%
      }

      // Act
      render(<MarketCard market={decimalPriceMarket} />)

      // Assert
      expect(screen.getByText('67%')).toBeInTheDocument()
    })

    it('提案数が1件の場合も正しく表示される', () => {
      // Arrange
      const singleProposalMarket = {
        ...mockMarket,
        numProposals: 1,
      }

      // Act
      render(<MarketCard market={singleProposalMarket} />)

      // Assert
      expect(screen.getByText('1件')).toBeInTheDocument()
    })

    it('提案数が大きい場合も正しく表示される', () => {
      // Arrange
      const manyProposalsMarket = {
        ...mockMarket,
        numProposals: 999,
      }

      // Act
      render(<MarketCard market={manyProposalsMarket} />)

      // Assert
      expect(screen.getByText('999件')).toBeInTheDocument()
    })
  })

  describe('Accessibility (アクセシビリティ)', () => {
    it('カードのすべての要素が適切にラベル付けされている', () => {
      // Arrange & Act
      render(<MarketCard market={mockMarket} />)

      // Assert: Important elements should be accessible
      expect(screen.getByRole('link')).toBeInTheDocument()
      
      // Assert: Status should be readable by screen readers
      expect(screen.getByText('取引中')).toBeInTheDocument()
      
      // Assert: Key metrics should be clearly labeled
      expect(screen.getByText('取引量')).toBeInTheDocument()
      expect(screen.getByText('提案数')).toBeInTheDocument()
      expect(screen.getByText('最高予測価格')).toBeInTheDocument()
      expect(screen.getByText('締切')).toBeInTheDocument()
    })

    it('ボタンが適切なARIA属性を持っている', () => {
      // Arrange & Act
      render(<MarketCard market={mockMarket} />)

      // Assert
      const actionButton = screen.getByRole('link', { name: '参加する' })
      expect(actionButton).toHaveAttribute('href', '/market/1')
    })
  })

  describe('Responsive Design (レスポンシブデザイン)', () => {
    it('適切なTailwind CSSクラスが適用されている', () => {
      // Arrange & Act
      const { container } = render(<MarketCard market={mockMarket} />)

      // Assert: Check for responsive classes
      const cardElement = container.firstChild as HTMLElement
      expect(cardElement).toHaveClass('bg-white', 'rounded-lg', 'shadow-sm')
    })
  })

  describe('Performance Considerations (パフォーマンス考慮)', () => {
    it('大量のマーケットカードを効率的にレンダリングできる', () => {
      // Arrange
      const markets = Array.from({ length: 100 }, (_, i) => ({
        ...mockMarket,
        id: i.toString(),
        title: `Market ${i}`,
      }))

      // Act: This should not cause performance issues
      const startTime = performance.now()
      
      markets.forEach((market) => {
        const { unmount } = render(<MarketCard market={market} />)
        unmount()
      })
      
      const endTime = performance.now()

      // Assert: Should complete within reasonable time (arbitrary threshold)
      expect(endTime - startTime).toBeLessThan(1000) // Less than 1 second
    })
  })
})