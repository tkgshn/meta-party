import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { polygon, polygonAmoy } from '@reown/appkit/networks'

// Get projectId from Reown Cloud
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '5dd7b117e9736f52f60dc23582acb63e'

if (!projectId) {
  throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID is not defined')
}

// Note: Anvil local network can be added later for development

// Export networks for use in AppKit
export const networks = [polygon, polygonAmoy]

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
  }
})

export const config = wagmiAdapter.wagmiConfig