import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import FirestoreService from '@/lib/firestore'

// Enhanced PlayToken ABI with new distribution functions
const PLAY_TOKEN_ABI = [
  'function distributeBaseAirdrop(address to) external',
  'function distributeVolunteerBonus(address to) external',
  'function hasClaimedBaseAirdrop(address user) external view returns (bool)',
  'function hasClaimedVolunteerBonus(address user) external view returns (bool)',
  'function getBaseAirdropAmount() external pure returns (uint256)',
  'function getVolunteerBonusAmount() external pure returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function addDistributor(address distributor) external',
  'function hasRole(bytes32 role, address account) external view returns (bool)',
  'function DISTRIBUTOR_ROLE() external view returns (bytes32)'
]

// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
  sepolia: {
    playToken: process.env.NEXT_PUBLIC_PLAY_TOKEN_ADDRESS_SEPOLIA || '',
    chainId: 11155111,
    rpcUrl: process.env.SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com'
  },
  amoy: {
    playToken: process.env.NEXT_PUBLIC_PLAY_TOKEN_ADDRESS || '0x237B9E4EEE4AeAf712B5B240Ab03C973310B6bD1',
    chainId: 80002,
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || ''
  }
}

// Verify JWT token
function verifyJWT(token: string): any {
  const jwt = require('jsonwebtoken')
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-development'
  
  try {
    return jwt.verify(token, jwtSecret)
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  return request.ip || 
         request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         '127.0.0.1'
}

// Get blockchain provider and contract
function getPlayTokenContract(network: 'sepolia' | 'amoy') {
  const config = CONTRACT_ADDRESSES[network]
  
  if (!config.playToken) {
    throw new Error(`PlayToken address not configured for ${network}`)
  }
  
  const provider = new ethers.JsonRpcProvider(config.rpcUrl)
  const wallet = new ethers.Wallet(
    process.env.DISTRIBUTOR_PRIVATE_KEY || process.env.PRIVATE_KEY || '',
    provider
  )
  
  return new ethers.Contract(config.playToken, PLAY_TOKEN_ABI, wallet)
}

// Main claim endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { claimType, network = 'sepolia', walletAddress } = body
    
    // Get and verify JWT token
    const authToken = request.cookies.get('auth_token')?.value
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'NO_AUTH_TOKEN' },
        { status: 401 }
      )
    }
    
    const tokenPayload = verifyJWT(authToken)
    const twitterId = tokenPayload.sub
    const tokenWalletAddress = tokenPayload.wallet_address
    
    // Validate claim type
    if (!['base_airdrop', 'volunteer_bonus'].includes(claimType)) {
      return NextResponse.json(
        { error: 'Invalid claim type', code: 'INVALID_CLAIM_TYPE' },
        { status: 400 }
      )
    }
    
    // Use wallet address from token if not provided
    const targetWalletAddress = walletAddress || tokenWalletAddress
    
    if (!targetWalletAddress || !ethers.isAddress(targetWalletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address', code: 'INVALID_WALLET_ADDRESS' },
        { status: 400 }
      )
    }
    
    // Rate limiting check
    const clientIP = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    
    const canAttempt = await FirestoreService.checkRateLimit(
      clientIP,
      claimType,
      5, // 5 minute window
      3  // max 3 attempts
    )
    
    if (!canAttempt) {
      await FirestoreService.logClaimAttempt({
        twitterId,
        walletAddress: targetWalletAddress,
        ipAddress: clientIP,
        userAgent,
        attemptType: claimType,
        success: false,
        errorCode: 'RATE_LIMITED',
        errorMessage: 'Too many attempts from this IP',
      })
      
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.', code: 'RATE_LIMITED' },
        { status: 429 }
      )
    }
    
    // Get user from database
    const user = await FirestoreService.getUser(twitterId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }
    
    // Check claim eligibility
    if (claimType === 'base_airdrop' && user.claims.baseAirdrop.claimed) {
      await FirestoreService.logClaimAttempt({
        twitterId,
        walletAddress: targetWalletAddress,
        ipAddress: clientIP,
        userAgent,
        attemptType: claimType,
        success: false,
        errorCode: 'ALREADY_CLAIMED',
        errorMessage: 'Base airdrop already claimed',
      })
      
      return NextResponse.json(
        { error: 'Base airdrop already claimed', code: 'ALREADY_CLAIMED' },
        { status: 400 }
      )
    }
    
    if (claimType === 'volunteer_bonus') {
      if (!user.roles.isVolunteer) {
        return NextResponse.json(
          { error: 'User is not a volunteer', code: 'NOT_VOLUNTEER' },
          { status: 403 }
        )
      }
      
      if (user.claims.volunteerBonus.claimed) {
        await FirestoreService.logClaimAttempt({
          twitterId,
          walletAddress: targetWalletAddress,
          ipAddress: clientIP,
          userAgent,
          attemptType: claimType,
          success: false,
          errorCode: 'ALREADY_CLAIMED',
          errorMessage: 'Volunteer bonus already claimed',
        })
        
        return NextResponse.json(
          { error: 'Volunteer bonus already claimed', code: 'ALREADY_CLAIMED' },
          { status: 400 }
        )
      }
    }
    
    // Initialize blockchain contract
    const playTokenContract = getPlayTokenContract(network)
    
    // Double-check on-chain claim status
    if (claimType === 'base_airdrop') {
      const alreadyClaimed = await playTokenContract.hasClaimedBaseAirdrop(targetWalletAddress)
      if (alreadyClaimed) {
        return NextResponse.json(
          { error: 'Already claimed on blockchain', code: 'BLOCKCHAIN_ALREADY_CLAIMED' },
          { status: 400 }
        )
      }
    }
    
    if (claimType === 'volunteer_bonus') {
      const alreadyClaimed = await playTokenContract.hasClaimedVolunteerBonus(targetWalletAddress)
      if (alreadyClaimed) {
        return NextResponse.json(
          { error: 'Already claimed on blockchain', code: 'BLOCKCHAIN_ALREADY_CLAIMED' },
          { status: 400 }
        )
      }
    }
    
    // Execute blockchain transaction
    let tx
    let amountPT
    
    try {
      if (claimType === 'base_airdrop') {
        tx = await playTokenContract.distributeBaseAirdrop(targetWalletAddress)
        amountPT = 1000
      } else {
        tx = await playTokenContract.distributeVolunteerBonus(targetWalletAddress)
        amountPT = 2000
      }
      
      // Wait for transaction confirmation
      const receipt = await tx.wait()
      
      if (receipt.status !== 1) {
        throw new Error('Transaction failed')
      }
      
      // Update database with successful claim
      if (claimType === 'base_airdrop') {
        await FirestoreService.claimBaseAirdrop(twitterId, targetWalletAddress, tx.hash, amountPT)
      } else {
        await FirestoreService.claimVolunteerBonus(twitterId, targetWalletAddress, tx.hash, amountPT)
      }
      
      // Log successful attempt
      await FirestoreService.logClaimAttempt({
        twitterId,
        walletAddress: targetWalletAddress,
        ipAddress: clientIP,
        userAgent,
        attemptType: claimType,
        success: true,
      })
      
      // Get updated balance
      const newBalance = await playTokenContract.balanceOf(targetWalletAddress)
      
      return NextResponse.json({
        success: true,
        txHash: tx.hash,
        amount: amountPT,
        newBalance: ethers.formatEther(newBalance),
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        message: claimType === 'base_airdrop' 
          ? `Successfully claimed ${amountPT} PT base airdrop!`
          : `Successfully claimed ${amountPT} PT volunteer bonus!`
      })
      
    } catch (blockchainError) {
      console.error('Blockchain transaction failed:', blockchainError)
      
      // Log failed attempt
      await FirestoreService.logClaimAttempt({
        twitterId,
        walletAddress: targetWalletAddress,
        ipAddress: clientIP,
        userAgent,
        attemptType: claimType,
        success: false,
        errorCode: 'BLOCKCHAIN_ERROR',
        errorMessage: blockchainError instanceof Error ? blockchainError.message : 'Unknown blockchain error',
      })
      
      return NextResponse.json(
        { 
          error: 'Blockchain transaction failed', 
          code: 'BLOCKCHAIN_ERROR',
          details: blockchainError instanceof Error ? blockchainError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Claim API error:', error)
    
    // Log error attempt
    try {
      const clientIP = getClientIP(request)
      const userAgent = request.headers.get('user-agent') || 'Unknown'
      
      await FirestoreService.logClaimAttempt({
        ipAddress: clientIP,
        userAgent,
        attemptType: 'base_airdrop', // Default for error logging
        success: false,
        errorCode: 'INTERNAL_ERROR',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
    } catch (logError) {
      console.error('Failed to log error attempt:', logError)
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for claim status
export async function GET(request: NextRequest) {
  try {
    // Get and verify JWT token
    const authToken = request.cookies.get('auth_token')?.value
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'NO_AUTH_TOKEN' },
        { status: 401 }
      )
    }
    
    const tokenPayload = verifyJWT(authToken)
    const twitterId = tokenPayload.sub
    const walletAddress = tokenPayload.wallet_address
    
    // Get user from database
    const user = await FirestoreService.getUser(twitterId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }
    
    // Get current balance from blockchain
    const { searchParams } = new URL(request.url)
    const network = searchParams.get('network') || 'sepolia'
    
    let currentBalance = '0'
    try {
      const playTokenContract = getPlayTokenContract(network as 'sepolia' | 'amoy')
      const balance = await playTokenContract.balanceOf(walletAddress)
      currentBalance = ethers.formatEther(balance)
    } catch (balanceError) {
      console.error('Failed to get balance:', balanceError)
    }
    
    return NextResponse.json({
      twitterId,
      walletAddress,
      claims: user.claims,
      roles: user.roles,
      currentBalance,
      canClaimBase: !user.claims.baseAirdrop.claimed,
      canClaimBonus: user.roles.isVolunteer && !user.claims.volunteerBonus.claimed,
    })
    
  } catch (error) {
    console.error('Claim status API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get claim status', 
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}