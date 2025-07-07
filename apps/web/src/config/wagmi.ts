import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { polygon, polygonAmoy } from '@reown/appkit/networks'
import { defineChain } from 'viem'

// Get projectId from Reown Cloud
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '5dd7b117e9736f52f60dc23582acb63e'

if (!projectId) {
  throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID is not defined')
}

// Define Anvil local network
const anvilLocal = defineChain({
  id: 31337,
  name: 'Anvil Local',
  network: 'anvil',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Local',
      url: 'http://localhost:8545',
    },
  },
  testnet: true,
})

// Export networks for use in AppKit
export const networks = [polygon, polygonAmoy, anvilLocal]

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks,
  transports: {
    [polygon.id]: http(process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com'),
    [polygonAmoy.id]: http(process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology'),
    [anvilLocal.id]: http('http://127.0.0.1:8545'),
  }
})

export const config = wagmiAdapter.wagmiConfig