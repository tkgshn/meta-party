/**
 * Local storage utilities for managing claim status across browsers
 */

export interface ClaimStatus {
  hasClaimed: boolean;
  claimDate?: string;
  txHash?: string;
  twitterId?: string;
  walletAddress: string;
  networkKey: string;
}

const CLAIM_STORAGE_KEY = 'futarchy-claim-status';

/**
 * Get claim status from localStorage
 */
export function getClaimStatus(walletAddress: string, networkKey: string): ClaimStatus | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(CLAIM_STORAGE_KEY);
    if (!stored) return null;
    
    const claimData = JSON.parse(stored) as Record<string, ClaimStatus>;
    const key = `${walletAddress.toLowerCase()}-${networkKey}`;
    
    return claimData[key] || null;
  } catch (error) {
    console.error('Error getting claim status:', error);
    return null;
  }
}

/**
 * Set claim status in localStorage
 */
export function setClaimStatus(status: ClaimStatus): void {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(CLAIM_STORAGE_KEY);
    const claimData = stored ? JSON.parse(stored) : {};
    
    const key = `${status.walletAddress.toLowerCase()}-${status.networkKey}`;
    claimData[key] = {
      ...status,
      claimDate: status.claimDate || new Date().toISOString()
    };
    
    localStorage.setItem(CLAIM_STORAGE_KEY, JSON.stringify(claimData));
  } catch (error) {
    console.error('Error setting claim status:', error);
  }
}

/**
 * Clear all claim status (for testing purposes)
 */
export function clearClaimStatus(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(CLAIM_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing claim status:', error);
  }
}

/**
 * Check if user has claimed on any network/wallet combination
 */
export function hasClaimedAnywhere(twitterId?: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const stored = localStorage.getItem(CLAIM_STORAGE_KEY);
    if (!stored) return false;
    
    const claimData = JSON.parse(stored) as Record<string, ClaimStatus>;
    
    // If we have a Twitter ID, check if any claims are associated with it
    if (twitterId) {
      return Object.values(claimData).some(status => 
        status.twitterId === twitterId && status.hasClaimed
      );
    }
    
    // Otherwise, check if any claims exist
    return Object.values(claimData).some(status => status.hasClaimed);
  } catch (error) {
    console.error('Error checking claim status:', error);
    return false;
  }
}