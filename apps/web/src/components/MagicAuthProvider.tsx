'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useMagicAuth } from '@/hooks/useMagicAuth'

interface MagicAuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: any | null
  walletAddress: string | null
  error: string | null
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const MagicAuthContext = createContext<MagicAuthContextType | null>(null)

export function MagicAuthProvider({ children }: { children: React.ReactNode }) {
  const magicAuth = useMagicAuth()

  return (
    <MagicAuthContext.Provider value={magicAuth}>
      {children}
    </MagicAuthContext.Provider>
  )
}

export function useMagicAuthContext() {
  const context = useContext(MagicAuthContext)
  if (!context) {
    throw new Error('useMagicAuthContext must be used within MagicAuthProvider')
  }
  return context
}

// Integrated auth component that handles both Magic and Reown
export function AuthenticatedContent({ 
  children,
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const magicAuth = useMagicAuth()
  
  if (magicAuth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  if (!magicAuth.isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">ログインが必要です</p>
          <a 
            href="/auth/twitter"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Twitter認証でログイン
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}