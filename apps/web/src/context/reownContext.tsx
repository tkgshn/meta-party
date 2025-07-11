'use client'

import { wagmiAdapter, projectId, networks } from '@/config/wagmi'
import { sepolia } from '@reown/appkit/networks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

// Set up queryClient
const queryClient = new QueryClient()

if (!projectId) {
  console.warn('Project ID is not defined, using fallback')
}

// Set up metadata
const metadata = {
  name: 'Ultrathink Futarchy Platform',
  description: 'Cutting-edge prediction market-based governance system',
  url: 'https://web-nqr7kd4vi-taka-shunsuke-takagis-projects.vercel.app', // Your production URL
  icons: ['https://assets.reown.com/reown-profile-pic.png']
}

// Create the modal with Social Login
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork: sepolia,
  metadata: metadata,
  features: {
    email: false,
    analytics: true, // Optional - defaults to your Cloud configuration
    socials: ['x'], // Enable Twitter (X), Google, Discord
    emailShowWallets: false,
  },
  sponsor: {
    mode: 'auto', // 常に sponsor を有効化（明示的に relay）
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#0066CC',
    '--w3m-border-radius-master': '10px',
  }
})

function ReownContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export default ReownContextProvider
