import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { polygonAmoy, sepolia } from '@reown/appkit/networks'
import { defineChain } from 'viem'

// Get projectId from Reown Cloud
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '5dd7b117e9736f52f60dc23582acb63e'

if (!projectId) {
  console.warn('NEXT_PUBLIC_REOWN_PROJECT_ID is not defined, using fallback')
}

// Define Anvil local network
export const anvil = defineChain({
  id: 31337,
  name: 'Anvil Local',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
  blockExplorers: {
    default: { name: 'None', url: '' },
  },
  testnet: true,
})

// Export networks for use in AppKit - Sepolia first as default for current branch
export const networks = [sepolia, anvil, polygonAmoy]

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks,
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com'),
    [anvil.id]: http('http://127.0.0.1:8545'),
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology'),
  }
})

export const config = wagmiAdapter.wagmiConfig