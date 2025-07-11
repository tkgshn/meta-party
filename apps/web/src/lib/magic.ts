// Magic SDK configuration for client-side only
let magic: any = null

export const getMagic = async () => {
  if (typeof window === 'undefined') {
    return null // Server-side rendering
  }

  if (!magic) {
    const magicPublishableKey = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY
    
    if (!magicPublishableKey) {
      console.error('NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY is not set')
      return null
    }

    try {
      // Dynamic imports for client-side only
      const { Magic } = await import('magic-sdk')
      const { OAuthExtension } = await import('@magic-ext/oauth')

      magic = new Magic(magicPublishableKey, {
        network: {
          rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
          chainId: 11155111, // Sepolia testnet
        },
        extensions: [new OAuthExtension()],
      })
    } catch (error) {
      console.error('Failed to initialize Magic SDK:', error)
      return null
    }
  }

  return magic
}

// Magic Auth integration with Twitter OAuth
export async function authenticateWithTwitterMagic(): Promise<{
  userMetadata: any
  didToken: string
  walletAddress: string
}> {
  const magic = await getMagic()
  if (!magic) {
    throw new Error('Magic SDK not initialized')
  }

  try {
    // Step 1: Twitter OAuth login via Magic
    await magic.oauth.loginWithRedirect({
      provider: 'twitter',
      redirectURI: process.env.NODE_ENV === 'production'
        ? 'https://web-nqr7kd4vi-taka-shunsuke-takagis-projects.vercel.app/api/auth/magic/callback'
        : 'http://localhost:3000/api/auth/magic/callback',
    })

    // This will redirect to callback URL
    // The actual token processing happens in the callback
    throw new Error('This should not be reached - redirect should occur')

  } catch (error) {
    console.error('Magic Twitter authentication failed:', error)
    throw error
  }
}

// Complete authentication after OAuth redirect
export async function completeMagicAuthentication(): Promise<{
  userMetadata: any
  didToken: string
  walletAddress: string
}> {
  const magic = await getMagic()
  if (!magic) {
    throw new Error('Magic SDK not initialized')
  }

  try {
    // Get OAuth result after redirect
    const result = await magic.oauth.getRedirectResult()
    
    if (!result) {
      throw new Error('No OAuth result found')
    }

    // Step 2: Get user metadata
    const userMetadata = await magic.user.getMetadata()
    
    if (!userMetadata.publicAddress) {
      throw new Error('Failed to get wallet address from Magic')
    }

    // Step 3: Generate DID token for backend authentication
    const didToken = await magic.user.getIdToken()

    return {
      userMetadata,
      didToken,
      walletAddress: userMetadata.publicAddress,
    }

  } catch (error) {
    console.error('Magic authentication completion failed:', error)
    throw error
  }
}

// Check if user is already logged in
export async function checkMagicAuthStatus(): Promise<{
  isLoggedIn: boolean
  userMetadata?: any
  walletAddress?: string
} | null> {
  const magic = await getMagic()
  if (!magic) {
    return null
  }

  try {
    const isLoggedIn = await magic.user.isLoggedIn()
    
    if (!isLoggedIn) {
      return { isLoggedIn: false }
    }

    const userMetadata = await magic.user.getMetadata()
    
    return {
      isLoggedIn: true,
      userMetadata,
      walletAddress: userMetadata.publicAddress || undefined,
    }

  } catch (error) {
    console.error('Magic auth status check failed:', error)
    return { isLoggedIn: false }
  }
}

// Logout from Magic
export async function logoutFromMagic(): Promise<void> {
  const magic = await getMagic()
  if (!magic) {
    return
  }

  try {
    await magic.user.logout()
  } catch (error) {
    console.error('Magic logout failed:', error)
    throw error
  }
}

// Get Magic provider for ethers.js integration
export async function getMagicProvider() {
  const magic = await getMagic()
  if (!magic) {
    return null
  }

  return magic.rpcProvider
}

// Helper function to get DID token for API authentication
export async function getMagicDIDToken(): Promise<string | null> {
  const magic = await getMagic()
  if (!magic) {
    return null
  }

  try {
    const isLoggedIn = await magic.user.isLoggedIn()
    if (!isLoggedIn) {
      return null
    }

    return await magic.user.getIdToken()
  } catch (error) {
    console.error('Failed to get Magic DID token:', error)
    return null
  }
}

export default magic