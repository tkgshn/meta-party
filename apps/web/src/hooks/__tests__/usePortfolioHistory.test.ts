import { renderHook, waitFor } from '@testing-library/react';
import { usePortfolioHistory } from '../usePortfolioHistory';

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  useAccount: jest.fn(() => ({ isConnected: true })),
  useConnectorClient: jest.fn(() => ({ data: null })),
}));

// Mock window.ethereum
Object.defineProperty(window, 'ethereum', {
  value: undefined,
  writable: true,
});

// Mock network config
jest.mock('@/config/networks', () => ({
  getCurrencyContract: jest.fn(() => '0x1234567890123456789012345678901234567890'),
  getNetworkByChainId: jest.fn(() => ({ name: 'Test Network' })),
}));

describe('usePortfolioHistory', () => {
  beforeEach(() => {
    // Clear console methods to reduce noise
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should handle missing wallet provider gracefully (Reown case)', async () => {
    const { result } = renderHook(() =>
      usePortfolioHistory('0x1234567890123456789012345678901234567890', 'polygon')
    );

    // Wait for the hook to complete its initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should not throw error and should provide mock data
    expect(result.current.error).toBeNull();
    expect(result.current.historyData).toBeDefined();
    expect(result.current.historyData.length).toBeGreaterThan(0);
    expect(result.current.transactions).toBeDefined();
  });

  it('should handle null account gracefully', async () => {
    const { result } = renderHook(() =>
      usePortfolioHistory(null, 'polygon')
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.historyData).toEqual([]);
  });

  it('should calculate profit/loss correctly', async () => {
    const { result } = renderHook(() =>
      usePortfolioHistory('0x1234567890123456789012345678901234567890', 'polygon')
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profitLoss).toBeDefined();
    expect(result.current.profitLoss.period).toBe('ALL');
    expect(typeof result.current.profitLoss.total).toBe('number');
    expect(typeof result.current.profitLoss.percentage).toBe('number');
  });

  it('should allow period changes', async () => {
    const { result } = renderHook(() =>
      usePortfolioHistory('0x1234567890123456789012345678901234567890', 'polygon')
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Test period change with rerender
    result.current.setPeriod('1W');
    
    await waitFor(() => {
      expect(result.current.profitLoss.period).toBe('1W');
    });
  });
});