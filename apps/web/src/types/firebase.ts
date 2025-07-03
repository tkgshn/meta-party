import { Timestamp } from 'firebase/firestore';

// User document schema
export interface UserDoc {
  walletAddress: string;
  claimed: boolean;
  createdAt: Timestamp;
}

// Market document schema
export interface MarketDoc {
  title: string;
  kpiDescription: string;
  deadline: Timestamp;
  resolutionTime: Timestamp;
  factoryAddress: string;
  marketAddress: string;
  status: 'TRADING' | 'CLOSED' | 'RESOLVED';
}

// Proposal document schema
export interface ProposalDoc {
  marketId: string; // FK to markets collection
  title: string;
  details: string;
  outcomeIndex: number;
  createdBy: string; // uid
}

// Trade document schema
export interface TradeDoc {
  marketId: string; // FK to markets collection
  proposalId: string; // FK to proposals collection
  uid: string; // FK to users collection
  amount: string; // Play Token amount
  cost: string; // Conditional Token amount
  txHash: string;
  timestamp: Timestamp;
}

// Firebase collection names
export const COLLECTIONS = {
  USERS: 'users',
  MARKETS: 'markets',
  PROPOSALS: 'proposals',
  TRADES: 'trades',
} as const;