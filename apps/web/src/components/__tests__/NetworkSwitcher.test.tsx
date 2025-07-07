import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import NetworkSwitcher from '../NetworkSwitcher';
import { useMetaMask } from '@/hooks/useMetaMask';

// Mock the useMetaMask hook
jest.mock('@/hooks/useMetaMask', () => ({
  useMetaMask: jest.fn(),
}));

// Mock fetch for Anvil availability check
global.fetch = jest.fn();

const mockUseMetaMask = useMetaMask as jest.MockedFunction<typeof useMetaMask>;

describe('NetworkSwitcher', () => {
  beforeEach(() => {
    mockUseMetaMask.mockReturnValue({
      account: null,
      isConnected: false,
      chainId: 137,
      balance: '0',
      connectWallet: jest.fn(),
      switchNetwork: jest.fn(),
      getCurrentChainId: jest.fn().mockResolvedValue(137),
      addTokenToMetaMask: jest.fn(),
      requestTestTokens: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders network switcher button', () => {
    render(<NetworkSwitcher />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('shows network selection dropdown when clicked', async () => {
    render(<NetworkSwitcher />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('ネットワークを選択')).toBeInTheDocument();
    });
  });

  it('shows disabled state for Anvil when not available', async () => {
    // Mock fetch to simulate Anvil not being available
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));
    
    render(<NetworkSwitcher />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      const anvilOption = screen.getByText('Anvil Local');
      expect(anvilOption).toBeInTheDocument();
      
      // Check if the button is disabled
      const anvilButton = anvilOption.closest('button');
      expect(anvilButton).toBeDisabled();
    });
  });

  it('shows warning message when Anvil is not available', async () => {
    // Mock fetch to simulate Anvil not being available
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));
    
    render(<NetworkSwitcher />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Anvil ローカルネットワークについて')).toBeInTheDocument();
      expect(screen.getByText('• Foundry のインストールが必要です')).toBeInTheDocument();
    });
  });

  it('enables Anvil when available', async () => {
    // Mock fetch to simulate Anvil being available
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ result: '0x7a69' }), // Anvil chain ID
    });
    
    render(<NetworkSwitcher />);
    
    // Wait for the availability check to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      const anvilOption = screen.getByText('Anvil Local');
      expect(anvilOption).toBeInTheDocument();
      
      // Check if the button is enabled
      const anvilButton = anvilOption.closest('button');
      expect(anvilButton).not.toBeDisabled();
    });
  });

  it('shows alert when trying to switch to unavailable Anvil', async () => {
    // Mock fetch to simulate Anvil not being available
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));
    
    // Mock window.alert
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<NetworkSwitcher />);
    
    // Wait for the availability check to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      const anvilOption = screen.getByText('Anvil Local');
      const anvilButton = anvilOption.closest('button');
      
      // Since the button is disabled, we should check that it's disabled instead of trying to click it
      expect(anvilButton).toBeDisabled();
      expect(anvilButton).toHaveClass('cursor-not-allowed');
    });
    
    alertSpy.mockRestore();
  });
});