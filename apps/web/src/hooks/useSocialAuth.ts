import { useState, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

interface SocialAuthState {
  isConnected: boolean;
  isLoading: boolean;
  socialProfile: SocialProfile | null;
  error: string | null;
}

interface SocialProfile {
  platform: string;
  userId: string;
  username?: string;
  email?: string;
  profileImage?: string;
}

interface VolunteerStatus {
  isVolunteer: boolean;
  volunteerInfo?: {
    twitter_id: string;
    name: string;
    role: string;
    joined_date: string;
  };
  tokens: {
    base: number;
    bonus: number;
    total: number;
  };
  message: string;
}

export function useSocialAuth() {
  const [state, setState] = useState<SocialAuthState>({
    isConnected: false,
    isLoading: false,
    socialProfile: null,
    error: null
  });

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  /**
   * Social Login開始
   */
  const connectSocial = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await open();
    } catch (error) {
      console.error('Social connection failed:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Social login failed' 
      }));
    }
  };

  /**
   * Twitter IDからボランティア状態をチェック
   */
  const checkVolunteerStatus = async (
    twitterId: string,
    walletAddress: string
  ): Promise<VolunteerStatus> => {
    try {
      const response = await fetch('/api/auth/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'twitter',
          userId: twitterId,
          username: twitterId,
          walletAddress
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Volunteer status check failed:', error);
      throw new Error('Failed to check volunteer status');
    }
  };

  /**
   * ボランティアボーナス請求
   */
  const claimVolunteerBonus = async (
    twitterId: string,
    networkKey: string = 'sepolia'
  ): Promise<{ success: boolean; txHash?: string; message: string }> => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await fetch('/api/claim/volunteer-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          twitterId,
          networkKey
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Volunteer bonus claim failed:', error);
      throw new Error('Failed to claim volunteer bonus');
    }
  };

  /**
   * Social接続状態の監視
   */
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isConnected,
      isLoading: false
    }));

    // TODO: ReownからSocialプロファイル情報を取得
    // 現在のAppKitではSocial情報へのアクセスが限定的
    // 将来的にAPIが拡張された場合に実装
    
  }, [isConnected, address]);

  /**
   * 切断
   */
  const disconnectSocial = async () => {
    await disconnect();
    setState({
      isConnected: false,
      isLoading: false,
      socialProfile: null,
      error: null
    });
  };

  return {
    ...state,
    address,
    connectSocial,
    disconnectSocial,
    checkVolunteerStatus,
    claimVolunteerBonus
  };
}