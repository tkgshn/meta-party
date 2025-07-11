import { getMagic, getMagicProvider } from './magic'

// Paymaster configuration for gasless transactions
interface PaymasterConfig {
  rpcUrl: string
  paymasterUrl?: string
  chainId: number
  supportedTokens: string[]
  maxGasLimit: number
}

const PAYMASTER_CONFIGS: Record<string, PaymasterConfig> = {
  sepolia: {
    rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
    paymasterUrl: process.env.NEXT_PUBLIC_SEPOLIA_PAYMASTER_URL, // Optional - to be configured
    chainId: 11155111,
    supportedTokens: [
      process.env.NEXT_PUBLIC_PLAY_TOKEN_ADDRESS_SEPOLIA || '',
    ].filter(Boolean),
    maxGasLimit: 500000
  }
}

// Gas policy for Play Token operations
export interface GasPolicy {
  sponsor: boolean // Whether to sponsor the gas
  maxGasPrice: string // Maximum gas price to sponsor
  supportedMethods: string[] // Contract methods to sponsor
}

const PLAY_TOKEN_GAS_POLICY: GasPolicy = {
  sponsor: true,
  maxGasPrice: '20000000000', // 20 gwei
  supportedMethods: [
    'distributeBaseAirdrop',
    'distributeVolunteerBonus',
    'transfer', // Allow transfers within the platform
    'approve'   // Allow approvals for market participation
  ]
}

// Check if transaction should be sponsored
export function shouldSponsorTransaction(
  to: string,
  data: string,
  gasLimit: number,
  network: string = 'sepolia'
): boolean {
  const config = PAYMASTER_CONFIGS[network]
  if (!config) return false

  // Check gas limit
  if (gasLimit > config.maxGasLimit) return false

  // Check if it's a supported token contract
  const isPlayTokenContract = config.supportedTokens.includes(to.toLowerCase())
  if (!isPlayTokenContract) return false

  // Decode function selector (first 4 bytes of data)
  const functionSelector = data.slice(0, 10)
  
  // Map function selectors to method names
  const methodMap: Record<string, string> = {
    '0xa9059cbb': 'transfer',
    '0x095ea7b3': 'approve',
    '0x40c10f19': 'mint', // If supported
    // Add distributeBaseAirdrop and distributeVolunteerBonus selectors
    // These would need to be calculated from the actual contract ABI
  }

  const methodName = methodMap[functionSelector]
  return methodName ? PLAY_TOKEN_GAS_POLICY.supportedMethods.includes(methodName) : false
}

// Submit gasless transaction via Magic
export async function submitGaslessTransaction(
  transaction: {
    to: string
    data: string
    value?: string
    gasLimit?: number
  },
  network: string = 'sepolia'
): Promise<{ txHash: string; sponsored: boolean }> {
  const magic = await getMagic()
  const provider = await getMagicProvider()
  
  if (!magic || !provider) {
    throw new Error('Magic SDK not initialized')
  }

  const config = PAYMASTER_CONFIGS[network]
  if (!config) {
    throw new Error(`Paymaster not configured for network: ${network}`)
  }

  try {
    // Check if transaction should be sponsored
    const gasLimit = transaction.gasLimit || 250000
    const shouldSponsor = shouldSponsorTransaction(
      transaction.to,
      transaction.data,
      gasLimit,
      network
    )

    if (shouldSponsor && config.paymasterUrl) {
      // Use paymaster for sponsored transaction
      const sponsoredTx = await submitSponsoredTransaction(transaction, config)
      return { txHash: sponsoredTx.hash, sponsored: true }
    } else {
      // Submit regular transaction (user pays gas)
      const tx = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          to: transaction.to,
          data: transaction.data,
          value: transaction.value || '0x0',
          gas: `0x${gasLimit.toString(16)}`
        }]
      })
      
      return { txHash: tx, sponsored: false }
    }

  } catch (error) {
    console.error('Gasless transaction failed:', error)
    throw error
  }
}

// Submit sponsored transaction via Paymaster
async function submitSponsoredTransaction(
  transaction: {
    to: string
    data: string
    value?: string
    gasLimit?: number
  },
  config: PaymasterConfig
): Promise<{ hash: string }> {
  if (!config.paymasterUrl) {
    throw new Error('Paymaster URL not configured')
  }

  // Get user address from Magic
  const magic = await getMagic()
  if (!magic) {
    throw new Error('Magic SDK not initialized')
  }

  const userMetadata = await magic.user.getMetadata()
  if (!userMetadata.publicAddress) {
    throw new Error('User address not available')
  }

  // Prepare sponsored transaction request
  const sponsorRequest = {
    to: transaction.to,
    data: transaction.data,
    value: transaction.value || '0',
    from: userMetadata.publicAddress,
    gasLimit: transaction.gasLimit || 250000,
    chainId: config.chainId
  }

  // Submit to paymaster service
  const response = await fetch(config.paymasterUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      method: 'eth_sendSponsoredTransaction',
      params: [sponsorRequest]
    })
  })

  if (!response.ok) {
    throw new Error(`Paymaster request failed: ${response.statusText}`)
  }

  const result = await response.json()
  if (result.error) {
    throw new Error(`Paymaster error: ${result.error.message}`)
  }

  return result.result
}

// Estimate gas for transaction
export async function estimateGas(
  transaction: {
    to: string
    data: string
    value?: string
  },
  network: string = 'sepolia'
): Promise<{ gasLimit: number; gasPrice: string; sponsored: boolean }> {
  const provider = await getMagicProvider()
  
  if (!provider) {
    throw new Error('Magic provider not available')
  }

  try {
    // Estimate gas limit
    const gasLimit = await provider.request({
      method: 'eth_estimateGas',
      params: [transaction]
    })

    // Get current gas price
    const gasPrice = await provider.request({
      method: 'eth_gasPrice',
      params: []
    })

    // Check if transaction would be sponsored
    const sponsored = shouldSponsorTransaction(
      transaction.to,
      transaction.data,
      parseInt(gasLimit, 16),
      network
    )

    return {
      gasLimit: parseInt(gasLimit, 16),
      gasPrice,
      sponsored
    }

  } catch (error) {
    console.error('Gas estimation failed:', error)
    throw error
  }
}

// Helper function to get Paymaster configuration
export function getPaymasterConfig(network: string): PaymasterConfig | null {
  return PAYMASTER_CONFIGS[network] || null
}

// Check if Paymaster is available for network
export function isPaymasterAvailable(network: string): boolean {
  const config = PAYMASTER_CONFIGS[network]
  return !!(config && config.paymasterUrl)
}