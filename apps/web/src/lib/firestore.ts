import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  serverTimestamp,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

// Type definitions for Firestore documents
export interface User {
  // Document ID is twitter_id
  walletAddress: string;
  authProvider: 'twitter' | 'magic_twitter';
  
  twitter: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl?: string;
    verified?: boolean;
  };
  
  magicAuth?: {
    issuer: string;
    publicAddress: string;
    createdAt?: string;
    lastLoginAt?: string;
  };
  
  claims: {
    baseAirdrop: {
      claimed: boolean;
      claimedAt?: Timestamp;
      txHash?: string;
      amount: number;
    };
    volunteerBonus: {
      claimed: boolean;
      claimedAt?: Timestamp;
      txHash?: string;
      amount: number;
    };
  };
  
  roles: {
    isVolunteer: boolean;
    isMarketCreator: boolean;
    isAdmin: boolean;
  };
  
  privacy?: {
    isPublic?: boolean; // デフォルトはtrue（公開）
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
  
  email?: string;
  preferences?: {
    language: 'ja' | 'en';
    notifications: boolean;
    newsletter: boolean;
  };
  
  metadata?: {
    referralCode?: string;
    signupSource?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface DistributionTransaction {
  twitterId: string;
  walletAddress: string;
  
  type: 'base_airdrop' | 'volunteer_bonus' | 'custom' | 'admin_mint';
  amountPT: number;
  reason?: string;
  
  txHash?: string;
  blockNumber?: number;
  gasUsed?: number;
  
  status: 'pending' | 'confirmed' | 'failed';
  errorMessage?: string;
  
  createdAt: Timestamp;
  confirmedAt?: Timestamp;
  createdBy: string;
  
  network: 'sepolia' | 'polygon' | 'amoy';
  chainId: number;
}

export interface MarketCreator {
  twitterId: string;
  walletAddress: string;
  
  profile: {
    name: string;
    organization?: string;
    bio?: string;
    website?: string;
    specialization?: string[];
  };
  
  permissions: {
    canCreateMarkets: boolean;
    canResolveMarkets: boolean;
    maxMarketsPerMonth: number;
    categories?: string[];
  };
  
  status: 'active' | 'suspended' | 'revoked';
  
  approval: {
    approvedBy: string;
    approvedAt: Timestamp;
    reviewNotes?: string;
  };
  
  stats: {
    marketsCreated: number;
    marketsResolved: number;
    accuracyRate?: number;
    totalVolume?: number;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OAuthState {
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  
  linkingWalletAddress?: string;
  linkingFlow: boolean;
  
  expiresAt: Timestamp;
  createdAt: Timestamp;
  
  challengeHash?: string;
}

export interface ClaimAttempt {
  twitterId?: string;
  walletAddress?: string;
  ipAddress: string;
  
  attemptType: 'base_airdrop' | 'volunteer_bonus';
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  
  userAgent: string;
  sessionId?: string;
  
  createdAt: Timestamp;
  
  location?: {
    country?: string;
    region?: string;
  };
}

// Database operations
export class FirestoreService {
  
  // User operations
  static async createUser(twitterId: string, userData: Omit<User, 'createdAt' | 'updatedAt' | 'lastLoginAt'>): Promise<void> {
    const userRef = doc(db, 'users', twitterId);
    const now = serverTimestamp();
    
    await setDoc(userRef, {
      ...userData,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    });
  }
  
  static async getUser(twitterId: string): Promise<User | null> {
    const userRef = doc(db, 'users', twitterId);
    const userSnap = await getDoc(userRef);
    
    return userSnap.exists() ? userSnap.data() as User : null;
  }
  
  static async getUserByWalletAddress(walletAddress: string): Promise<User | null> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('walletAddress', '==', walletAddress.toLowerCase()),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const userDoc = querySnapshot.docs[0];
      return userDoc.data() as User;
    } catch (error) {
      console.error('Error fetching user by wallet address:', error);
      return null;
    }
  }
  
  static async updateUser(twitterId: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', twitterId);
    
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }
  
  static async updateLastLogin(twitterId: string): Promise<void> {
    const userRef = doc(db, 'users', twitterId);
    
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  
  // Claim operations with atomic transactions
  static async claimBaseAirdrop(
    twitterId: string,
    walletAddress: string,
    txHash: string,
    amount: number = 1000
  ): Promise<boolean> {
    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', twitterId);
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data() as User;
      
      if (userData.claims.baseAirdrop.claimed) {
        throw new Error('Base airdrop already claimed');
      }
      
      // Update user claim status
      transaction.update(userRef, {
        'claims.baseAirdrop.claimed': true,
        'claims.baseAirdrop.claimedAt': serverTimestamp(),
        'claims.baseAirdrop.txHash': txHash,
        'claims.baseAirdrop.amount': amount,
        updatedAt: serverTimestamp(),
      });
      
      // Create distribution transaction record
      const distributionRef = doc(collection(db, 'distributionTransactions'));
      transaction.set(distributionRef, {
        twitterId,
        walletAddress,
        type: 'base_airdrop',
        amountPT: amount,
        reason: 'Base airdrop claim',
        txHash,
        status: 'pending',
        createdAt: serverTimestamp(),
        createdBy: 'system',
        network: 'sepolia',
        chainId: 11155111,
      } as Omit<DistributionTransaction, 'createdAt' | 'confirmedAt'>);
      
      return true;
    });
  }
  
  static async claimVolunteerBonus(
    twitterId: string,
    walletAddress: string,
    txHash: string,
    amount: number = 2000
  ): Promise<boolean> {
    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', twitterId);
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data() as User;
      
      if (!userData.roles.isVolunteer) {
        throw new Error('User is not a volunteer');
      }
      
      if (userData.claims.volunteerBonus.claimed) {
        throw new Error('Volunteer bonus already claimed');
      }
      
      // Update user claim status
      transaction.update(userRef, {
        'claims.volunteerBonus.claimed': true,
        'claims.volunteerBonus.claimedAt': serverTimestamp(),
        'claims.volunteerBonus.txHash': txHash,
        'claims.volunteerBonus.amount': amount,
        updatedAt: serverTimestamp(),
      });
      
      // Create distribution transaction record
      const distributionRef = doc(collection(db, 'distributionTransactions'));
      transaction.set(distributionRef, {
        twitterId,
        walletAddress,
        type: 'volunteer_bonus',
        amountPT: amount,
        reason: 'Volunteer bonus claim',
        txHash,
        status: 'pending',
        createdAt: serverTimestamp(),
        createdBy: 'system',
        network: 'sepolia',
        chainId: 11155111,
      } as Omit<DistributionTransaction, 'createdAt' | 'confirmedAt'>);
      
      return true;
    });
  }
  
  // Distribution transaction operations
  static async createDistributionTransaction(
    transactionData: Omit<DistributionTransaction, 'createdAt' | 'confirmedAt'>
  ): Promise<string> {
    const transactionRef = await addDoc(collection(db, 'distributionTransactions'), {
      ...transactionData,
      createdAt: serverTimestamp(),
    });
    
    return transactionRef.id;
  }
  
  static async updateTransactionStatus(
    transactionId: string,
    status: 'confirmed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    const transactionRef = doc(db, 'distributionTransactions', transactionId);
    
    const updates: any = {
      status,
      updatedAt: serverTimestamp(),
    };
    
    if (status === 'confirmed') {
      updates.confirmedAt = serverTimestamp();
    }
    
    if (errorMessage) {
      updates.errorMessage = errorMessage;
    }
    
    await updateDoc(transactionRef, updates);
  }
  
  // OAuth state operations
  static async createOAuthState(
    stateToken: string,
    stateData: Omit<OAuthState, 'createdAt' | 'expiresAt'>
  ): Promise<void> {
    const stateRef = doc(db, 'oauthStates', stateToken);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes expiration
    
    await setDoc(stateRef, {
      ...stateData,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
    });
  }
  
  static async getOAuthState(stateToken: string): Promise<OAuthState | null> {
    const stateRef = doc(db, 'oauthStates', stateToken);
    const stateSnap = await getDoc(stateRef);
    
    if (!stateSnap.exists()) {
      return null;
    }
    
    const stateData = stateSnap.data() as OAuthState;
    
    // Check if expired
    if (stateData.expiresAt.toDate() < new Date()) {
      // Delete expired state
      await setDoc(stateRef, {}, { merge: false });
      return null;
    }
    
    return stateData;
  }
  
  static async deleteOAuthState(stateToken: string): Promise<void> {
    const stateRef = doc(db, 'oauthStates', stateToken);
    await setDoc(stateRef, {}, { merge: false });
  }
  
  // Claim attempt logging for rate limiting
  static async logClaimAttempt(
    attemptData: Omit<ClaimAttempt, 'createdAt'>
  ): Promise<void> {
    await addDoc(collection(db, 'claimAttempts'), {
      ...attemptData,
      createdAt: serverTimestamp(),
    });
  }
  
  // Rate limiting check
  static async checkRateLimit(
    ipAddress: string,
    attemptType: 'base_airdrop' | 'volunteer_bonus',
    windowMinutes: number = 5,
    maxAttempts: number = 3
  ): Promise<boolean> {
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);
    
    const attemptsQuery = query(
      collection(db, 'claimAttempts'),
      where('ipAddress', '==', ipAddress),
      where('attemptType', '==', attemptType),
      where('createdAt', '>=', Timestamp.fromDate(windowStart)),
      orderBy('createdAt', 'desc'),
      limit(maxAttempts + 1)
    );
    
    const attemptsSnap = await getDocs(attemptsQuery);
    
    return attemptsSnap.size < maxAttempts;
  }
  
  // Market creator operations
  static async createMarketCreator(
    twitterId: string,
    creatorData: Omit<MarketCreator, 'createdAt' | 'updatedAt' | 'stats'>
  ): Promise<void> {
    const creatorRef = doc(db, 'marketCreators', twitterId);
    
    await setDoc(creatorRef, {
      ...creatorData,
      stats: {
        marketsCreated: 0,
        marketsResolved: 0,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  
  static async getMarketCreator(twitterId: string): Promise<MarketCreator | null> {
    const creatorRef = doc(db, 'marketCreators', twitterId);
    const creatorSnap = await getDoc(creatorRef);
    
    return creatorSnap.exists() ? creatorSnap.data() as MarketCreator : null;
  }
  
  // Analytics and reporting
  static async getAirdropAnalytics(): Promise<{
    totalUsers: number;
    baseClaimedCount: number;
    bonusClaimedCount: number;
    volunteerCount: number;
    marketCreatorCount: number;
  }> {
    const usersQuery = query(collection(db, 'users'));
    const usersSnap = await getDocs(usersQuery);
    
    let totalUsers = 0;
    let baseClaimedCount = 0;
    let bonusClaimedCount = 0;
    let volunteerCount = 0;
    let marketCreatorCount = 0;
    
    usersSnap.forEach((doc) => {
      const userData = doc.data() as User;
      totalUsers++;
      
      if (userData.claims.baseAirdrop.claimed) baseClaimedCount++;
      if (userData.claims.volunteerBonus.claimed) bonusClaimedCount++;
      if (userData.roles.isVolunteer) volunteerCount++;
      if (userData.roles.isMarketCreator) marketCreatorCount++;
    });
    
    return {
      totalUsers,
      baseClaimedCount,
      bonusClaimedCount,
      volunteerCount,
      marketCreatorCount,
    };
  }
  
  // Cleanup operations
  static async cleanupExpiredOAuthStates(): Promise<number> {
    const expiredQuery = query(
      collection(db, 'oauthStates'),
      where('expiresAt', '<', Timestamp.now())
    );
    
    const expiredSnap = await getDocs(expiredQuery);
    const batch = writeBatch(db);
    
    expiredSnap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    return expiredSnap.size;
  }
}

export default FirestoreService;