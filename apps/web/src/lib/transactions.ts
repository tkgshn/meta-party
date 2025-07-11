import { ethers } from 'ethers'
import { getMagicProvider } from './magic'
import { submitGaslessTransaction, estimateGas } from './paymaster'

// Universal transaction handler for both Magic and MetaMask
export async function sendTransaction(
  transaction: {
    to: string
    data: string
    value?: string
    gasLimit?: number
  },
  options: {
    authProvider?: 'magic' | 'metamask'
    network?: string
    waitForConfirmation?: boolean
  } = {}
): Promise<{
  hash: string
  receipt?: any
  sponsored?: boolean
}> {
  const { authProvider, network = 'sepolia', waitForConfirmation = true } = options

  try {
    let txHash: string
    let sponsored = false

    if (authProvider === 'magic') {
      // Use Magic SDK with optional gasless transactions
      const result = await submitGaslessTransaction(transaction, network)
      txHash = result.txHash
      sponsored = result.sponsored
    } else {
      // Use MetaMask/window.ethereum
      if (!window.ethereum) {
        throw new Error('MetaMask not detected')
      }

      const tx = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          to: transaction.to,
          data: transaction.data,
          value: transaction.value || '0x0',
          gas: transaction.gasLimit ? `0x${transaction.gasLimit.toString(16)}` : undefined
        }]
      })
      txHash = tx
    }

    let receipt
    if (waitForConfirmation) {
      receipt = await waitForTransactionReceipt(txHash, authProvider, network)
    }

    return { hash: txHash, receipt, sponsored }

  } catch (error) {
    console.error('Transaction failed:', error)
    throw error
  }
}

// Wait for transaction receipt
export async function waitForTransactionReceipt(
  txHash: string,
  authProvider?: 'magic' | 'metamask',
  network: string = 'sepolia',
  timeout: number = 60000
): Promise<any> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    try {
      let receipt

      if (authProvider === 'magic') {
        const provider = await getMagicProvider()
        if (!provider) throw new Error('Magic provider not available')
        
        receipt = await provider.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash]
        })
      } else {
        if (!window.ethereum) throw new Error('MetaMask not available')
        
        receipt = await window.ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash]
        })
      }

      if (receipt) {
        return receipt
      }

      // Wait 2 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 2000))

    } catch (error) {
      console.error('Receipt check failed:', error)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  throw new Error(`Transaction receipt timeout for ${txHash}`)
}

// Get gas estimates for transaction
export async function getTransactionEstimate(
  transaction: {
    to: string
    data: string
    value?: string
  },
  authProvider?: 'magic' | 'metamask',
  network: string = 'sepolia'
): Promise<{
  gasLimit: number
  gasPrice: string
  gasCost: string
  sponsored: boolean
}> {
  try {
    if (authProvider === 'magic') {
      const estimate = await estimateGas(transaction, network)
      const gasCost = (BigInt(estimate.gasLimit) * BigInt(estimate.gasPrice)).toString()
      
      return {
        gasLimit: estimate.gasLimit,
        gasPrice: estimate.gasPrice,
        gasCost,
        sponsored: estimate.sponsored
      }
    } else {
      // Use MetaMask estimation
      if (!window.ethereum) {
        throw new Error('MetaMask not available')
      }

      const [gasLimit, gasPrice] = await Promise.all([
        window.ethereum.request({
          method: 'eth_estimateGas',
          params: [transaction]
        }),
        window.ethereum.request({
          method: 'eth_gasPrice',
          params: []
        })
      ])

      const gasCost = (BigInt(gasLimit) * BigInt(gasPrice)).toString()

      return {
        gasLimit: parseInt(gasLimit, 16),
        gasPrice,
        gasCost,
        sponsored: false
      }
    }
  } catch (error) {
    console.error('Gas estimation failed:', error)
    throw error
  }
}

// Helper to format gas cost for display
export function formatGasCost(gasCostWei: string, decimals: number = 4): string {
  const gasCostEth = ethers.formatEther(gasCostWei)
  return parseFloat(gasCostEth).toFixed(decimals)
}

// Check if user has sufficient balance for transaction
export async function checkSufficientBalance(
  walletAddress: string,
  gasCostWei: string,
  authProvider?: 'magic' | 'metamask'
): Promise<boolean> {
  try {
    let balance: string

    if (authProvider === 'magic') {
      const provider = await getMagicProvider()
      if (!provider) throw new Error('Magic provider not available')
      
      balance = await provider.request({
        method: 'eth_getBalance',
        params: [walletAddress, 'latest']
      })
    } else {
      if (!window.ethereum) throw new Error('MetaMask not available')
      
      balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [walletAddress, 'latest']
      })
    }

    return BigInt(balance) >= BigInt(gasCostWei)

  } catch (error) {
    console.error('Balance check failed:', error)
    return false
  }
}