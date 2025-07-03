import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { ethers } from 'ethers';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

/**
 * HTTP function to handle market closing
 * Triggered by Cloud Scheduler or manually
 */
export const closeExpiredMarkets = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    
    try {
      // Find markets that should be closed
      const marketsQuery = await db
        .collection('markets')
        .where('status', '==', 'TRADING')
        .where('deadline', '<=', now)
        .get();

      const batch = db.batch();
      const marketUpdates: Promise<any>[] = [];

      marketsQuery.docs.forEach((doc) => {
        const marketData = doc.data();
        
        // Update market status to CLOSED
        batch.update(doc.ref, { status: 'CLOSED' });
        
        // Call smart contract to close trading (if connected to blockchain)
        if (marketData.marketAddress) {
          marketUpdates.push(closeMarketOnChain(marketData.marketAddress));
        }
      });

      // Commit batch update
      await batch.commit();
      
      // Execute blockchain transactions
      await Promise.all(marketUpdates);

      functions.logger.info(`Closed ${marketsQuery.docs.length} expired markets`);
      
      return { success: true, closed: marketsQuery.docs.length };
    } catch (error) {
      functions.logger.error('Error closing expired markets:', error);
      throw error;
    }
  });

/**
 * Close market on blockchain
 */
async function closeMarketOnChain(marketAddress: string): Promise<void> {
  if (!process.env.POLYGON_RPC_URL || !process.env.ORACLE_PRIVATE_KEY) {
    functions.logger.warn('Blockchain configuration missing, skipping on-chain close');
    return;
  }

  try {
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    const wallet = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY, provider);
    
    // Market contract ABI (simplified)
    const marketABI = [
      'function closeTrading() external',
      'function phase() external view returns (uint8)'
    ];
    
    const market = new ethers.Contract(marketAddress, marketABI, wallet);
    
    // Check if market is still in TRADING phase
    const phase = await market.phase();
    if (phase === 0) { // TRADING = 0
      const tx = await market.closeTrading();
      await tx.wait();
      functions.logger.info(`Market ${marketAddress} closed on-chain: ${tx.hash}`);
    }
  } catch (error) {
    functions.logger.error(`Error closing market ${marketAddress} on-chain:`, error);
    throw error;
  }
}

/**
 * HTTP function to create a new user document when wallet connects
 */
export const createUser = functions.https.onCall(async (data, context) => {
  const { walletAddress } = data;
  
  if (!walletAddress) {
    throw new functions.https.HttpsError('invalid-argument', 'Wallet address is required');
  }

  // Check if user already exists
  const userRef = db.collection('users').doc(walletAddress.toLowerCase());
  const userDoc = await userRef.get();

  if (userDoc.exists) {
    return { exists: true, user: userDoc.data() };
  }

  // Create new user document
  const userData = {
    walletAddress: walletAddress.toLowerCase(),
    claimed: false,
    createdAt: admin.firestore.Timestamp.now(),
  };

  await userRef.set(userData);

  functions.logger.info(`Created user document for wallet: ${walletAddress}`);
  
  return { exists: false, user: userData };
});

/**
 * HTTP function to record a trade
 */
export const recordTrade = functions.https.onCall(async (data, context) => {
  const { marketId, proposalId, uid, amount, cost, txHash } = data;
  
  if (!marketId || !proposalId || !uid || !amount || !cost || !txHash) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required trade data');
  }

  const tradeData = {
    marketId,
    proposalId,
    uid,
    amount,
    cost,
    txHash,
    timestamp: admin.firestore.Timestamp.now(),
  };

  const tradeRef = await db.collection('trades').add(tradeData);

  functions.logger.info(`Recorded trade: ${tradeRef.id}`);
  
  return { tradeId: tradeRef.id };
});

/**
 * HTTP function to resolve a market (admin only)
 */
export const resolveMarket = functions.https.onCall(async (data, context) => {
  const { marketId, winningOutcome } = data;
  
  if (!marketId || winningOutcome === undefined) {
    throw new functions.https.HttpsError('invalid-argument', 'Market ID and winning outcome are required');
  }

  // TODO: Add admin authentication check
  // if (!context.auth || !isAdmin(context.auth.uid)) {
  //   throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  // }

  const marketRef = db.collection('markets').doc(marketId);
  const marketDoc = await marketRef.get();

  if (!marketDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Market not found');
  }

  const marketData = marketDoc.data();
  
  if (marketData?.status !== 'CLOSED') {
    throw new functions.https.HttpsError('failed-precondition', 'Market must be closed before resolution');
  }

  // Update market status to RESOLVED
  await marketRef.update({
    status: 'RESOLVED',
    winningOutcome,
    resolvedAt: admin.firestore.Timestamp.now(),
  });

  // Call smart contract to resolve market
  if (marketData?.marketAddress) {
    await resolveMarketOnChain(marketData.marketAddress, winningOutcome);
  }

  functions.logger.info(`Resolved market ${marketId} with winning outcome ${winningOutcome}`);
  
  return { success: true };
});

/**
 * Resolve market on blockchain
 */
async function resolveMarketOnChain(marketAddress: string, winningOutcome: number): Promise<void> {
  if (!process.env.POLYGON_RPC_URL || !process.env.ORACLE_PRIVATE_KEY) {
    functions.logger.warn('Blockchain configuration missing, skipping on-chain resolution');
    return;
  }

  try {
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
    const wallet = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY, provider);
    
    // Market contract ABI (simplified)
    const marketABI = [
      'function resolve(uint256 winningOutcome) external',
      'function phase() external view returns (uint8)'
    ];
    
    const market = new ethers.Contract(marketAddress, marketABI, wallet);
    
    // Check if market is in CLOSED phase
    const phase = await market.phase();
    if (phase === 1) { // CLOSED = 1
      const tx = await market.resolve(winningOutcome);
      await tx.wait();
      functions.logger.info(`Market ${marketAddress} resolved on-chain: ${tx.hash}`);
    }
  } catch (error) {
    functions.logger.error(`Error resolving market ${marketAddress} on-chain:`, error);
    throw error;
  }
}