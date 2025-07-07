import { useState, useEffect } from 'react'
import { checkMagicAuthStatus, logoutFromMagic } from '@/lib/magic'

interface MagicAuthState {
  isLoading: boolean
  isAuthenticated: boolean
  user: any | null
  walletAddress: string | null
  error: string | null
}

export function useMagicAuth() {
  const [authState, setAuthState] = useState<MagicAuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    walletAddress: null,
    error: null
  })

  const checkAuthStatus = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await checkMagicAuthStatus()
      
      if (!result) {
        // Magic SDK not available (server-side)
        setAuthState(prev => ({ ...prev, isLoading: false }))
        return
      }

      if (result.isLoggedIn && result.userMetadata) {
        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user: result.userMetadata,
          walletAddress: result.walletAddress || null,
          error: null
        })
      } else {
        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          walletAddress: null,
          error: null
        })
      }
    } catch (error) {
      console.error('Magic auth status check failed:', error)
      setAuthState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        walletAddress: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  const logout = async () => {
    try {
      await logoutFromMagic()
      setAuthState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        walletAddress: null,
        error: null
      })
    } catch (error) {
      console.error('Magic logout failed:', error)
      setAuthState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Logout failed' 
      }))
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  return {
    ...authState,
    refresh: checkAuthStatus,
    logout
  }
}

// Combined auth hook that checks both Magic and Reown/MetaMask
export function useAuthStatus() {
  const magicAuth = useMagicAuth()
  
  // For now, prioritize Magic auth if available
  const isConnected = magicAuth.isAuthenticated
  const walletAddress = magicAuth.walletAddress
  const authProvider = magicAuth.isAuthenticated ? 'magic' : null
  
  return {
    isLoading: magicAuth.isLoading,
    isConnected,
    walletAddress,
    authProvider,
    user: magicAuth.user,
    error: magicAuth.error,
    logout: magicAuth.logout,
    refresh: magicAuth.refresh
  }
}