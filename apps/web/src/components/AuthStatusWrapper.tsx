'use client'

import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { useMagicAuth } from '@/hooks/useMagicAuth'

interface AuthStatusWrapperProps {
  children: (authData: {
    isConnected: boolean
    walletAddress: string | null
    authProvider: 'magic' | 'reown' | null
    isLoading: boolean
    user: any
  }) => React.ReactNode
}

export default function AuthStatusWrapper({ children }: AuthStatusWrapperProps) {
  const { address: reownAddress, isConnected: reownConnected } = useAccount()
  const magicAuth = useMagicAuth()
  
  // Determine the primary authentication method
  const authData = {
    isConnected: magicAuth.isAuthenticated || reownConnected,
    walletAddress: magicAuth.walletAddress || reownAddress || null,
    authProvider: magicAuth.isAuthenticated ? 'magic' as const : 
                  reownConnected ? 'reown' as const : null,
    isLoading: magicAuth.isLoading,
    user: magicAuth.user
  }

  return <>{children(authData)}</>
}