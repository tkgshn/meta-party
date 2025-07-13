'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { 
  ArrowTopRightOnSquareIcon, 
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentDuplicateIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';

interface Transaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: number;
  type: 'claim' | 'transfer_in' | 'transfer_out';
  formattedValue: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  currentAddress: string;
  isLoading?: boolean;
  blockExplorerUrl?: string;
}

export default function TransactionHistory({ 
  transactions, 
  currentAddress, 
  isLoading = false,
  blockExplorerUrl = 'https://sepolia.etherscan.io'
}: TransactionHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Show only recent 5 transactions by default
  const displayTransactions = isExpanded ? transactions : transactions.slice(0, 5);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(text);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getTransactionTypeIcon = (type: 'claim' | 'transfer_in' | 'transfer_out') => {
    switch (type) {
      case 'claim':
        return '🎁';
      case 'transfer_in':
        return '📈';
      case 'transfer_out':
        return '📉';
      default:
        return '💰';
    }
  };

  const getTransactionTypeLabel = (type: 'claim' | 'transfer_in' | 'transfer_out') => {
    switch (type) {
      case 'claim':
        return 'Claim';
      case 'transfer_in':
        return 'Received';
      case 'transfer_out':
        return 'Sent';
      default:
        return 'Transfer';
    }
  };

  const getTransactionTypeColor = (type: 'claim' | 'transfer_in' | 'transfer_out') => {
    switch (type) {
      case 'claim':
        return 'text-blue-600 bg-blue-50';
      case 'transfer_in':
        return 'text-green-600 bg-green-50';
      case 'transfer_out':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-20 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transactions.length) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
          </div>
          <div className="text-center py-8">
            <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <DocumentDuplicateIcon className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No transactions found</p>
            <p className="text-gray-400 text-sm mt-1">
              Transactions will appear here once activity occurs
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>{transactions.length} transactions</span>
          </div>
        </div>

        {/* Transaction List */}
        <div className="space-y-0">
          {displayTransactions.map((tx, index) => (
            <div 
              key={tx.hash} 
              className={`flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${index === 0 ? 'pt-0' : ''}`}
            >
              {/* Left side - Type and details */}
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getTransactionTypeColor(tx.type)}`}>
                    {getTransactionTypeIcon(tx.type)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {getTransactionTypeLabel(tx.type)}
                    </span>
                    {tx.type !== 'claim' && (
                      <span className="text-gray-500 text-sm">
                        {tx.type === 'transfer_in' ? 'from' : 'to'} {formatAddress(tx.type === 'transfer_in' ? tx.from : tx.to)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{format(new Date(tx.timestamp), 'MMM d, yyyy h:mm a')}</span>
                    <div className="flex items-center space-x-1">
                      <span>Block</span>
                      <span className="font-mono">{tx.blockNumber.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Value and actions */}
              <div className="flex items-center space-x-3 flex-shrink-0">
                <div className="text-right">
                  <div className={`font-semibold ${
                    tx.type === 'transfer_out' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {tx.type === 'transfer_out' ? '-' : '+'}{tx.formattedValue} PT
                  </div>
                </div>

                {/* Transaction hash and external link */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(tx.hash)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy transaction hash"
                  >
                    {copiedHash === tx.hash ? (
                      <CheckIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    )}
                  </button>
                  
                  <a
                    href={`${blockExplorerUrl}/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    title="View on block explorer"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show more/less button */}
        {transactions.length > 5 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              {isExpanded ? (
                <>
                  <ChevronUpIcon className="h-4 w-4" />
                  <span>Show Less</span>
                </>
              ) : (
                <>
                  <ChevronDownIcon className="h-4 w-4" />
                  <span>Show All {transactions.length} Transactions</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
          <p>Transaction data is fetched from on-chain events</p>
        </div>
      </CardContent>
    </Card>
  );
}