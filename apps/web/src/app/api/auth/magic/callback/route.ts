import { NextRequest, NextResponse } from 'next/server'
import { Magic } from '@magic-sdk/admin'
import FirestoreService from '@/lib/firestore'

// Server-side Magic SDK instance
const magicAdmin = new Magic(process.env.MAGIC_SECRET_KEY)

export async function GET(request: NextRequest) {
  try {
    // Get the DID token from Magic OAuth flow
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const state = searchParams.get('state')
    
    if (provider !== 'twitter') {
      return NextResponse.json(
        { error: 'Invalid OAuth provider', code: 'INVALID_PROVIDER' },
        { status: 400 }
      )
    }

    // This endpoint is called after Magic OAuth redirect
    // The actual authentication completion happens on the client side
    // We'll redirect to a page that handles the Magic SDK client-side completion
    
    const redirectUrl = new URL('/auth/magic/complete', request.url)
    if (state) {
      redirectUrl.searchParams.set('state', state)
    }

    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error('Magic OAuth callback error:', error)
    
    const errorUrl = new URL('/auth/error', request.url)
    errorUrl.searchParams.set('error', 'magic_oauth_failed')
    errorUrl.searchParams.set('message', error instanceof Error ? error.message : 'Unknown error')
    
    return NextResponse.redirect(errorUrl)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { didToken } = body

    if (!didToken) {
      return NextResponse.json(
        { error: 'DID token is required', code: 'NO_DID_TOKEN' },
        { status: 400 }
      )
    }

    // Validate DID token with Magic Admin SDK
    const issuer = magicAdmin.token.getIssuer(didToken)
    const publicAddress = magicAdmin.token.getPublicAddress(didToken)
    
    // Validate the token
    magicAdmin.token.validate(didToken)

    // Get user metadata from Magic
    const userMetadata = await magicAdmin.users.getMetadataByIssuer(issuer)

    if (!userMetadata.oauth) {
      return NextResponse.json(
        { error: 'No OAuth data found', code: 'NO_OAUTH_DATA' },
        { status: 400 }
      )
    }

    const twitterData = userMetadata.oauth.provider === 'twitter' ? userMetadata.oauth : null
    
    if (!twitterData) {
      return NextResponse.json(
        { error: 'Twitter OAuth data not found', code: 'NO_TWITTER_DATA' },
        { status: 400 }
      )
    }

    const twitterId = twitterData.userInfo?.id || twitterData.userInfo?.sub
    const twitterUsername = twitterData.userInfo?.preferred_username || twitterData.userInfo?.username
    const twitterDisplayName = twitterData.userInfo?.name || twitterData.userInfo?.display_name

    if (!twitterId) {
      return NextResponse.json(
        { error: 'Twitter ID not found in OAuth data', code: 'NO_TWITTER_ID' },
        { status: 400 }
      )
    }

    // Create or update user in Firestore
    let user = await FirestoreService.getUser(twitterId)
    
    if (!user) {
      // Create new user with Magic wallet
      user = await FirestoreService.createUser({
        twitterId,
        walletAddress: publicAddress,
        authProvider: 'magic_twitter',
        twitter: {
          id: twitterId,
          username: twitterUsername || '',
          displayName: twitterDisplayName || '',
        },
        magicAuth: {
          issuer,
          publicAddress,
          createdAt: new Date().toISOString(),
        }
      })
    } else {
      // Update existing user with Magic auth info
      await FirestoreService.updateUser(twitterId, {
        magicAuth: {
          issuer,
          publicAddress,
          lastLoginAt: new Date().toISOString(),
        }
      })
    }

    // Generate JWT token for our application
    const jwt = require('jsonwebtoken')
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-development'
    
    const jwtPayload = {
      sub: twitterId,
      wallet_address: publicAddress,
      auth_provider: 'magic_twitter',
      twitter_username: twitterUsername,
      magic_issuer: issuer,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    }

    const authToken = jwt.sign(jwtPayload, jwtSecret)

    // Create response with secure cookie
    const response = NextResponse.json({
      success: true,
      user: {
        twitterId,
        walletAddress: publicAddress,
        twitter: user.twitter,
        roles: user.roles,
      },
      walletAddress: publicAddress,
      authProvider: 'magic_twitter',
    })

    // Set secure HTTP-only cookie
    const cookieOptions = [
      'httpOnly',
      'secure',
      'sameSite=strict',
      `max-age=${24 * 60 * 60}`, // 24 hours
      'path=/',
    ]

    response.headers.set(
      'Set-Cookie',
      `auth_token=${authToken}; ${cookieOptions.join('; ')}`
    )

    return response

  } catch (error) {
    console.error('Magic DID token validation error:', error)
    
    if (error instanceof Error && error.message.includes('DID token is malformed')) {
      return NextResponse.json(
        { error: 'Invalid DID token format', code: 'MALFORMED_DID_TOKEN' },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('DID token has expired')) {
      return NextResponse.json(
        { error: 'DID token has expired', code: 'EXPIRED_DID_TOKEN' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Authentication failed', 
        code: 'MAGIC_AUTH_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}