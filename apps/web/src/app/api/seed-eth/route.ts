import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { NETWORKS } from '@/config/networks';

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/Jmm9344uth8TJQi0gNCbs'; // サーバーサイド用環境変数
const ADMIN_PRIVATE_KEY = process.env.SEPOLIA_DEPLOYER_PRIVATE_KEY; // 管理用アカウント
const STARTER_ETH_AMOUNT = '0.002'; // 必要最低限のETH（Claim1回分 + 余裕）

// Rate limiting store (本番環境では Redis などを使用)
const ethSentHistory = new Map<string, number>();
const RATE_LIMIT_HOURS = 24;

interface SeedEthRequest {
  userAddress: string;
  twitterId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SeedEthRequest = await request.json();
    const { userAddress, twitterId } = body;

    // 入力検証
    if (!userAddress || !ethers.isAddress(userAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user address' },
        { status: 400 }
      );
    }

    // 管理用秘密鍵チェック
    if (!ADMIN_PRIVATE_KEY) {
      return NextResponse.json(
        { success: false, error: 'Admin private key not configured' },
        { status: 500 }
      );
    }

    // Rate limiting チェック (アドレスベース)
    const lastSent = ethSentHistory.get(userAddress.toLowerCase());
    const now = Date.now();
    if (lastSent && (now - lastSent) < RATE_LIMIT_HOURS * 60 * 60 * 1000) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Starter ETH already sent within 24 hours.' },
        { status: 429 }
      );
    }

    // プロバイダーとウォレット設定
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);

    // 管理ウォレットの残高チェック
    const adminBalance = await provider.getBalance(adminWallet.address);
    const starterAmount = ethers.parseEther(STARTER_ETH_AMOUNT);
    const minAdminBalance = ethers.parseEther('0.01'); // 最低維持残高

    if (adminBalance < starterAmount + minAdminBalance) {
      console.error('Admin wallet has insufficient balance:', ethers.formatEther(adminBalance));
      return NextResponse.json(
        { success: false, error: 'Admin wallet has insufficient balance' },
        { status: 500 }
      );
    }

    // ユーザーの現在の残高チェック
    const userBalance = await provider.getBalance(userAddress);
    const userBalanceInEth = parseFloat(ethers.formatEther(userBalance));
    
    // 既に十分なETHを持っている場合はスキップ
    if (userBalanceInEth >= 0.001) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User already has sufficient ETH',
          currentBalance: userBalanceInEth
        },
        { status: 400 }
      );
    }

    // ETH送金実行
    console.log(`Sending ${STARTER_ETH_AMOUNT} ETH to ${userAddress}${twitterId ? ` (Twitter: ${twitterId})` : ''}`);
    
    const tx = await adminWallet.sendTransaction({
      to: userAddress,
      value: starterAmount,
      gasLimit: 21000, // 通常のETH転送
    });

    console.log('Starter ETH transaction submitted:', tx.hash);

    // トランザクション完了まで待機
    const receipt = await tx.wait();
    
    if (receipt?.status === 1) {
      // 成功時にrate limiting記録
      ethSentHistory.set(userAddress.toLowerCase(), now);
      
      // ログ記録（セキュリティ監査用）
      console.log(`✅ Starter ETH sent successfully:`, {
        to: userAddress,
        amount: STARTER_ETH_AMOUNT,
        txHash: tx.hash,
        twitterId: twitterId || 'unknown',
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: true,
        txHash: tx.hash,
        message: `${STARTER_ETH_AMOUNT} Sepolia ETH sent successfully`,
        blockNumber: receipt.blockNumber,
        userBalance: ethers.formatEther(await provider.getBalance(userAddress))
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Transaction failed' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Seed ETH error:', error);
    
    let errorMessage = 'Failed to send starter ETH';
    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        errorMessage = 'Admin wallet has insufficient funds';
      } else if (error.message.includes('gas')) {
        errorMessage = 'Gas estimation failed';
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
    if (!ADMIN_PRIVATE_KEY) {
      return NextResponse.json({
        status: 'unhealthy',
        error: 'Admin private key not configured'
      }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
    const balance = await provider.getBalance(adminWallet.address);
    const blockNumber = await provider.getBlockNumber();
    
    return NextResponse.json({
      status: 'healthy',
      network: 'sepolia',
      blockNumber,
      adminAddress: adminWallet.address,
      adminBalance: ethers.formatEther(balance),
      starterAmount: STARTER_ETH_AMOUNT
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}