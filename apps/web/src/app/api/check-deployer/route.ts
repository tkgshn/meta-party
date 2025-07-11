import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { NETWORKS } from '@/config/networks';

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/Jmm9344uth8TJQi0gNCbs'; // サーバーサイド用環境変数
const PLAY_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_SEPOLIA_PLAY_TOKEN_ADDRESS || '0x45d1Fb8fD268E3156D00119C6f195f9ad784C6CE';
const DEPLOYER_PRIVATE_KEY = process.env.SEPOLIA_DEPLOYER_PRIVATE_KEY;

const PLAY_TOKEN_ABI = [
  'function hasRole(bytes32 role, address account) external view returns (bool)',
  'function DISTRIBUTOR_ROLE() external view returns (bytes32)'
];

export async function GET() {
  try {
    if (!DEPLOYER_PRIVATE_KEY) {
      return NextResponse.json({
        error: 'SEPOLIA_DEPLOYER_PRIVATE_KEY not configured'
      }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const deployerWallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
    const playTokenContract = new ethers.Contract(PLAY_TOKEN_ADDRESS, PLAY_TOKEN_ABI, provider);

    // Check deployer wallet balance
    const balance = await provider.getBalance(deployerWallet.address);
    const balanceInEth = ethers.formatEther(balance);

    // Check if deployer has DISTRIBUTOR_ROLE
    const distributorRole = await playTokenContract.DISTRIBUTOR_ROLE();
    const hasRole = await playTokenContract.hasRole(distributorRole, deployerWallet.address);

    return NextResponse.json({
      deployerAddress: deployerWallet.address,
      balanceInEth: balanceInEth,
      hasDistributorRole: hasRole,
      distributorRole: distributorRole,
      contractAddress: PLAY_TOKEN_ADDRESS,
      canSponsor: parseFloat(balanceInEth) > 0.01 && hasRole
    });

  } catch (error) {
    console.error('Deployer check error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}