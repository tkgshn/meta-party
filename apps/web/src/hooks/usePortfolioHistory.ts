import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserProvider, Contract, formatUnits, EventLog, Log } from 'ethers';
import { getCurrencyContract, getNetworkByChainId } from '@/config/networks';
import { useAccount, useConnectorClient } from 'wagmi';
import type { Account, Chain, Client, Transport } from 'viem';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
] as const;

export interface PortfolioHistoryPoint {
  timestamp: number;
  balance: number;
  blockNumber: number;
  transactionHash?: string;
  transactionType?: 'transfer_in' | 'transfer_out' | 'claim';
  value?: number;
  from?: string;
  to?: string;
}

export interface TransactionDetail {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: number;
  type: 'claim' | 'transfer_in' | 'transfer_out';
  formattedValue: string;
}

interface UsePortfolioHistoryReturn {
  historyData: PortfolioHistoryPoint[];
  transactions: TransactionDetail[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshHistory: () => Promise<void>;
  profitLoss: {
    total: number;
    percentage: number;
    period: '1D' | '1W' | '1M' | 'ALL';
  };
  setPeriod: (period: '1D' | '1W' | '1M' | 'ALL') => void;
}

// Utility function to convert wagmi client to ethers provider
function clientToProvider(client: Client<Transport, Chain, Account>) {
  const { chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  if (transport.type === 'fallback') {
    return new BrowserProvider(
      (transport.transports as any)[0].value,
      network
    );
  }
  return new BrowserProvider(transport, network);
}

export function usePortfolioHistory(
  account: string | null,
  networkKey: string,
  forceFullHistory: boolean = false
): UsePortfolioHistoryReturn {
  const [historyData, setHistoryData] = useState<PortfolioHistoryPoint[]>([]);
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [period, setPeriod] = useState<'1D' | '1W' | '1M' | 'ALL'>('ALL');

  const { isConnected } = useAccount();
  const { data: connectorClient } = useConnectorClient();
  const providerRef = useRef<BrowserProvider | null>(null);
  const cacheRef = useRef<Map<string, PortfolioHistoryPoint[]>>(new Map());

  // Initialize provider
  const initializeProvider = useCallback(async () => {
    if (!account || !isConnected) return null;

    try {
      // Try wagmi connector client first (for Reown/WalletConnect)
      if (connectorClient) {
        const provider = clientToProvider(connectorClient);
        providerRef.current = provider;
        return provider;
      }

      // Fallback to window.ethereum (for MetaMask)
      if (window.ethereum) {
        const provider = new BrowserProvider(window.ethereum);
        providerRef.current = provider;
        return provider;
      }

      console.warn('No wallet provider available');
      return null;
    } catch (error) {
      console.error('Failed to initialize provider:', error);
      return null;
    }
  }, [account, isConnected, connectorClient]);

  // Get transaction history from Transfer events
  const getTransactionHistory = useCallback(async (
    provider: BrowserProvider,
    tokenAddress: string,
    account: string,
    isFullHistory: boolean = false
  ): Promise<PortfolioHistoryPoint[]> => {
    try {
      const contract = new Contract(tokenAddress, ERC20_ABI, provider);
      const currentBlock = await provider.getBlockNumber();
      
      let fromBlock: number;
      
      if (isFullHistory) {
        // For ALL mode: get complete history from account's first transaction
        console.log('Fetching complete transaction history for ALL mode...');
        
        // Try to find the first block with activity for this account
        // We'll start from a reasonable point (deployment block or contract creation)
        // and work backwards if needed
        const contractCreationBlock = Math.max(0, currentBlock - 100000); // ~200 days ago as fallback
        
        try {
          // First, try to find any early transaction to establish a starting point
          const earlyIncomingFilter = contract.filters.Transfer(null, account);
          const earlyEvents = await contract.queryFilter(earlyIncomingFilter, contractCreationBlock, contractCreationBlock + 1000);
          
          if (earlyEvents.length > 0) {
            fromBlock = earlyEvents[0].blockNumber;
            console.log(`Found first transaction at block ${fromBlock}`);
          } else {
            // If no early events found, use contract creation as starting point
            fromBlock = contractCreationBlock;
            console.log(`Using contract creation block ${fromBlock} as starting point`);
          }
        } catch (error) {
          console.warn('Could not determine optimal starting block, using fallback');
          fromBlock = Math.max(0, currentBlock - 50000); // ~100 days fallback
        }
      } else {
        // For other periods: use limited range to avoid RPC rate limits
        const maxBlockRange = 10000;
        const blocksPerDay = Math.floor(24 * 60 * 60 / 2); // ~43200 blocks per day for 2s blocks
        const lookbackBlocks = Math.min(maxBlockRange, blocksPerDay * 3); // 3 days max to stay under limit
        fromBlock = Math.max(0, currentBlock - lookbackBlocks);
      }

      console.log(`Fetching events from block ${fromBlock} to ${currentBlock} (range: ${currentBlock - fromBlock} blocks)`);

      let incomingEvents: (EventLog | Log)[] = [];
      let outgoingEvents: (EventLog | Log)[] = [];

      try {
        if (isFullHistory) {
          // For ALL mode: use chunked querying to handle large ranges
          const chunkSize = 5000; // Smaller chunks for full history
          const totalBlocks = currentBlock - fromBlock;
          
          console.log(`Using chunked querying: ${Math.ceil(totalBlocks / chunkSize)} chunks of ${chunkSize} blocks each`);
          
          for (let start = fromBlock; start <= currentBlock; start += chunkSize) {
            const end = Math.min(start + chunkSize - 1, currentBlock);
            
            try {
              // Get incoming transfers for this chunk
              const incomingFilter = contract.filters.Transfer(null, account);
              const chunkIncoming = await contract.queryFilter(incomingFilter, start, end);
              incomingEvents.push(...chunkIncoming);

              // Get outgoing transfers for this chunk
              const outgoingFilter = contract.filters.Transfer(account, null);
              const chunkOutgoing = await contract.queryFilter(outgoingFilter, start, end);
              outgoingEvents.push(...chunkOutgoing);
              
              // Small delay to avoid rate limiting
              if (end < currentBlock) {
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            } catch (chunkError: any) {
              console.warn(`Failed to fetch chunk ${start}-${end}:`, chunkError.message);
              // Continue with next chunk instead of failing completely
            }
          }
        } else {
          // For limited periods: single query
          const incomingFilter = contract.filters.Transfer(null, account);
          incomingEvents = await contract.queryFilter(incomingFilter, fromBlock, currentBlock);

          const outgoingFilter = contract.filters.Transfer(account, null);
          outgoingEvents = await contract.queryFilter(outgoingFilter, fromBlock, currentBlock);
        }
      } catch (error: any) {
        if (error.message?.includes('exceed maximum block range')) {
          console.warn('Block range too large, using smaller range');
          // Fall back to limited range even for ALL mode
          const fallbackBlocks = 43200; // 1 day
          const fallbackFromBlock = Math.max(0, currentBlock - fallbackBlocks);
          
          const incomingFilter = contract.filters.Transfer(null, account);
          incomingEvents = await contract.queryFilter(incomingFilter, fallbackFromBlock, currentBlock);
          
          const outgoingFilter = contract.filters.Transfer(account, null);
          outgoingEvents = await contract.queryFilter(outgoingFilter, fallbackFromBlock, currentBlock);
        } else {
          throw error;
        }
      }

      // Combine and sort events by block number
      const allEvents = [...incomingEvents, ...outgoingEvents].sort((a, b) => 
        a.blockNumber - b.blockNumber
      );

      console.log(`Found ${allEvents.length} transfer events`);

      // Process events to create history points and transaction details
      const historyPoints: PortfolioHistoryPoint[] = [];
      const transactionDetails: TransactionDetail[] = [];
      let runningBalance = 0;

      // Get current balance for final calculation
      const currentBalance = await contract.balanceOf(account);
      const decimals = await contract.decimals();
      const finalBalance = parseFloat(formatUnits(currentBalance, decimals));

      // Add initial balance point if we have events
      if (allEvents.length > 0) {
        const firstBlock = await provider.getBlock(allEvents[0].blockNumber);
        if (firstBlock) {
          historyPoints.push({
            timestamp: firstBlock.timestamp * 1000,
            balance: 0, // Starting from 0 for simplicity
            blockNumber: allEvents[0].blockNumber,
          });
        }
      }

      // Process each event
      for (const event of allEvents) {
        const eventLog = event as EventLog;
        const block = await provider.getBlock(eventLog.blockNumber);
        if (!block) continue;

        const value = parseFloat(formatUnits(eventLog.args[2], decimals));
        const isIncoming = eventLog.args[1].toLowerCase() === account.toLowerCase();
        const fromAddress = eventLog.args[0];
        const toAddress = eventLog.args[1];
        
        if (isIncoming) {
          runningBalance += value;
        } else {
          runningBalance -= value;
        }

        // Determine transaction type
        let transactionType: 'transfer_in' | 'transfer_out' | 'claim' = isIncoming ? 'transfer_in' : 'transfer_out';
        if (isIncoming && fromAddress === '0x0000000000000000000000000000000000000000') {
          transactionType = 'claim'; // Minted tokens (claimed)
        }

        // Add to history points
        historyPoints.push({
          timestamp: block.timestamp * 1000,
          balance: runningBalance,
          blockNumber: eventLog.blockNumber,
          transactionHash: eventLog.transactionHash,
          transactionType,
          value,
          from: fromAddress,
          to: toAddress
        });

        // Add to transaction details
        transactionDetails.push({
          hash: eventLog.transactionHash,
          blockNumber: eventLog.blockNumber,
          timestamp: block.timestamp * 1000,
          from: fromAddress,
          to: toAddress,
          value,
          type: transactionType,
          formattedValue: value.toFixed(2)
        });
      }

      // Add current balance point
      if (historyPoints.length > 0) {
        const now = Date.now();
        historyPoints.push({
          timestamp: now,
          balance: finalBalance,
          blockNumber: currentBlock
        });
      } else {
        // No transaction history, just show current balance
        const now = Date.now();
        historyPoints.push({
          timestamp: now - 24 * 60 * 60 * 1000, // 24 hours ago
          balance: finalBalance,
          blockNumber: currentBlock
        });
        historyPoints.push({
          timestamp: now,
          balance: finalBalance,
          blockNumber: currentBlock
        });
      }

      return { historyPoints, transactionDetails };

    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return { historyPoints: [], transactionDetails: [] };
    }
  }, []);

  // Refresh history data
  const refreshHistory = useCallback(async () => {
    if (!account) {
      setHistoryData([]);
      setError(null);
      return;
    }

    const tokenAddress = getCurrencyContract(networkKey);
    if (!tokenAddress) {
      setError('Token contract not found for network');
      return;
    }

    // Check cache first
    const cacheKey = `${account}-${networkKey}`;
    const cachedData = cacheRef.current.get(cacheKey);
    if (cachedData && cachedData.length > 0) {
      setHistoryData(cachedData);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = await initializeProvider();
      if (!provider) {
        console.warn('No wallet provider available - using mock data');
        // Fall through to mock data generation below
        throw new Error('No wallet provider');
      }

      const { historyPoints, transactionDetails } = await getTransactionHistory(provider, tokenAddress, account, forceFullHistory || period === 'ALL');
      
      // Cache the result
      cacheRef.current.set(cacheKey, historyPoints);
      
      setHistoryData(historyPoints);
      setTransactions(transactionDetails);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Failed to refresh history:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`履歴データの取得に失敗しました: ${errorMessage}`);
      
      // If we can't get real data, create mock data for demonstration
      const now = Date.now();
      const mockData: PortfolioHistoryPoint[] = [
        { timestamp: now - 6 * 24 * 60 * 60 * 1000, balance: 0, blockNumber: 0 },
        { timestamp: now - 5 * 24 * 60 * 60 * 1000, balance: 1000, blockNumber: 1, transactionType: 'claim', value: 1000, from: '0x0000000000000000000000000000000000000000', to: account || '' },
        { timestamp: now - 3 * 24 * 60 * 60 * 1000, balance: 850, blockNumber: 2, transactionType: 'transfer_out', value: 150, from: account || '', to: '0x742d35Cc6639C99532C2e9b9a81c0D2dF4f1d8f9' },
        { timestamp: now - 1 * 24 * 60 * 60 * 1000, balance: 920, blockNumber: 3, transactionType: 'transfer_in', value: 70, from: '0x742d35Cc6639C99532C2e9b9a81c0D2dF4f1d8f9', to: account || '' },
        { timestamp: now, balance: 920, blockNumber: 4 }
      ];
      
      const mockTransactions: TransactionDetail[] = [
        {
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          blockNumber: 1,
          timestamp: now - 5 * 24 * 60 * 60 * 1000,
          from: '0x0000000000000000000000000000000000000000',
          to: account || '',
          value: 1000,
          type: 'claim',
          formattedValue: '1000.00'
        },
        {
          hash: '0x2234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          blockNumber: 2,
          timestamp: now - 3 * 24 * 60 * 60 * 1000,
          from: account || '',
          to: '0x742d35Cc6639C99532C2e9b9a81c0D2dF4f1d8f9',
          value: 150,
          type: 'transfer_out',
          formattedValue: '150.00'
        },
        {
          hash: '0x3234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          blockNumber: 3,
          timestamp: now - 1 * 24 * 60 * 60 * 1000,
          from: '0x742d35Cc6639C99532C2e9b9a81c0D2dF4f1d8f9',
          to: account || '',
          value: 70,
          type: 'transfer_in',
          formattedValue: '70.00'
        }
      ];
      
      setHistoryData(mockData);
      setTransactions(mockTransactions);
      console.log('Using mock data for portfolio history demonstration');
    } finally {
      setIsLoading(false);
    }
  }, [account, networkKey, initializeProvider, getTransactionHistory]);

  // Filter data by period
  const filteredData = useCallback(() => {
    if (period === 'ALL') return historyData;
    
    const now = Date.now();
    const timeframes = {
      '1D': 24 * 60 * 60 * 1000,
      '1W': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000
    };
    
    const cutoff = now - timeframes[period];
    return historyData.filter(point => point.timestamp >= cutoff);
  }, [historyData, period]);

  // Calculate P&L
  const profitLoss = useCallback(() => {
    const data = filteredData();
    if (data.length < 2) {
      return { total: 0, percentage: 0, period };
    }
    
    const firstBalance = data[0].balance;
    const lastBalance = data[data.length - 1].balance;
    const total = lastBalance - firstBalance;
    const percentage = firstBalance > 0 ? (total / firstBalance) * 100 : 0;
    
    return { total, percentage, period };
  }, [filteredData, period]);

  // Load history on mount and account/network change
  useEffect(() => {
    if (account && networkKey) {
      refreshHistory();
    }
  }, [account, networkKey, period, refreshHistory]); // Add period dependency to refresh when period changes

  return {
    historyData: filteredData(),
    transactions,
    isLoading,
    error,
    lastUpdated,
    refreshHistory,
    profitLoss: profitLoss(),
    setPeriod
  };
}