import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface TwitterLinkStatus {
  isLinked: boolean;
  twitterId: string | null;
  linkedAt: string | null;
  loading: boolean;
  error: string | null;
}

interface TwitterLinkActions {
  linkTwitter: (twitterId: string) => Promise<boolean>;
  unlinkTwitter: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
}

export function useTwitterLink(): TwitterLinkStatus & TwitterLinkActions {
  const { address } = useAccount();
  
  const [status, setStatus] = useState<TwitterLinkStatus>({
    isLinked: false,
    twitterId: null,
    linkedAt: null,
    loading: false,
    error: null
  });

  /**
   * Twitter連携状態の確認
   */
  const refreshStatus = async () => {
    if (!address) {
      setStatus(prev => ({ 
        ...prev, 
        isLinked: false, 
        twitterId: null, 
        linkedAt: null,
        loading: false 
      }));
      return;
    }

    setStatus(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/user/link-twitter?address=${address}`);
      const data = await response.json();

      if (response.ok) {
        setStatus(prev => ({
          ...prev,
          isLinked: data.isLinked,
          twitterId: data.twitterId,
          linkedAt: data.linkedAt,
          loading: false,
          error: null
        }));
      } else {
        throw new Error(data.error || 'Failed to check link status');
      }
    } catch (error: any) {
      console.error('Failed to refresh Twitter link status:', error);
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to check Twitter link status'
      }));
    }
  };

  /**
   * Twitter IDとウォレットの連携
   */
  const linkTwitter = async (twitterId: string): Promise<boolean> => {
    if (!address) {
      setStatus(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    setStatus(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/user/link-twitter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          twitterId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus(prev => ({
          ...prev,
          isLinked: true,
          twitterId: data.linkedTwitterId,
          linkedAt: new Date().toISOString(),
          loading: false,
          error: null
        }));
        return true;
      } else {
        setStatus(prev => ({
          ...prev,
          loading: false,
          error: data.message || 'Failed to link Twitter'
        }));
        return false;
      }
    } catch (error: any) {
      console.error('Failed to link Twitter:', error);
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to link Twitter'
      }));
      return false;
    }
  };

  /**
   * Twitter連携の解除
   */
  const unlinkTwitter = async (): Promise<boolean> => {
    if (!address) {
      setStatus(prev => ({ ...prev, error: 'Wallet not connected' }));
      return false;
    }

    setStatus(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/user/link-twitter?address=${address}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus(prev => ({
          ...prev,
          isLinked: false,
          twitterId: null,
          linkedAt: null,
          loading: false,
          error: null
        }));
        return true;
      } else {
        setStatus(prev => ({
          ...prev,
          loading: false,
          error: data.message || 'Failed to unlink Twitter'
        }));
        return false;
      }
    } catch (error: any) {
      console.error('Failed to unlink Twitter:', error);
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to unlink Twitter'
      }));
      return false;
    }
  };

  // アドレス変更時に状態をリフレッシュ
  useEffect(() => {
    refreshStatus();
  }, [address]);

  return {
    ...status,
    linkTwitter,
    unlinkTwitter,
    refreshStatus
  };
}