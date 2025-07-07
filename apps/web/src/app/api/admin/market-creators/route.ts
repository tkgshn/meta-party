import { NextRequest, NextResponse } from 'next/server'
import FirestoreService from '@/lib/firestore'

// Verify JWT token and admin status
function verifyAdminJWT(token: string): any {
  const jwt = require('jsonwebtoken')
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-development'
  
  try {
    const payload = jwt.verify(token, jwtSecret)
    
    // Check admin privileges
    const adminTwitterIds = (process.env.ADMIN_TWITTER_IDS || '').split(',')
    if (!adminTwitterIds.includes(payload.sub)) {
      throw new Error('User is not an admin')
    }
    
    return payload
  } catch (error) {
    throw new Error('Invalid admin token or insufficient permissions')
  }
}

// POST - Grant market creator permissions by wallet address
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authToken = request.cookies.get('auth_token')?.value
    if (!authToken) {
      return NextResponse.json(
        { error: 'Admin authentication required', code: 'NO_AUTH_TOKEN' },
        { status: 401 }
      )
    }
    
    const adminPayload = verifyAdminJWT(authToken)
    const adminTwitterId = adminPayload.sub
    
    const body = await request.json()
    const { walletAddress, permissions } = body
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required', code: 'MISSING_WALLET_ADDRESS' },
        { status: 400 }
      )
    }
    
    // Special handling for the specified address
    const targetAddress = '0x2c5329fFa2A1f02A241Ec1932b4358bf71e158ae'
    
    if (walletAddress.toLowerCase() === targetAddress.toLowerCase()) {
      // Create a special market creator entry for this address
      const marketCreatorData = {
        twitterId: `wallet_${walletAddress.toLowerCase()}`, // Special ID for wallet-based creators
        walletAddress: targetAddress,
        profile: {
          name: 'Market Creator',
          organization: 'Independent',
          bio: 'Authorized market creator',
          website: '',
          specialization: ['government', 'social', 'technology'],
        },
        permissions: {
          canCreateMarkets: true,
          canResolveMarkets: true,
          maxMarketsPerMonth: 20,
          categories: ['government', 'social', 'education', 'environment', 'business', 'technology'],
        },
        status: 'active' as const,
        approval: {
          approvedBy: adminTwitterId,
          approvedAt: new Date(),
          reviewNotes: 'Direct admin approval for wallet address',
        },
      }
      
      // Store market creator profile
      await FirestoreService.createMarketCreator(
        `wallet_${walletAddress.toLowerCase()}`,
        marketCreatorData
      )
      
      // Also create a minimal user entry if it doesn't exist
      try {
        const existingUser = await FirestoreService.getUser(`wallet_${walletAddress.toLowerCase()}`)
        if (!existingUser) {
          await FirestoreService.createUser({
            twitterId: `wallet_${walletAddress.toLowerCase()}`,
            walletAddress: targetAddress,
            authProvider: 'wallet' as any, // Special auth provider for wallet-based access
            twitter: {
              id: `wallet_${walletAddress.toLowerCase()}`,
              username: 'market_creator',
              displayName: 'Market Creator',
            },
            roles: {
              isVolunteer: false,
              isMarketCreator: true,
              isAdmin: false,
            }
          })
        } else {
          // Update existing user to add market creator role
          await FirestoreService.updateUser(`wallet_${walletAddress.toLowerCase()}`, {
            roles: {
              ...existingUser.roles,
              isMarketCreator: true,
            }
          })
        }
      } catch (userError) {
        console.error('Error creating/updating user:', userError)
        // Continue even if user creation fails
      }
      
      return NextResponse.json({
        success: true,
        message: `Market creator permissions granted to ${walletAddress}`,
        walletAddress: targetAddress,
        permissions: marketCreatorData.permissions,
        approvedBy: adminTwitterId,
      })
    }
    
    // For other addresses, implement normal flow
    return NextResponse.json(
      { error: 'Wallet address not in whitelist', code: 'ADDRESS_NOT_WHITELISTED' },
      { status: 403 }
    )
    
  } catch (error) {
    console.error('Market creator permission grant error:', error)
    
    if (error instanceof Error && error.message.includes('admin')) {
      return NextResponse.json(
        { error: 'Admin access required', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to grant market creator permissions', 
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET - List market creators
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authToken = request.cookies.get('auth_token')?.value
    if (!authToken) {
      return NextResponse.json(
        { error: 'Admin authentication required', code: 'NO_AUTH_TOKEN' },
        { status: 401 }
      )
    }
    
    verifyAdminJWT(authToken)
    
    // Return mock data for now
    const marketCreators = [
      {
        id: 'wallet_0x2c5329ffa2a1f02a241ec1932b4358bf71e158ae',
        walletAddress: '0x2c5329fFa2A1f02A241Ec1932b4358bf71e158ae',
        profile: {
          name: 'Market Creator',
          organization: 'Independent'
        },
        permissions: {
          canCreateMarkets: true,
          canResolveMarkets: true,
          maxMarketsPerMonth: 20,
          categories: ['government', 'social', 'technology']
        },
        status: 'active',
        marketsCreated: 0,
        marketsResolved: 0
      }
    ]
    
    return NextResponse.json({
      marketCreators,
      total: marketCreators.length
    })
    
  } catch (error) {
    console.error('Market creators GET error:', error)
    
    if (error instanceof Error && error.message.includes('admin')) {
      return NextResponse.json(
        { error: 'Admin access required', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve market creators', 
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}