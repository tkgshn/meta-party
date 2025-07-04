/**
 * Wallet Session Management Utility
 * 
 * Based on patterns used by OpenSea, Lens Protocol, and Mirror
 * Implements session-based authentication with proper persistence
 */

export interface WalletSession {
  address: string;
  chainId: number;
  timestamp: number;
  expiresAt: number;
  isValid: boolean;
}

export interface SessionConfig {
  duration: number; // Session duration in milliseconds
  autoRefresh: boolean; // Auto-refresh session before expiry
  key: string; // Storage key prefix
}

const DEFAULT_CONFIG: SessionConfig = {
  duration: 24 * 60 * 60 * 1000, // 24 hours
  autoRefresh: true,
  key: 'wallet-session',
};

class WalletSessionManager {
  private config: SessionConfig;
  private listeners: Set<(session: WalletSession | null) => void> = new Set();

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Create a new wallet session
   */
  createSession(address: string, chainId: number): WalletSession {
    const now = Date.now();
    const session: WalletSession = {
      address: address.toLowerCase(),
      chainId,
      timestamp: now,
      expiresAt: now + this.config.duration,
      isValid: true,
    };

    this.storeSession(session);
    this.notifyListeners(session);
    
    console.log('Wallet session created:', {
      address: session.address,
      chainId: session.chainId,
      expiresIn: this.formatDuration(session.expiresAt - now),
    });

    return session;
  }

  /**
   * Get current session
   */
  getSession(): WalletSession | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(this.config.key);
      if (!stored) return null;

      const session: WalletSession = JSON.parse(stored);
      
      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        this.clearSession();
        return null;
      }

      // Auto-refresh if enabled and close to expiry
      if (this.config.autoRefresh && this.shouldRefreshSession(session)) {
        return this.refreshSession(session);
      }

      return session;
    } catch (error) {
      console.error('Failed to get wallet session:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Refresh session (extend expiry)
   */
  refreshSession(currentSession: WalletSession): WalletSession {
    const refreshedSession: WalletSession = {
      ...currentSession,
      expiresAt: Date.now() + this.config.duration,
    };

    this.storeSession(refreshedSession);
    this.notifyListeners(refreshedSession);
    
    console.log('Wallet session refreshed');
    return refreshedSession;
  }

  /**
   * Clear session
   */
  clearSession(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.config.key);
      sessionStorage.removeItem(this.config.key);
      
      // Clear related wallet storage
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('lastConnectedAccount');
      
      this.notifyListeners(null);
      console.log('Wallet session cleared');
    } catch (error) {
      console.error('Failed to clear wallet session:', error);
    }
  }

  /**
   * Validate session against current wallet state
   */
  validateSession(currentAddress: string | null, currentChainId: number | null): boolean {
    const session = this.getSession();
    
    if (!session || !currentAddress) {
      return false;
    }

    const isValid = 
      session.address === currentAddress.toLowerCase() &&
      session.chainId === currentChainId &&
      Date.now() < session.expiresAt;

    if (!isValid) {
      this.clearSession();
    }

    return isValid;
  }

  /**
   * Subscribe to session changes
   */
  subscribe(listener: (session: WalletSession | null) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get session status info
   */
  getSessionInfo(): {
    hasSession: boolean;
    isExpired: boolean;
    timeRemaining: number;
    address?: string;
    chainId?: number;
  } {
    const session = this.getSession();
    
    if (!session) {
      return {
        hasSession: false,
        isExpired: false,
        timeRemaining: 0,
      };
    }

    const now = Date.now();
    const isExpired = now > session.expiresAt;
    const timeRemaining = Math.max(0, session.expiresAt - now);

    return {
      hasSession: true,
      isExpired,
      timeRemaining,
      address: session.address,
      chainId: session.chainId,
    };
  }

  // Private methods

  private storeSession(session: WalletSession): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.config.key, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to store wallet session:', error);
    }
  }

  private shouldRefreshSession(session: WalletSession): boolean {
    const timeRemaining = session.expiresAt - Date.now();
    const refreshThreshold = this.config.duration * 0.1; // Refresh when 10% time remaining
    return timeRemaining < refreshThreshold;
  }

  private notifyListeners(session: WalletSession | null): void {
    this.listeners.forEach(listener => {
      try {
        listener(session);
      } catch (error) {
        console.error('Session listener error:', error);
      }
    });
  }

  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }
}

// Create global session manager instance
export const walletSessionManager = new WalletSessionManager();

// Utility functions for easy use
export const createWalletSession = (address: string, chainId: number) => 
  walletSessionManager.createSession(address, chainId);

export const getWalletSession = () => 
  walletSessionManager.getSession();

export const clearWalletSession = () => 
  walletSessionManager.clearSession();

export const validateWalletSession = (address: string | null, chainId: number | null) => 
  walletSessionManager.validateSession(address, chainId);

export const subscribeToSession = (listener: (session: WalletSession | null) => void) => 
  walletSessionManager.subscribe(listener);