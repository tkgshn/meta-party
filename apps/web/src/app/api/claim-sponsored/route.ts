import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
const PLAY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_SEPOLIA_PLAY_TOKEN_ADDRESS || '0xBe5cC5b0B4D00f637d58008f3577D4Ef30D65a1D';
const DEPLOYER_PRIVATE_KEY = process.env.SEPOLIA_DEPLOYER_PRIVATE_KEY; // デプロイヤーの秘密鍵

const PLAY_TOKEN_ABI = [
  'function distributeBaseAirdrop(address to) external',
  'function hasClaimedBaseAirdrop(address user) external view returns (bool)',
  'function getBaseAirdropAmount() external pure returns (uint256)'
];

interface ClaimRequest {
  userAddress: string;
  signature?: string; // オプション：署名による認証
}

// Rate limiting store (本番環境では Redis などを使用)
const claimHistory = new Map<string, number>();
const RATE_LIMIT_HOURS = 24;

export async function POST(request: NextRequest) {
  try {
    const body: ClaimRequest = await request.json();
    const { userAddress } = body;

    // 入力検証
    if (!userAddress || !ethers.isAddress(userAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user address' },
        { status: 400 }
      );
    }

    // デプロイヤーの秘密鍵チェック
    if (!DEPLOYER_PRIVATE_KEY) {
      return NextResponse.json(
        { success: false, error: 'Deployer private key not configured' },
        { status: 500 }
      );
    }

    // Rate limiting チェック
    const lastClaim = claimHistory.get(userAddress.toLowerCase());
    const now = Date.now();
    if (lastClaim && (now - lastClaim) < RATE_LIMIT_HOURS * 60 * 60 * 1000) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please wait 24 hours.' },
        { status: 429 }
      );
    }

    // Sepoliaプロバイダーとウォレット設定
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const deployerWallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
    const playTokenContract = new ethers.Contract(PLAY_TOKEN_ADDRESS, PLAY_TOKEN_ABI, deployerWallet);

    // 既にクレーム済みかチェック
    const hasClaimed = await playTokenContract.hasClaimedBaseAirdrop(userAddress);
    if (hasClaimed) {
      return NextResponse.json(
        { success: false, error: 'User has already claimed tokens' },
        { status: 400 }
      );
    }

    // ガス代見積もり
    const gasEstimate = await playTokenContract.distributeBaseAirdrop.estimateGas(userAddress);
    const gasPrice = await provider.getFeeData();
    
    console.log('Gas estimate:', gasEstimate.toString());
    console.log('Gas price:', gasPrice.gasPrice?.toString());

    // トランザクション実行
    const tx = await playTokenContract.distributeBaseAirdrop(userAddress, {
      gasLimit: gasEstimate + 10000n, // 余裕を持たせる
      gasPrice: gasPrice.gasPrice,
    });

    console.log('Sponsored claim transaction submitted:', tx.hash);

    // トランザクション完了まで待機
    const receipt = await tx.wait();
    
    if (receipt?.status === 1) {
      // 成功時にrate limiting記録
      claimHistory.set(userAddress.toLowerCase(), now);
      
      return NextResponse.json({
        success: true,
        txHash: tx.hash,
        message: '1,000 PT successfully distributed (sponsored)',
        blockNumber: receipt.blockNumber
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Transaction failed' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Sponsored claim error:', error);
    
    let errorMessage = 'Failed to process sponsored claim';
    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        errorMessage = 'Sponsor wallet has insufficient funds';
      } else if (error.message.includes('already claimed')) {
        errorMessage = 'User has already claimed tokens';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// ヘルスチェック用
export async function GET() {
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const blockNumber = await provider.getBlockNumber();
    
    return NextResponse.json({
      status: 'healthy',
      network: 'sepolia',
      blockNumber,
      contractAddress: PLAY_TOKEN_ADDRESS
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}