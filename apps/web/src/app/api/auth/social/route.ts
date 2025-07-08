import { NextRequest, NextResponse } from 'next/server';
import { checkVolunteerStatus } from '@/utils/volunteers';

interface SocialAuthRequest {
  platform: 'twitter' | 'x' | 'google' | 'discord';
  userId: string;
  username?: string;
  email?: string;
  walletAddress: string;
}

interface SocialAuthResponse {
  success: boolean;
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

/**
 * Social Login後の認証処理とボランティア判定
 */
export async function POST(request: NextRequest): Promise<NextResponse<SocialAuthResponse>> {
  try {
    const body: SocialAuthRequest = await request.json();
    const { platform, userId, username, walletAddress } = body;

    console.log(`🔐 Social auth request:`, { platform, userId, username, walletAddress });

    // Twitter/X以外は現在非対応
    if (platform !== 'twitter' && platform !== 'x') {
      return NextResponse.json({
        success: false,
        isVolunteer: false,
        tokens: { base: 1000, bonus: 0, total: 1000 },
        message: `${platform} authentication is not yet supported for volunteer bonus`
      });
    }

    // ボランティア判定
    const twitterId = username || userId;
    const volunteerInfo = checkVolunteerStatus(twitterId);
    const isVolunteer = volunteerInfo !== null;

    const response: SocialAuthResponse = {
      success: true,
      isVolunteer,
      tokens: {
        base: 1000,
        bonus: isVolunteer ? 2000 : 0,
        total: isVolunteer ? 3000 : 1000
      },
      message: isVolunteer 
        ? `🎉 ボランティア認証成功！${volunteerInfo.name}さん、お疲れ様です！`
        : '✅ 認証完了。基本トークンを受け取れます。'
    };

    if (isVolunteer) {
      response.volunteerInfo = volunteerInfo;
    }

    console.log(`✅ Social auth result:`, response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Social auth error:', error);
    return NextResponse.json({
      success: false,
      isVolunteer: false,
      tokens: { base: 0, bonus: 0, total: 0 },
      message: 'Authentication failed'
    }, { status: 500 });
  }
}

/**
 * ボランティアリスト情報の取得（デバッグ用）
 */
export async function GET(): Promise<NextResponse> {
  try {
    const { loadVolunteers } = await import('@/utils/volunteers');
    const volunteers = loadVolunteers();
    
    return NextResponse.json({
      success: true,
      count: volunteers.length,
      volunteers: volunteers.map(v => ({
        twitter_id: v.twitter_id,
        name: v.name,
        role: v.role
      }))
    });
  } catch (error) {
    console.error('❌ Failed to load volunteers:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to load volunteer data' 
    }, { status: 500 });
  }
}