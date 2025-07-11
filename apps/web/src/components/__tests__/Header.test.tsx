import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '../Header';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useToken } from '@/hooks/useToken';
import { useOnChainPortfolio } from '@/hooks/useOnChainPortfolio';
import { usePlayToken } from '@/hooks/usePlayToken';

// Mock modules
jest.mock('wagmi');
jest.mock('@reown/appkit/react');
jest.mock('@/hooks/useToken');
jest.mock('@/hooks/useOnChainPortfolio');
jest.mock('@/hooks/usePlayToken');
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

const mockUseAccount = useAccount as jest.Mock;
const mockUseDisconnect = useDisconnect as jest.Mock;
const mockUseAppKit = useAppKit as jest.Mock;
const mockUseToken = useToken as jest.Mock;
const mockUseOnChainPortfolio = useOnChainPortfolio as jest.Mock;
const mockUsePlayToken = usePlayToken as jest.Mock;

describe('Header Component - Play Token Integration', () => {
  const mockDisconnect = jest.fn();
  const mockOpen = jest.fn();
  const mockRefreshBalance = jest.fn();
  const mockClaimTokens = jest.fn();
  const mockAddTokenToMetaMask = jest.fn();
  const mockPlayTokenRefreshBalance = jest.fn();
  const mockPlayTokenRefreshClaimStatus = jest.fn();

  const defaultMocks = {
    account: null,
    isConnected: false,
    chainId: undefined,
    disconnect: mockDisconnect,
    open: mockOpen,
    tokenBalance: '0',
    tokenSymbol: null,
    tokenLoading: false,
    refreshBalance: mockRefreshBalance,
    positionTokens: [],
    totalPortfolioValue: 0,
    portfolioLoading: false,
    playTokenBalance: '0',
    hasClaimed: false,
    playTokenLoading: false,
    claimTokens: mockClaimTokens,
    addTokenToMetaMask: mockAddTokenToMetaMask,
    refreshBalance: mockPlayTokenRefreshBalance,
    refreshClaimStatus: mockPlayTokenRefreshClaimStatus,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAccount.mockReturnValue({
      address: defaultMocks.account,
      isConnected: defaultMocks.isConnected,
      chainId: defaultMocks.chainId,
    });
    
    mockUseDisconnect.mockReturnValue({
      disconnect: mockDisconnect,
    });
    
    mockUseAppKit.mockReturnValue({
      open: mockOpen,
    });
    
    mockUseToken.mockReturnValue({
      balance: defaultMocks.tokenBalance,
      symbol: defaultMocks.tokenSymbol,
      isLoading: defaultMocks.tokenLoading,
      refreshBalance: mockRefreshBalance,
    });
    
    mockUseOnChainPortfolio.mockReturnValue({
      positionTokens: defaultMocks.positionTokens,
      totalPortfolioValue: defaultMocks.totalPortfolioValue,
      isLoading: defaultMocks.portfolioLoading,
    });
    
    mockUsePlayToken.mockReturnValue({
      balance: defaultMocks.playTokenBalance,
      hasClaimed: defaultMocks.hasClaimed,
      isLoading: defaultMocks.playTokenLoading,
      claimTokens: mockClaimTokens,
      addTokenToMetaMask: mockAddTokenToMetaMask,
      refreshBalance: mockPlayTokenRefreshBalance,
      refreshClaimStatus: mockPlayTokenRefreshClaimStatus,
    });
  });

  describe('Portfolio Display with PT Symbol', () => {
    it('should display portfolio and cash with PT symbol when connected to Polygon Amoy', () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        chainId: 80002, // Polygon Amoy
      });
      
      mockUsePlayToken.mockReturnValue({
        balance: '1000',
        hasClaimed: true,
        isLoading: false,
        claimTokens: mockClaimTokens,
        addTokenToMetaMask: mockAddTokenToMetaMask,
        refreshBalance: mockPlayTokenRefreshBalance,
        refreshClaimStatus: mockPlayTokenRefreshClaimStatus,
      });
      
      mockUseOnChainPortfolio.mockReturnValue({
        positionTokens: [{ value: 500 }],
        totalPortfolioValue: 1500,
        isLoading: false,
      });

      render(<Header />);
      
      // Check portfolio display
      expect(screen.getByText('ポートフォリオ:')).toBeInTheDocument();
      expect(screen.getByText('1,500 PT')).toBeInTheDocument();
      
      // Check cash display
      expect(screen.getByText('キャッシュ:')).toBeInTheDocument();
      expect(screen.getByText('1,000 PT')).toBeInTheDocument();
    });

    it('should display PT symbol for Sepolia network', () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        chainId: 11155111, // Sepolia
      });
      
      mockUseToken.mockReturnValue({
        balance: '2500',
        symbol: 'SEP',
        isLoading: false,
        refreshBalance: mockRefreshBalance,
      });

      render(<Header />);
      
      // Should display PT instead of SEP
      expect(screen.getByText('2,500 PT')).toBeInTheDocument();
      expect(screen.queryByText(/SEP/)).not.toBeInTheDocument();
    });

    it('should show loading state while fetching balance', () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        chainId: 80002,
      });
      
      mockUsePlayToken.mockReturnValue({
        balance: '0',
        hasClaimed: false,
        isLoading: true,
        claimTokens: mockClaimTokens,
        addTokenToMetaMask: mockAddTokenToMetaMask,
        refreshBalance: mockPlayTokenRefreshBalance,
        refreshClaimStatus: mockPlayTokenRefreshClaimStatus,
      });

      render(<Header />);
      
      // Should show loading indicator
      const loadingElements = screen.getAllByText('...');
      expect(loadingElements.length).toBeGreaterThan(0);
    });
  });

  describe('Play Token Claim Button Logic', () => {
    it('should show claim button for Polygon Amoy users who have not claimed', () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        chainId: 80002, // Polygon Amoy
      });
      
      mockUsePlayToken.mockReturnValue({
        balance: '0',
        hasClaimed: false,
        isLoading: false,
        claimTokens: mockClaimTokens,
        addTokenToMetaMask: mockAddTokenToMetaMask,
        refreshBalance: mockPlayTokenRefreshBalance,
        refreshClaimStatus: mockPlayTokenRefreshClaimStatus,
      });

      render(<Header />);
      
      expect(screen.getByText('1,000 PT受け取る')).toBeInTheDocument();
    });

    it('should NOT show claim button for users who have already claimed', () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        chainId: 80002,
      });
      
      mockUsePlayToken.mockReturnValue({
        balance: '1000',
        hasClaimed: true,
        isLoading: false,
        claimTokens: mockClaimTokens,
        addTokenToMetaMask: mockAddTokenToMetaMask,
        refreshBalance: mockPlayTokenRefreshBalance,
        refreshClaimStatus: mockPlayTokenRefreshClaimStatus,
      });

      render(<Header />);
      
      expect(screen.queryByText('1,000 PT受け取る')).not.toBeInTheDocument();
    });

    it('should NOT show claim button on non-Amoy networks', () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        chainId: 11155111, // Sepolia
      });
      
      mockUsePlayToken.mockReturnValue({
        balance: '0',
        hasClaimed: false,
        isLoading: false,
        claimTokens: mockClaimTokens,
        addTokenToMetaMask: mockAddTokenToMetaMask,
        refreshBalance: mockPlayTokenRefreshBalance,
        refreshClaimStatus: mockPlayTokenRefreshClaimStatus,
      });

      render(<Header />);
      
      expect(screen.queryByText('1,000 PT受け取る')).not.toBeInTheDocument();
    });

    it('should handle claim with gas error correctly', async () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        chainId: 80002,
      });
      
      mockClaimTokens.mockResolvedValue({
        success: false,
        error: 'ガス代（POL）が不足しています',
      });
      
      mockUsePlayToken.mockReturnValue({
        balance: '0',
        hasClaimed: false,
        isLoading: false,
        claimTokens: mockClaimTokens,
        addTokenToMetaMask: mockAddTokenToMetaMask,
        refreshBalance: mockPlayTokenRefreshBalance,
        refreshClaimStatus: mockPlayTokenRefreshClaimStatus,
      });

      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      render(<Header />);
      
      const claimButton = screen.getByText('1,000 PT受け取る');
      fireEvent.click(claimButton);
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'ガス代（POL）が不足しています。Polygon Amoy フォーセットからテストトークンを取得してください: https://faucet.polygon.technology/'
        );
      });
      
      alertSpy.mockRestore();
    });

    it('should auto-add token to MetaMask after successful claim', async () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        chainId: 80002,
      });
      
      mockClaimTokens.mockResolvedValue({
        success: true,
        txHash: '0xabc123',
      });
      
      mockUsePlayToken.mockReturnValue({
        balance: '0',
        hasClaimed: false,
        isLoading: false,
        claimTokens: mockClaimTokens,
        addTokenToMetaMask: mockAddTokenToMetaMask,
        refreshBalance: mockPlayTokenRefreshBalance,
        refreshClaimStatus: mockPlayTokenRefreshClaimStatus,
      });

      render(<Header />);
      
      const claimButton = screen.getByText('1,000 PT受け取る');
      fireEvent.click(claimButton);
      
      await waitFor(() => {
        expect(mockClaimTokens).toHaveBeenCalled();
      });
      
      // Wait for the setTimeout to trigger
      await waitFor(() => {
        expect(mockAddTokenToMetaMask).toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });

  describe('Add PT to MetaMask Button', () => {
    it('should show PT add button for Polygon Amoy users', () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        chainId: 80002,
      });
      
      mockUsePlayToken.mockReturnValue({
        balance: '1000',
        hasClaimed: true,
        isLoading: false,
        claimTokens: mockClaimTokens,
        addTokenToMetaMask: mockAddTokenToMetaMask,
        refreshBalance: mockPlayTokenRefreshBalance,
        refreshClaimStatus: mockPlayTokenRefreshClaimStatus,
      });

      render(<Header />);
      
      expect(screen.getByText('PT追加')).toBeInTheDocument();
    });

    it('should NOT show PT add button for non-Amoy networks', () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        chainId: 11155111, // Sepolia
      });

      render(<Header />);
      
      expect(screen.queryByText('PT追加')).not.toBeInTheDocument();
    });

    it('should call addTokenToMetaMask when PT add button is clicked', () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        chainId: 80002,
      });
      
      mockUsePlayToken.mockReturnValue({
        balance: '1000',
        hasClaimed: true,
        isLoading: false,
        claimTokens: mockClaimTokens,
        addTokenToMetaMask: mockAddTokenToMetaMask,
        refreshBalance: mockPlayTokenRefreshBalance,
        refreshClaimStatus: mockPlayTokenRefreshClaimStatus,
      });

      render(<Header />);
      
      const addButton = screen.getByText('PT追加');
      fireEvent.click(addButton);
      
      expect(mockAddTokenToMetaMask).toHaveBeenCalled();
    });
  });

  describe('Portfolio Value Calculations', () => {
    it('should calculate portfolio value correctly with Play Token balance', () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        chainId: 80002,
      });
      
      mockUsePlayToken.mockReturnValue({
        balance: '1000',
        hasClaimed: true,
        isLoading: false,
        claimTokens: mockClaimTokens,
        addTokenToMetaMask: mockAddTokenToMetaMask,
        refreshBalance: mockPlayTokenRefreshBalance,
        refreshClaimStatus: mockPlayTokenRefreshClaimStatus,
      });
      
      mockUseOnChainPortfolio.mockReturnValue({
        positionTokens: [{ value: 250 }, { value: 750 }],
        totalPortfolioValue: 0, // Will be calculated
        isLoading: false,
      });

      render(<Header />);
      
      // Portfolio = cash (1000) + positions (250 + 750) = 2000
      expect(screen.getByText('2,000 PT')).toBeInTheDocument();
      
      // Cash = 1000
      expect(screen.getByText('1,000 PT')).toBeInTheDocument();
    });

    it('should use totalPortfolioValue when available', () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        chainId: 80002,
      });
      
      mockUsePlayToken.mockReturnValue({
        balance: '1000',
        hasClaimed: true,
        isLoading: false,
        claimTokens: mockClaimTokens,
        addTokenToMetaMask: mockAddTokenToMetaMask,
        refreshBalance: mockPlayTokenRefreshBalance,
        refreshClaimStatus: mockPlayTokenRefreshClaimStatus,
      });
      
      mockUseOnChainPortfolio.mockReturnValue({
        positionTokens: [],
        totalPortfolioValue: 3500, // Pre-calculated value
        isLoading: false,
      });

      render(<Header />);
      
      // Should use totalPortfolioValue
      expect(screen.getByText('3,500 PT')).toBeInTheDocument();
    });
  });

  describe('Initial Load Behavior', () => {
    it('should refresh Play Token balance on initial load for Polygon Amoy', () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        chainId: 80002,
      });
      
      render(<Header />);
      
      expect(mockPlayTokenRefreshBalance).toHaveBeenCalled();
      expect(mockPlayTokenRefreshClaimStatus).toHaveBeenCalled();
    });

    it('should NOT refresh balance on initial load for other networks', () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        chainId: 11155111, // Sepolia
      });
      
      render(<Header />);
      
      expect(mockPlayTokenRefreshBalance).not.toHaveBeenCalled();
      expect(mockPlayTokenRefreshClaimStatus).not.toHaveBeenCalled();
    });
  });

  describe('Admin Dashboard Access', () => {
    it('should show admin dashboard link for whitelisted address', () => {
      const whitelistedAddress = '0x2c5329fFa2A1f02A241Ec1932b4358bf71e158ae';
      
      mockUseAccount.mockReturnValue({
        address: whitelistedAddress,
        isConnected: true,
        chainId: 80002,
      });
      
      render(<Header />);
      
      // Click user menu to open dropdown
      const userMenuButton = screen.getByRole('button', { name: /chevrondown/i });
      fireEvent.click(userMenuButton);
      
      expect(screen.getByText('管理ダッシュボード')).toBeInTheDocument();
    });

    it('should NOT show admin dashboard link for non-whitelisted address', () => {
      mockUseAccount.mockReturnValue({
        address: '0x9999999999999999999999999999999999999999',
        isConnected: true,
        chainId: 80002,
      });
      
      render(<Header />);
      
      // Click user menu to open dropdown
      const userMenuButton = screen.getByRole('button', { name: /chevrondown/i });
      fireEvent.click(userMenuButton);
      
      expect(screen.queryByText('管理ダッシュボード')).not.toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should hide portfolio on smaller screens', () => {
      mockUseAccount.mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
        chainId: 80002,
      });
      
      mockUsePlayToken.mockReturnValue({
        balance: '1000',
        hasClaimed: true,
        isLoading: false,
        claimTokens: mockClaimTokens,
        addTokenToMetaMask: mockAddTokenToMetaMask,
        refreshBalance: mockPlayTokenRefreshBalance,
        refreshClaimStatus: mockPlayTokenRefreshClaimStatus,
      });

      const { container } = render(<Header />);
      
      // Portfolio section has 'hidden xl:flex' classes
      const portfolioSection = container.querySelector('.hidden.xl\\:flex');
      expect(portfolioSection).toBeInTheDocument();
      expect(portfolioSection).toHaveClass('hidden', 'xl:flex');
    });
  });
});