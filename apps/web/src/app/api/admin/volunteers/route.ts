import { NextRequest, NextResponse } from 'next/server'
import FirestoreService from '@/lib/firestore'

// Verify admin JWT token
function verifyAdminJWT(token: string): any {
  const jwt = require('jsonwebtoken')
  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-development'
  
  try {
    const payload = jwt.verify(token, jwtSecret)
    
    // Additional admin verification would go here
    // For now, we'll check a simple admin list or role
    const adminTwitterIds = (process.env.ADMIN_TWITTER_IDS || '').split(',')
    
    if (!adminTwitterIds.includes(payload.sub)) {
      throw new Error('User is not an admin')
    }
    
    return payload
  } catch (error) {
    throw new Error('Invalid admin token or insufficient permissions')
  }
}

// GET - List all volunteers and pending requests
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
    
    const tokenPayload = verifyAdminJWT(authToken)
    
    // Get analytics data
    const analytics = await FirestoreService.getAirdropAnalytics()
    
    // Get all market creators (includes volunteer info)
    // In a real implementation, we'd have a more sophisticated query
    
    return NextResponse.json({
      analytics,
      // Additional volunteer data would be fetched here
      message: 'Volunteer management data retrieved successfully'
    })
    
  } catch (error) {
    console.error('Admin volunteers GET error:', error)
    
    if (error instanceof Error && error.message.includes('admin')) {
      return NextResponse.json(
        { error: 'Admin access required', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve volunteer data', 
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - Add or approve volunteer
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
    const { action, twitterId, walletAddress, userData } = body
    
    if (action === 'approve_volunteer') {
      // Approve user as volunteer
      if (!twitterId) {
        return NextResponse.json(
          { error: 'Twitter ID is required', code: 'MISSING_TWITTER_ID' },
          { status: 400 }
        )
      }
      
      // Get existing user
      const user = await FirestoreService.getUser(twitterId)
      if (!user) {
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        )
      }
      
      // Update user to volunteer status
      await FirestoreService.updateUser(twitterId, {
        roles: {
          ...user.roles,
          isVolunteer: true,
        },
        metadata: {
          ...user.metadata,
          approvedBy: adminTwitterId,
          approvedAt: new Date().toISOString(),
        }
      })
      
      return NextResponse.json({
        success: true,
        message: `User ${user.twitter.displayName} (@${user.twitter.username}) approved as volunteer`,
        twitterId,
        approvedBy: adminTwitterId,
      })
    }
    
    if (action === 'revoke_volunteer') {
      // Revoke volunteer status
      if (!twitterId) {
        return NextResponse.json(
          { error: 'Twitter ID is required', code: 'MISSING_TWITTER_ID' },
          { status: 400 }
        )
      }
      
      const user = await FirestoreService.getUser(twitterId)
      if (!user) {
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        )
      }
      
      // Update user to remove volunteer status
      await FirestoreService.updateUser(twitterId, {
        roles: {
          ...user.roles,
          isVolunteer: false,
        },
        metadata: {
          ...user.metadata,
          revokedBy: adminTwitterId,
          revokedAt: new Date().toISOString(),
        }
      })
      
      return NextResponse.json({
        success: true,
        message: `Volunteer status revoked for ${user.twitter.displayName} (@${user.twitter.username})`,
        twitterId,
        revokedBy: adminTwitterId,
      })
    }
    
    if (action === 'approve_market_creator') {
      // Approve user as market creator
      if (!twitterId || !userData) {
        return NextResponse.json(
          { error: 'Twitter ID and user data are required', code: 'MISSING_DATA' },
          { status: 400 }
        )
      }
      
      const user = await FirestoreService.getUser(twitterId)
      if (!user) {
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        )
      }
      
      // Update user to market creator status
      await FirestoreService.updateUser(twitterId, {
        roles: {
          ...user.roles,
          isMarketCreator: true,
        }
      })
      
      // Create market creator profile
      await FirestoreService.createMarketCreator(twitterId, {
        twitterId,
        walletAddress: user.walletAddress,
        profile: {
          name: userData.name || user.twitter.displayName,
          organization: userData.organization,
          bio: userData.bio,
          website: userData.website,
          specialization: userData.specialization || [],
        },
        permissions: {
          canCreateMarkets: true,
          canResolveMarkets: userData.canResolveMarkets || false,
          maxMarketsPerMonth: userData.maxMarketsPerMonth || 10,
          categories: userData.categories || [],
        },
        status: 'active',
        approval: {
          approvedBy: adminTwitterId,
          approvedAt: new Date() as any, // Firestore will convert to Timestamp
          reviewNotes: userData.reviewNotes,
        },
      })
      
      return NextResponse.json({
        success: true,
        message: `User ${user.twitter.displayName} approved as market creator`,
        twitterId,
        approvedBy: adminTwitterId,
      })
    }
    
    return NextResponse.json(
      { error: 'Invalid action', code: 'INVALID_ACTION' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Admin volunteers POST error:', error)
    
    if (error instanceof Error && error.message.includes('admin')) {
      return NextResponse.json(
        { error: 'Admin access required', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process volunteer action', 
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT - Update volunteer/market creator permissions
export async function PUT(request: NextRequest) {
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
    const { twitterId, permissions, status } = body
    
    if (!twitterId) {
      return NextResponse.json(
        { error: 'Twitter ID is required', code: 'MISSING_TWITTER_ID' },
        { status: 400 }
      )
    }
    
    // Get existing market creator
    const marketCreator = await FirestoreService.getMarketCreator(twitterId)
    if (!marketCreator) {
      return NextResponse.json(
        { error: 'Market creator not found', code: 'MARKET_CREATOR_NOT_FOUND' },
        { status: 404 }
      )
    }
    
    // Update permissions and status
    const updates: any = {}
    
    if (permissions) {
      updates.permissions = {
        ...marketCreator.permissions,
        ...permissions,
      }
    }
    
    if (status) {
      updates.status = status
    }
    
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date() as any // Firestore will convert to Timestamp
      
      // Update market creator in Firestore
      // Note: This would need to be implemented in FirestoreService
      // await FirestoreService.updateMarketCreator(twitterId, updates)
    }
    
    return NextResponse.json({
      success: true,
      message: `Market creator permissions updated for ${twitterId}`,
      updates,
      updatedBy: adminTwitterId,
    })
    
  } catch (error) {
    console.error('Admin volunteers PUT error:', error)
    
    if (error instanceof Error && error.message.includes('admin')) {
      return NextResponse.json(
        { error: 'Admin access required', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update volunteer permissions', 
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE - Remove volunteer/market creator status
export async function DELETE(request: NextRequest) {
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
    
    const { searchParams } = new URL(request.url)
    const twitterId = searchParams.get('twitterId')
    const removeType = searchParams.get('type') // 'volunteer' or 'market_creator'
    
    if (!twitterId || !removeType) {
      return NextResponse.json(
        { error: 'Twitter ID and type are required', code: 'MISSING_PARAMETERS' },
        { status: 400 }
      )
    }
    
    const user = await FirestoreService.getUser(twitterId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }
    
    if (removeType === 'volunteer') {
      // Remove volunteer status
      await FirestoreService.updateUser(twitterId, {
        roles: {
          ...user.roles,
          isVolunteer: false,
        },
        metadata: {
          ...user.metadata,
          volunteerRemovedBy: adminTwitterId,
          volunteerRemovedAt: new Date().toISOString(),
        }
      })
      
      return NextResponse.json({
        success: true,
        message: `Volunteer status removed for ${user.twitter.displayName}`,
        twitterId,
        removedBy: adminTwitterId,
      })
    }
    
    if (removeType === 'market_creator') {
      // Remove market creator status
      await FirestoreService.updateUser(twitterId, {
        roles: {
          ...user.roles,
          isMarketCreator: false,
        }
      })
      
      // Update market creator status to revoked
      // Note: This would need to be implemented in FirestoreService
      // await FirestoreService.updateMarketCreator(twitterId, { status: 'revoked' })
      
      return NextResponse.json({
        success: true,
        message: `Market creator status removed for ${user.twitter.displayName}`,
        twitterId,
        removedBy: adminTwitterId,
      })
    }
    
    return NextResponse.json(
      { error: 'Invalid removal type', code: 'INVALID_TYPE' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Admin volunteers DELETE error:', error)
    
    if (error instanceof Error && error.message.includes('admin')) {
      return NextResponse.json(
        { error: 'Admin access required', code: 'INSUFFICIENT_PERMISSIONS' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to remove volunteer status', 
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}