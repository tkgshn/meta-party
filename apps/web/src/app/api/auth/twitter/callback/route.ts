import { NextRequest, NextResponse } from 'next/server'
import FirestoreService from '@/lib/firestore'
import { Timestamp } from 'firebase/firestore'

// Twitter OAuth token exchange
async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<{
  access_token: string
  token_type: string
  scope: string
  refresh_token?: string
}> {
  const tokenUrl = 'https://api.twitter.com/2/oauth2/token'
  
  const body = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    client_id: process.env.TWITTER_CLIENT_ID || '',
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  })
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(
        `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body,
  })
  
  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Token exchange failed: ${response.status} ${errorData}`)
  }
  
  return await response.json()
}

// Get Twitter user info
async function getTwitterUserInfo(accessToken: string): Promise<{
  id: string
  username: string
  name: string
  profile_image_url?: string
  verified?: boolean
}> {
  const userUrl = 'https://api.twitter.com/2/users/me?user.fields=id,username,name,profile_image_url,verified'
  
  const response = await fetch(userUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })
  
  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Failed to get user info: ${response.status} ${errorData}`)
  }
  
  const data = await response.json()
  return data.data
}

// Generate deterministic wallet address from Twitter ID (placeholder)
function generateSmartAccountAddress(twitterId: string): string {
  // TODO: Implement proper deterministic address generation with CREATE2
  // For now, generate a placeholder address
  const hash = require('crypto').createHash('sha256').update(twitterId).digest('hex')
  return `0x${hash.slice(0, 40)}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    
    // Handle OAuth errors
    if (error) {
      console.error('Twitter OAuth error:', error)
      return NextResponse.redirect(
        new URL(`/?error=twitter_oauth_${error}`, request.url)
      )
    }
    
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/?error=missing_oauth_params', request.url)
      )
    }
    
    // Verify state to prevent CSRF attacks
    const oauthState = await FirestoreService.getOAuthState(state)
    if (!oauthState) {
      return NextResponse.redirect(
        new URL('/?error=invalid_oauth_state', request.url)
      )
    }
    
    // Get code verifier from cookie
    const codeVerifier = request.cookies.get('twitter_code_verifier')?.value
    if (!codeVerifier) {
      return NextResponse.redirect(
        new URL('/?error=missing_code_verifier', request.url)
      )
    }
    
    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(
      code,
      codeVerifier,
      process.env.NODE_ENV === 'production'
        ? 'https://web-nqr7kd4vi-taka-shunsuke-takagis-projects.vercel.app/api/auth/twitter/callback'
        : 'http://localhost:3000/api/auth/twitter/callback'
    )
    
    // Get Twitter user information
    const twitterUser = await getTwitterUserInfo(tokenData.access_token)
    
    // Determine wallet address
    let walletAddress: string
    let isNewUser = false
    
    if (oauthState.linkingFlow && oauthState.linkingWalletAddress) {
      // Linking existing wallet with Twitter
      walletAddress = oauthState.linkingWalletAddress
    } else {
      // New user with smart account
      walletAddress = generateSmartAccountAddress(twitterUser.id)
      isNewUser = true
    }
    
    // Check if user already exists
    const existingUser = await FirestoreService.getUser(twitterUser.id)
    
    if (existingUser) {
      // Update existing user
      await FirestoreService.updateUser(twitterUser.id, {
        walletAddress,
        twitter: {
          id: twitterUser.id,
          username: twitterUser.username,
          displayName: twitterUser.name,
          profileImageUrl: twitterUser.profile_image_url,
          verified: twitterUser.verified,
        },
        lastLoginAt: Timestamp.now(),
      })
      
      await FirestoreService.updateLastLogin(twitterUser.id)
    } else {
      // Create new user
      await FirestoreService.createUser(twitterUser.id, {
        walletAddress,
        authProvider: 'twitter',
        twitter: {
          id: twitterUser.id,
          username: twitterUser.username,
          displayName: twitterUser.name,
          profileImageUrl: twitterUser.profile_image_url,
          verified: twitterUser.verified,
        },
        claims: {
          baseAirdrop: {
            claimed: false,
            amount: 1000,
          },
          volunteerBonus: {
            claimed: false,
            amount: 2000,
          },
        },
        roles: {
          isVolunteer: false,
          isMarketCreator: false,
          isAdmin: false,
        },
      })
    }
    
    // Clean up OAuth state
    await FirestoreService.deleteOAuthState(state)
    
    // Create JWT token for frontend authentication
    const jwt = require('jsonwebtoken')
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-development'
    
    const payload = {
      sub: twitterUser.id, // Twitter ID as subject
      iss: 'ultrathink-futarchy',
      aud: 'ultrathink-users',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      wallet_address: walletAddress,
      username: twitterUser.username,
      display_name: twitterUser.name,
      is_new_user: isNewUser,
    }
    
    const token = jwt.sign(payload, jwtSecret)
    
    // Set JWT as httpOnly cookie and redirect
    const response = NextResponse.redirect(
      new URL(isNewUser ? '/?welcome=true' : '/?login=success', request.url)
    )
    
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })
    
    // Clear code verifier cookie
    response.cookies.set('twitter_code_verifier', '', {
      httpOnly: true,
      maxAge: 0,
      path: '/',
    })
    
    return response
    
  } catch (error) {
    console.error('Twitter OAuth callback failed:', error)
    
    // Log attempt for security monitoring
    try {
      const ipAddress = request.ip || 
                       request.headers.get('x-forwarded-for')?.split(',')[0] || 
                       '127.0.0.1'
      const userAgent = request.headers.get('user-agent') || 'Unknown'
      
      await FirestoreService.logClaimAttempt({
        ipAddress,
        userAgent,
        attemptType: 'base_airdrop',
        success: false,
        errorCode: 'OAUTH_CALLBACK_FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
    } catch (logError) {
      console.error('Failed to log claim attempt:', logError)
    }
    
    return NextResponse.redirect(
      new URL('/?error=oauth_callback_failed', request.url)
    )
  }
}