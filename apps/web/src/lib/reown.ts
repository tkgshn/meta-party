import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { sepolia, polygon } from '@reown/appkit/networks'
// import { polygonAmoy } from '@reown/appkit/networks' // Commented out - Amoy support removed

// Get projectId from environment
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID

if (!projectId) {
  console.warn('NEXT_PUBLIC_REOWN_PROJECT_ID is not set, using default')
}

// Set up networks - Amoy support removed
const networks = [sepolia, polygon]
// const networks = [sepolia, polygon, polygonAmoy] // Commented out - Amoy support removed

// Set up Ethers adapter
const ethersAdapter = new EthersAdapter()

// Create modal with essential wallet options only (if projectId is available)
let modal: any = null

if (projectId) {
  modal = createAppKit({
    adapters: [ethersAdapter],
    networks,
    projectId,
    metadata: {
      name: 'Futarchy Platform',
      description: 'Play Token Airdrop & Futarchy PoC',
      url: process.env.NODE_ENV === 'production' ? 'https://web-nqr7kd4vi-taka-shunsuke-takagis-projects.vercel.app' : 'http://localhost:3000',
      icons: ['https://avatars.githubusercontent.com/u/37784886']
    },
    features: {
      analytics: true,
      email: false, // Disable email login for simplicity
      socials: ['x'], // Only Twitter OAuth for this PoC
      emailShowWallets: false
    },
    // Limit to essential wallets for PoC
    featuredWalletIds: [
      'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
      'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
      '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
    ],
    includeWalletIds: [
      'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
      'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet  
      '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
      '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
      '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709', // OKX Wallet
    ],
    excludeWalletIds: [], // We'll use includeWalletIds for control
    allowUnsupportedChain: false,
    themeMode: 'light',
    themeVariables: {
      '--w3m-color-mix': '#00D2FF',
      '--w3m-color-mix-strength': 20,
      '--w3m-font-family': 'Inter, system-ui, sans-serif',
      '--w3m-border-radius-master': '8px'
    }
  })
} else {
  // Create a mock modal for build-time compatibility
  modal = {
    getAddress: () => null,
    getChainId: () => null,
    open: () => console.warn('AppKit not initialized - missing NEXT_PUBLIC_REOWN_PROJECT_ID'),
    close: () => {},
    subscribeProvider: () => () => {},
    subscribeAccount: () => () => {},
    subscribeChainId: () => () => {},
  }
}

export default modal

// Export for direct usage
export { modal }

// Twitter OAuth specific configuration
export const TWITTER_OAUTH_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID || '',
  redirectUri: process.env.NODE_ENV === 'production' 
    ? 'https://web-nqr7kd4vi-taka-shunsuke-takagis-projects.vercel.app/api/auth/twitter/callback'
    : 'http://localhost:3000/api/auth/twitter/callback',
  scope: 'read users.read tweet.read offline.access',
  responseType: 'code',
  codeChallenge: 'challenge',
  codeChallengeMethod: 'S256'
}

// Helper function to generate Twitter OAuth URL
export function generateTwitterOAuthURL(state: string, codeVerifier?: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: TWITTER_OAUTH_CONFIG.clientId,
    redirect_uri: TWITTER_OAUTH_CONFIG.redirectUri,
    scope: TWITTER_OAUTH_CONFIG.scope,
    state: state,
    code_challenge: codeVerifier || 'challenge',
    code_challenge_method: 'S256'
  })
  
  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`
}

// AppKit connection hooks
export const useAppKit = () => modal
export const useAppKitAccount = () => modal?.getAddress?.() || null
export const useAppKitNetwork = () => modal?.getChainId?.() || null

// Social authentication integration
export async function connectWithTwitter(): Promise<void> {
  try {
    // Generate state and code verifier for PKCE
    const state = crypto.randomUUID()
    const codeVerifier = crypto.randomUUID()
    
    // Store in session storage for callback verification
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('twitter_oauth_state', state)
      sessionStorage.setItem('twitter_code_verifier', codeVerifier)
    }
    
    // Redirect to Twitter OAuth
    const authUrl = generateTwitterOAuthURL(state, codeVerifier)
    window.location.href = authUrl
    
  } catch (error) {
    console.error('Twitter OAuth connection failed:', error)
    throw error
  }
}

// Link existing wallet with Twitter account
export async function linkWalletWithTwitter(walletAddress: string): Promise<void> {
  try {
    // Generate state with linking flag
    const state = crypto.randomUUID()
    const codeVerifier = crypto.randomUUID()
    
    // Store linking info in session storage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('twitter_oauth_state', state)
      sessionStorage.setItem('twitter_code_verifier', codeVerifier)
      sessionStorage.setItem('linking_wallet_address', walletAddress)
      sessionStorage.setItem('linking_flow', 'true')
    }
    
    // Redirect to Twitter OAuth with linking context
    const authUrl = generateTwitterOAuthURL(state, codeVerifier)
    window.location.href = authUrl
    
  } catch (error) {
    console.error('Wallet linking with Twitter failed:', error)
    throw error
  }
}