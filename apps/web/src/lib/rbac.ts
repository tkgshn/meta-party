// Role-Based Access Control (RBAC) system for Play Token Airdrop & Futarchy PoC

export interface UserRole {
  isVolunteer: boolean
  isMarketCreator: boolean
  isAdmin: boolean
}

export interface MarketCreatorPermissions {
  canCreateMarkets: boolean
  canResolveMarkets: boolean
  maxMarketsPerMonth: number
  categories: string[]
  status: 'active' | 'suspended' | 'revoked'
}

// Permission levels
export enum PermissionLevel {
  USER = 'user',
  VOLUNTEER = 'volunteer', 
  MARKET_CREATOR = 'market_creator',
  ADMIN = 'admin'
}

// Market categories
export const MARKET_CATEGORIES = [
  'government',
  'social',
  'education', 
  'environment',
  'business',
  'technology',
  'healthcare',
  'infrastructure'
] as const

export type MarketCategory = typeof MARKET_CATEGORIES[number]

// Check if user has required permission
export function hasPermission(
  userRoles: UserRole,
  requiredPermission: PermissionLevel
): boolean {
  switch (requiredPermission) {
    case PermissionLevel.USER:
      return true // All authenticated users
    
    case PermissionLevel.VOLUNTEER:
      return userRoles.isVolunteer || userRoles.isMarketCreator || userRoles.isAdmin
    
    case PermissionLevel.MARKET_CREATOR:
      return userRoles.isMarketCreator || userRoles.isAdmin
    
    case PermissionLevel.ADMIN:
      return userRoles.isAdmin
    
    default:
      return false
  }
}

// Check if user can create markets
export function canCreateMarkets(userRoles: UserRole): boolean {
  return hasPermission(userRoles, PermissionLevel.MARKET_CREATOR)
}

// Check if user can resolve markets  
export function canResolveMarkets(userRoles: UserRole): boolean {
  return hasPermission(userRoles, PermissionLevel.MARKET_CREATOR)
}

// Check if user can manage volunteers
export function canManageVolunteers(userRoles: UserRole): boolean {
  return hasPermission(userRoles, PermissionLevel.ADMIN)
}

// Check if user can access admin features
export function canAccessAdmin(userRoles: UserRole): boolean {
  return hasPermission(userRoles, PermissionLevel.ADMIN)
}

// Validate market creation request
export interface MarketCreationRequest {
  title: string
  description: string
  category: MarketCategory
  resolutionCriteria: string
  endDate: Date
  initialLiquidity: number
  options: string[]
}

export function validateMarketCreation(
  request: MarketCreationRequest,
  userRoles: UserRole,
  permissions?: MarketCreatorPermissions
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check basic permissions
  if (!canCreateMarkets(userRoles)) {
    errors.push('User does not have market creation permissions')
    return { valid: false, errors }
  }

  // Check market creator status if applicable
  if (permissions && permissions.status !== 'active') {
    errors.push(`Market creator status is ${permissions.status}`)
  }

  // Check category permissions
  if (permissions && permissions.categories.length > 0) {
    if (!permissions.categories.includes(request.category)) {
      errors.push(`User not authorized to create markets in category: ${request.category}`)
    }
  }

  // Validate basic fields
  if (!request.title || request.title.trim().length < 10) {
    errors.push('Market title must be at least 10 characters')
  }

  if (!request.description || request.description.trim().length < 50) {
    errors.push('Market description must be at least 50 characters')
  }

  if (!MARKET_CATEGORIES.includes(request.category)) {
    errors.push('Invalid market category')
  }

  if (!request.resolutionCriteria || request.resolutionCriteria.trim().length < 20) {
    errors.push('Resolution criteria must be at least 20 characters')
  }

  if (request.endDate <= new Date()) {
    errors.push('Market end date must be in the future')
  }

  if (request.initialLiquidity < 100) {
    errors.push('Initial liquidity must be at least 100 PT')
  }

  if (!request.options || request.options.length < 2) {
    errors.push('Market must have at least 2 options')
  }

  if (request.options && request.options.length > 10) {
    errors.push('Market cannot have more than 10 options')
  }

  return { valid: errors.length === 0, errors }
}

// Check market monthly limits
export function checkMonthlyLimit(
  createdThisMonth: number,
  permissions?: MarketCreatorPermissions
): { canCreate: boolean; remaining: number } {
  const maxMarkets = permissions?.maxMarketsPerMonth || 5 // Default limit
  const remaining = Math.max(0, maxMarkets - createdThisMonth)
  
  return {
    canCreate: remaining > 0,
    remaining
  }
}

// Permission requirements for different actions
export const PERMISSION_REQUIREMENTS = {
  // Market operations
  CREATE_MARKET: PermissionLevel.MARKET_CREATOR,
  RESOLVE_MARKET: PermissionLevel.MARKET_CREATOR,
  EDIT_MARKET: PermissionLevel.MARKET_CREATOR,
  
  // Trading operations (all users can trade)
  TRADE: PermissionLevel.USER,
  CLAIM_TOKENS: PermissionLevel.USER,
  
  // Volunteer operations
  APPROVE_VOLUNTEERS: PermissionLevel.ADMIN,
  MANAGE_WHITELIST: PermissionLevel.ADMIN,
  
  // System operations
  ADMIN_PANEL: PermissionLevel.ADMIN,
  VIEW_ANALYTICS: PermissionLevel.ADMIN,
  MANAGE_USERS: PermissionLevel.ADMIN,
} as const

// Helper to get user permission level
export function getUserPermissionLevel(userRoles: UserRole): PermissionLevel {
  if (userRoles.isAdmin) return PermissionLevel.ADMIN
  if (userRoles.isMarketCreator) return PermissionLevel.MARKET_CREATOR
  if (userRoles.isVolunteer) return PermissionLevel.VOLUNTEER
  return PermissionLevel.USER
}

// Permission guard for API routes
export function requirePermission(
  userRoles: UserRole,
  requiredPermission: PermissionLevel
): void {
  if (!hasPermission(userRoles, requiredPermission)) {
    throw new Error(`Insufficient permissions. Required: ${requiredPermission}`)
  }
}