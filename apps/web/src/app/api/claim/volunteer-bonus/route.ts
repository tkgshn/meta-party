import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { checkVolunteerStatus } from '@/utils/volunteers';
import { NETWORKS, getNetworkByChainId } from '@/config/networks';

interface VolunteerBonusRequest {
  walletAddress: string;
  twitterId: string;
  networkKey: string; // 'polygonAmoy' | 'sepolia' など
}

interface VolunteerBonusResponse {
  success: boolean;
  message: string;
  txHash?: string;
  volunteerInfo?: {
    name: string;
    role: string;
    twitter_id: string;
  };
  tokens?: {
    amount: number;
    symbol: string;
  };
}

const PLAY_TOKEN_ABI = [
  'function distributeVolunteerBonus(address to) external',
  'function hasClaimedVolunteerBonus(address user) external view returns (bool)',
  'function balanceOf(address) external view returns (uint256)',
  'function getVolunteerBonusAmount() external pure returns (uint256)'
];

/**
 * ボランティアボーナス付与API
 * ボランティア確認 → コントラクトでボーナス付与
 */
export async function POST(request: NextRequest): Promise<NextResponse<VolunteerBonusResponse>> {
  try {
    const body: VolunteerBonusRequest = await request.json();
    const { walletAddress, twitterId, networkKey } = body;

    console.log(`🎁 Volunteer bonus request:`, { walletAddress, twitterId, networkKey });

    // 入力検証
    if (!walletAddress || !twitterId || !networkKey) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    // ネットワーク設定取得
    const networkConfig = NETWORKS[networkKey];
    if (!networkConfig || !networkConfig.contracts.playToken) {
      return NextResponse.json({
        success: false,
        message: `Network ${networkKey} is not supported or contracts not deployed`
      }, { status: 400 });
    }

    // ボランティア確認
    const volunteerInfo = checkVolunteerStatus(twitterId);
    if (!volunteerInfo) {
      return NextResponse.json({
        success: false,
        message: `Twitter ID ${twitterId} is not in the volunteer list`
      }, { status: 403 });
    }

    // 秘密鍵取得（環境変数から）
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.error('❌ PRIVATE_KEY not found in environment variables');
      return NextResponse.json({
        success: false,
        message: 'Server configuration error'
      }, { status: 500 });
    }

    // プロバイダー接続
    const rpcUrl = networkConfig.rpcUrls[0];
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // PlayTokenコントラクト接続
    const playTokenContract = new ethers.Contract(
      networkConfig.contracts.playToken,
      PLAY_TOKEN_ABI,
      wallet
    );

    // 既にボーナスを受け取っているかチェック
    const hasClaimedBonus = await playTokenContract.hasClaimedVolunteerBonus(walletAddress);
    if (hasClaimedBonus) {
      return NextResponse.json({
        success: false,
        message: 'Volunteer bonus already claimed for this address'
      }, { status: 409 });
    }

    // ボーナス付与実行
    console.log(`🚀 Distributing volunteer bonus to ${walletAddress}...`);
    const tx = await playTokenContract.distributeVolunteerBonus(walletAddress);
    
    console.log(`⏳ Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed: ${receipt.transactionHash}`);

    // ボーナス額取得
    const bonusAmount = await playTokenContract.getVolunteerBonusAmount();
    const bonusAmountFormatted = Math.floor(Number(ethers.formatEther(bonusAmount)));

    return NextResponse.json({
      success: true,
      message: `🎉 ボランティアボーナス付与完了！${volunteerInfo.name}さん、ありがとうございます！`,
      txHash: receipt.transactionHash,
      volunteerInfo: {
        name: volunteerInfo.name,
        role: volunteerInfo.role,
        twitter_id: volunteerInfo.twitter_id
      },
      tokens: {
        amount: bonusAmountFormatted,
        symbol: 'PT'
      }
    });

  } catch (error: any) {
    console.error('❌ Volunteer bonus error:', error);
    
    let errorMessage = 'Failed to distribute volunteer bonus';
    if (error.code === 'INSUFFICIENT_FUNDS') {
      errorMessage = 'Insufficient gas funds for transaction';
    } else if (error.message?.includes('already claimed')) {
      errorMessage = 'Volunteer bonus already claimed';
    } else if (error.message?.includes('revert')) {
      errorMessage = 'Smart contract error: ' + error.reason || error.message;
    }

    return NextResponse.json({
      success: false,
      message: errorMessage
    }, { status: 500 });
  }
}

/**
 * ボランティアボーナス状態確認API
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('address');
    const networkKey = url.searchParams.get('network') || 'polygonAmoy';

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const networkConfig = NETWORKS[networkKey];
    if (!networkConfig?.contracts.playToken) {
      return NextResponse.json({ error: 'Network not supported' }, { status: 400 });
    }

    // Read-only provider
    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrls[0]);
    const contract = new ethers.Contract(
      networkConfig.contracts.playToken,
      PLAY_TOKEN_ABI,
      provider
    );

    const hasClaimedBonus = await contract.hasClaimedVolunteerBonus(walletAddress);
    const bonusAmount = await contract.getVolunteerBonusAmount();

    return NextResponse.json({
      address: walletAddress,
      network: networkKey,
      hasClaimedVolunteerBonus: hasClaimedBonus,
      bonusAmount: ethers.formatEther(bonusAmount),
      bonusAmountFormatted: Math.floor(Number(ethers.formatEther(bonusAmount)))
    });

  } catch (error) {
    console.error('❌ Volunteer bonus status check error:', error);
    return NextResponse.json({ error: 'Failed to check bonus status' }, { status: 500 });
  }
}