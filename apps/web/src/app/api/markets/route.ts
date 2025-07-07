import { NextRequest, NextResponse } from 'next/server'
import FirestoreService from '@/lib/firestore'
import { 
  validateMarketCreation, 
  checkMonthlyLimit,
  canCreateMarkets,
  type MarketCreationRequest,
  type MarketCategory,
  MARKET_CATEGORIES 
} from '@/lib/rbac'

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

// GET - List markets with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') as MarketCategory | null
    const status = searchParams.get('status') || 'active'
    const createdBy = searchParams.get('createdBy') || undefined
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // For now, return mock data since we don't have market storage implemented
    const mockMarkets = [
      {
        id: 'market-1',
        title: 'Will Japan achieve carbon neutrality by 2050?',
        description: 'A market to predict whether Japan will successfully achieve its carbon neutrality goal by 2050 as announced in the Green Growth Strategy.',
        category: 'environment',
        status: 'active',
        createdBy: 'admin',
        createdAt: new Date().toISOString(),
        endDate: new Date('2050-12-31').toISOString(),
        options: ['Yes', 'No'],
        totalVolume: 15420,
        currentPrices: [0.67, 0.33],
        resolutionCriteria: 'Market will resolve based on official government announcements and verified carbon emissions data from recognized international organizations.'
      },
      {
        id: 'market-2', 
        title: 'Tokyo 2030 Smart City Initiative Success',
        description: 'Will Tokyo successfully implement its Smart City 2030 initiative including 5G coverage, IoT infrastructure, and digital government services?',
        category: 'technology',
        status: 'active',
        createdBy: 'market-creator-1',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date('2030-12-31').toISOString(),
        options: ['Fully Successful', 'Partially Successful', 'Failed'],
        totalVolume: 8930,
        currentPrices: [0.45, 0.35, 0.20],
        resolutionCriteria: 'Success metrics include 95% 5G coverage, 1M+ IoT devices deployed, and 80% government services digitized.'
      }
    ]

    // Filter by category if specified
    let filteredMarkets = mockMarkets
    if (category && MARKET_CATEGORIES.includes(category)) {
      filteredMarkets = mockMarkets.filter(market => market.category === category)
    }

    // Apply pagination
    const paginatedMarkets = filteredMarkets.slice(offset, offset + limit)

    return NextResponse.json({
      markets: paginatedMarkets,
      total: filteredMarkets.length,
      limit,
      offset,
      hasMore: offset + limit < filteredMarkets.length
    })

  } catch (error) {
    console.error('Markets GET error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch markets', 
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - Create new market
export async function POST(request: NextRequest) {
  try {
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
    const authProvider = tokenPayload.auth_provider || 'twitter'

    // Special handling for whitelisted wallet address
    const whitelistedAddress = '0x2c5329fFa2A1f02A241Ec1932b4358bf71e158ae'
    const isWhitelistedWallet = tokenPayload.wallet_address?.toLowerCase() === whitelistedAddress.toLowerCase()
    
    let user
    if (isWhitelistedWallet) {
      // For whitelisted wallet, try to get wallet-based user
      try {
        user = await FirestoreService.getUser(`wallet_${whitelistedAddress.toLowerCase()}`)
        if (!user) {
          // Create temporary user for this session
          user = {
            roles: {
              isVolunteer: false,
              isMarketCreator: true,
              isAdmin: false
            },
            walletAddress: whitelistedAddress,
            twitter: {
              id: `wallet_${whitelistedAddress.toLowerCase()}`,
              username: 'market_creator',
              displayName: 'Market Creator'
            }
          } as any
        }
      } catch (error) {
        // Create minimal user object for whitelisted wallet
        user = {
          roles: {
            isVolunteer: false,
            isMarketCreator: true,
            isAdmin: false
          },
          walletAddress: whitelistedAddress,
          twitter: {
            id: `wallet_${whitelistedAddress.toLowerCase()}`,
            username: 'market_creator',
            displayName: 'Market Creator'
          }
        } as any
      }
    } else {
      // Normal user lookup
      user = await FirestoreService.getUser(twitterId)
      if (!user) {
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        )
      }
    }

    // Check market creation permissions
    if (!canCreateMarkets(user.roles)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create markets', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const marketRequest: MarketCreationRequest = {
      title: body.title,
      description: body.description,
      category: body.category,
      resolutionCriteria: body.resolutionCriteria,
      endDate: new Date(body.endDate),
      initialLiquidity: body.initialLiquidity || 1000,
      options: body.options || ['Yes', 'No']
    }

    // Get market creator permissions
    let marketCreatorPermissions
    try {
      marketCreatorPermissions = await FirestoreService.getMarketCreator(twitterId)
    } catch (error) {
      // User might not have market creator profile yet
      console.log('No market creator profile found, using default permissions')
    }

    // Validate market creation request
    const validation = validateMarketCreation(marketRequest, user.roles, marketCreatorPermissions)
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Market validation failed', 
          code: 'VALIDATION_ERROR',
          validationErrors: validation.errors
        },
        { status: 400 }
      )
    }

    // Check monthly limits (mock implementation)
    const currentMonth = new Date().getMonth()
    const createdThisMonth = 0 // TODO: Query actual count from database
    
    const limitCheck = checkMonthlyLimit(createdThisMonth, marketCreatorPermissions)
    if (!limitCheck.canCreate) {
      return NextResponse.json(
        { 
          error: 'Monthly market creation limit exceeded', 
          code: 'MONTHLY_LIMIT_EXCEEDED',
          remaining: limitCheck.remaining,
          maxAllowed: marketCreatorPermissions?.maxMarketsPerMonth || 5
        },
        { status: 429 }
      )
    }

    // Generate market ID
    const marketId = `market-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create market object
    const newMarket = {
      id: marketId,
      title: marketRequest.title.trim(),
      description: marketRequest.description.trim(),
      category: marketRequest.category,
      resolutionCriteria: marketRequest.resolutionCriteria.trim(),
      endDate: marketRequest.endDate.toISOString(),
      options: marketRequest.options,
      initialLiquidity: marketRequest.initialLiquidity,
      
      // Creator info
      createdBy: twitterId,
      creatorAddress: user.walletAddress,
      authProvider,
      
      // Status and metadata
      status: 'pending', // Markets start as pending, then get activated
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Trading data (initial state)
      totalVolume: 0,
      totalLiquidity: marketRequest.initialLiquidity,
      currentPrices: marketRequest.options.map(() => 1 / marketRequest.options.length),
      
      // Contract addresses (to be filled when deployed)
      contractAddress: null,
      tokenAddresses: [],
      
      // Additional metadata
      tags: [],
      featured: false,
      verified: user.roles.isAdmin || false
    }

    // TODO: Store market in Firestore
    // await FirestoreService.createMarket(newMarket)

    // TODO: Deploy market contracts to blockchain
    // const contractResult = await deployMarketContract(newMarket)
    // newMarket.contractAddress = contractResult.address
    // newMarket.tokenAddresses = contractResult.tokenAddresses

    // For now, just return the created market (mock implementation)
    console.log('Market created (mock):', newMarket)

    return NextResponse.json({
      success: true,
      market: newMarket,
      message: 'Market created successfully (pending deployment)',
      marketId
    }, { status: 201 })

  } catch (error) {
    console.error('Market creation error:', error)
    
    if (error instanceof Error && error.message.includes('permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to create market', 
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT - Update existing market (market creators only)
export async function PUT(request: NextRequest) {
  try {
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

    // Check permissions
    if (!canCreateMarkets(user.roles)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update markets', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { marketId, updates } = body

    if (!marketId) {
      return NextResponse.json(
        { error: 'Market ID is required', code: 'MISSING_MARKET_ID' },
        { status: 400 }
      )
    }

    // TODO: Implement market update logic
    // - Verify user owns the market or is admin
    // - Validate update fields
    // - Update market in database
    // - Update contract if necessary

    return NextResponse.json({
      success: true,
      message: 'Market update feature coming soon',
      marketId
    })

  } catch (error) {
    console.error('Market update error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update market', 
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}