import { NextRequest, NextResponse } from 'next/server'
import { generateTwitterOAuthURL } from '@/lib/reown'
import FirestoreService from '@/lib/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const linkingWallet = searchParams.get('linking_wallet')
    
    // Generate secure state token
    const state = crypto.randomUUID()
    const codeVerifier = crypto.randomUUID()
    
    // Get client IP and user agent for security
    const ipAddress = request.ip || 
                     request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    
    // Store OAuth state in Firestore for security verification
    await FirestoreService.createOAuthState(state, {
      sessionId: crypto.randomUUID(),
      ipAddress,
      userAgent,
      linkingWalletAddress: linkingWallet || undefined,
      linkingFlow: !!linkingWallet,
    })
    
    // Generate Twitter OAuth URL
    const authUrl = generateTwitterOAuthURL(state, codeVerifier)
    
    // Store code verifier in secure httpOnly cookie
    const response = NextResponse.redirect(authUrl)
    response.cookies.set('twitter_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300, // 5 minutes
      path: '/'
    })
    
    return response
    
  } catch (error) {
    console.error('Twitter OAuth initiation failed:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Twitter authentication' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, walletAddress } = body
    
    if (action === 'link' && walletAddress) {
      // Handle wallet linking request
      const state = crypto.randomUUID()
      const codeVerifier = crypto.randomUUID()
      
      const ipAddress = request.ip || 
                       request.headers.get('x-forwarded-for')?.split(',')[0] || 
                       request.headers.get('x-real-ip') || 
                       '127.0.0.1'
      const userAgent = request.headers.get('user-agent') || 'Unknown'
      
      // Store OAuth state for linking flow
      await FirestoreService.createOAuthState(state, {
        sessionId: crypto.randomUUID(),
        ipAddress,
        userAgent,
        linkingWalletAddress: walletAddress,
        linkingFlow: true,
      })
      
      const authUrl = generateTwitterOAuthURL(state, codeVerifier)
      
      return NextResponse.json({
        authUrl,
        state
      })
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Twitter OAuth POST failed:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}