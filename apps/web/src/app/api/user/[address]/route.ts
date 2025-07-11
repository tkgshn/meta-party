import { NextRequest, NextResponse } from 'next/server';
import FirestoreService from '@/lib/firestore';

interface UserProfile {
  walletAddress: string;
  twitterId?: string;
  twitterUsername?: string;
  displayName?: string;
  profileImage?: string;
  isPublic?: boolean; // プライバシー設定
  lastUpdated: string;
}

async function findUserByAddress(address: string): Promise<UserProfile | null> {
  try {
    // FirestoreServiceを使用してウォレットアドレスでユーザーを検索
    const user = await FirestoreService.getUserByWalletAddress(address.toLowerCase());
    
    if (!user) {
      return null;
    }

    return {
      walletAddress: user.walletAddress,
      twitterId: user.twitter?.id,
      twitterUsername: user.twitter?.username,
      displayName: user.twitter?.displayName,
      profileImage: user.twitter?.profileImageUrl,
      isPublic: user.privacy?.isPublic !== false, // デフォルトは公開
      lastUpdated: user.lastLoginAt?.toDate().toISOString() || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error finding user by address:', error);
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    
    // アドレスの基本的なバリデーション
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid address format' }, { status: 400 });
    }

    const userProfile = await findUserByAddress(address);
    
    if (!userProfile) {
      return NextResponse.json({ 
        walletAddress: address,
        hasProfile: false 
      });
    }

    // プライバシー設定を考慮した情報返却
    const publicProfile = {
      walletAddress: userProfile.walletAddress,
      hasProfile: true,
      twitterUsername: userProfile.isPublic ? userProfile.twitterUsername : undefined,
      displayName: userProfile.isPublic ? userProfile.displayName : undefined,
      profileImage: userProfile.isPublic ? userProfile.profileImage : undefined,
      lastUpdated: userProfile.lastUpdated
    };

    return NextResponse.json(publicProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POSTメソッドは認証が必要なため、この簡易APIでは提供しません
// プライバシー設定などは認証済みユーザー向けの別のAPIで管理します