import { NextRequest, NextResponse } from 'next/server';
import { checkVolunteerStatus } from '@/utils/volunteers';
import { ethers } from 'ethers';
import { NETWORKS } from '@/config/networks';

interface SocialAuthRequest {
  platform: 'twitter' | 'x' | 'google' | 'discord';
  userId: string;
  username?: string;
  email?: string;
  walletAddress: string;
  networkKey?: string; // 追加：ネットワーク指定
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
  bonusAutoGranted?: boolean; // 追加：ボーナス自動付与フラグ
  txHash?: string; // 追加：トランザクションハッシュ
}

const PLAY_TOKEN_ABI = [
  'function distributeVolunteerBonus(address to) external',
  'function hasClaimedVolunteerBonus(address user) external view returns (bool)',
  'function balanceOf(address) external view returns (uint256)',
  'function getVolunteerBonusAmount() external pure returns (uint256)'
];

/**
 * ボランティアボーナス自動付与
 */
async function autoGrantVolunteerBonus(walletAddress: string, networkKey: string = 'sepolia'): Promise<{success: boolean; txHash?: string; error?: string}> {
  try {
    // ネットワーク設定取得
    const networkConfig = NETWORKS[networkKey];
    if (!networkConfig?.contracts.playToken) {
      return { success: false, error: 'Network not supported' };
    }

    // 秘密鍵取得
    const privateKey = process.env.SEPOLIA_DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
      return { success: false, error: 'Private key not configured' };
    }

    // プロバイダー接続
    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/Jmm9344uth8TJQi0gNCbs';
    console.log(`🔗 Using RPC URL: ${rpcUrl}`);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(networkConfig.contracts.playToken, PLAY_TOKEN_ABI, wallet);

    // 既に受け取っているかチェック
    const hasClaimed = await contract.hasClaimedVolunteerBonus(walletAddress);
    if (hasClaimed) {
      return { success: false, error: 'Already claimed' };
    }

    // ボーナス付与実行
    const tx = await contract.distributeVolunteerBonus(walletAddress);
    const receipt = await tx.wait();
    
    return { success: true, txHash: receipt.transactionHash };
  } catch (error: any) {
    console.error('❌ Auto volunteer bonus error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Social Login後の認証処理とボランティア判定（自動ボーナス付与付き）
 */
export async function POST(request: NextRequest): Promise<NextResponse<SocialAuthResponse>> {
  try {
    const body: SocialAuthRequest = await request.json();
    const { platform, userId, username, walletAddress, networkKey = 'sepolia' } = body;

    console.log(`🔐 Social auth request:`, { platform, userId, username, walletAddress, networkKey });

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

    let bonusAutoGranted = false;
    let txHash: string | undefined;

    // ボランティアの場合、自動的にボーナス付与を試行
    if (isVolunteer) {
      console.log(`🎁 Attempting auto-grant volunteer bonus for ${volunteerInfo.name} (${twitterId})`);
      const bonusResult = await autoGrantVolunteerBonus(walletAddress, networkKey);
      
      if (bonusResult.success) {
        bonusAutoGranted = true;
        txHash = bonusResult.txHash;
        console.log(`✅ Volunteer bonus auto-granted: ${txHash}`);
      } else {
        console.log(`⚠️ Auto-grant failed: ${bonusResult.error}`);
      }
    }

    const response: SocialAuthResponse = {
      success: true,
      isVolunteer,
      tokens: {
        base: 1000,
        bonus: isVolunteer ? 2000 : 0,
        total: isVolunteer ? 3000 : 1000
      },
      message: isVolunteer 
        ? bonusAutoGranted 
          ? `🎉 ボランティア認証成功！${volunteerInfo.name}さん、ボーナス2,000PT自動付与完了！`
          : `🎉 ボランティア認証成功！${volunteerInfo.name}さん、お疲れ様です！`
        : '✅ 認証完了。基本トークンを受け取れます。',
      bonusAutoGranted,
      txHash
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