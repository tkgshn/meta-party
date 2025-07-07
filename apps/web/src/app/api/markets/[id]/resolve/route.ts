import { NextRequest, NextResponse } from 'next/server'
import FirestoreService from '@/lib/firestore'
import { canResolveMarkets } from '@/lib/rbac'

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

interface ResolutionRequest {
  outcome: string | number
  resolutionNotes: string
  evidenceUrls?: string[]
}

// POST - Resolve market
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const marketId = params.id

    // Verify authentication
    const authToken = request.cookies.get('auth_token')?.value
    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'NO_AUTH_TOKEN' },
        { status: 401 }
      )
    }

    const tokenPayload = verifyJWT(authToken)
    const twitterId = tokenPayload.sub

    // Get user from database
    const user = await FirestoreService.getUser(twitterId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Check market resolution permissions
    if (!canResolveMarkets(user.roles)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to resolve markets', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 }
      )
    }

    // Parse resolution request
    const body = await request.json()
    const resolutionRequest: ResolutionRequest = {
      outcome: body.outcome,
      resolutionNotes: body.resolutionNotes,
      evidenceUrls: body.evidenceUrls || []
    }

    // Validate resolution request
    if (!resolutionRequest.outcome && resolutionRequest.outcome !== 0) {
      return NextResponse.json(
        { error: 'Resolution outcome is required', code: 'MISSING_OUTCOME' },
        { status: 400 }
      )
    }

    if (!resolutionRequest.resolutionNotes || resolutionRequest.resolutionNotes.trim().length < 20) {
      return NextResponse.json(
        { error: 'Resolution notes must be at least 20 characters', code: 'INVALID_NOTES' },
        { status: 400 }
      )
    }

    // TODO: Get market from database
    // const market = await FirestoreService.getMarket(marketId)
    // Mock market for demonstration
    const market = {
      id: marketId,
      title: 'Sample Market',
      createdBy: twitterId, // Assuming user created this market
      status: 'active',
      options: ['Yes', 'No'],
      endDate: new Date('2025-01-01').toISOString()
    }

    if (!market) {
      return NextResponse.json(
        { error: 'Market not found', code: 'MARKET_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Check if user can resolve this specific market
    const canResolveThisMarket = user.roles.isAdmin || market.createdBy === twitterId
    if (!canResolveThisMarket) {
      return NextResponse.json(
        { error: 'You can only resolve markets you created', code: 'NOT_MARKET_OWNER' },
        { status: 403 }
      )
    }

    // Check if market is still active
    if (market.status !== 'active') {
      return NextResponse.json(
        { error: `Market is ${market.status} and cannot be resolved`, code: 'MARKET_NOT_ACTIVE' },
        { status: 400 }
      )
    }

    // Check if market has ended
    const now = new Date()
    const endDate = new Date(market.endDate)
    if (now < endDate && !user.roles.isAdmin) {
      return NextResponse.json(
        { 
          error: 'Market has not ended yet', 
          code: 'MARKET_NOT_ENDED',
          endDate: market.endDate
        },
        { status: 400 }
      )
    }

    // Validate outcome against market options
    let outcomeIndex: number
    if (typeof resolutionRequest.outcome === 'string') {
      outcomeIndex = market.options.indexOf(resolutionRequest.outcome)
      if (outcomeIndex === -1) {
        return NextResponse.json(
          { 
            error: 'Invalid outcome option', 
            code: 'INVALID_OUTCOME',
            validOptions: market.options
          },
          { status: 400 }
        )
      }
    } else {
      outcomeIndex = resolutionRequest.outcome
      if (outcomeIndex < 0 || outcomeIndex >= market.options.length) {
        return NextResponse.json(
          { 
            error: 'Outcome index out of range', 
            code: 'INVALID_OUTCOME_INDEX',
            validRange: `0-${market.options.length - 1}`
          },
          { status: 400 }
        )
      }
    }

    // Create resolution record
    const resolution = {
      marketId,
      resolvedBy: twitterId,
      resolverAddress: user.walletAddress,
      outcome: outcomeIndex,
      outcomeText: market.options[outcomeIndex],
      resolutionNotes: resolutionRequest.resolutionNotes.trim(),
      evidenceUrls: resolutionRequest.evidenceUrls,
      resolvedAt: new Date().toISOString(),
      
      // Blockchain transaction info (to be filled)
      txHash: null,
      blockNumber: null,
      gasUsed: null
    }

    // TODO: Execute blockchain resolution
    // const resolutionTx = await resolveMarketOnChain(marketId, outcomeIndex)
    // resolution.txHash = resolutionTx.hash
    // resolution.blockNumber = resolutionTx.blockNumber
    // resolution.gasUsed = resolutionTx.gasUsed

    // TODO: Update market status in database
    // await FirestoreService.resolveMarket(marketId, resolution)

    // TODO: Distribute payouts to token holders
    // await distributePayouts(marketId, outcomeIndex)

    // Mock implementation
    console.log('Market resolution (mock):', resolution)

    return NextResponse.json({
      success: true,
      resolution,
      message: `Market resolved: ${market.options[outcomeIndex]}`,
      txHash: 'mock-tx-hash-' + Date.now()
    })

  } catch (error) {
    console.error('Market resolution error:', error)
    
    if (error instanceof Error && error.message.includes('permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to resolve market', 
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET - Get resolution status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const marketId = params.id

    // TODO: Get resolution from database
    // const resolution = await FirestoreService.getMarketResolution(marketId)
    
    // Mock response
    const resolution = {
      marketId,
      status: 'pending',
      canResolve: false,
      resolvedAt: null,
      outcome: null,
      resolutionNotes: null
    }

    return NextResponse.json({
      resolution,
      marketId
    })

  } catch (error) {
    console.error('Get resolution error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get resolution status', 
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}