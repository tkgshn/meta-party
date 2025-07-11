import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No authentication token found' }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-development';
    
    try {
      const payload = verify(token, jwtSecret) as any;
      
      return NextResponse.json({
        twitterId: payload.sub,
        twitterUsername: payload.username,
        displayName: payload.display_name,
        walletAddress: payload.wallet_address,
        isNewUser: payload.is_new_user,
        authenticated: true
      });
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}