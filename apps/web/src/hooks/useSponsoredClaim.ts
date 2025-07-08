import { useState } from 'react';

interface SponsoredClaimResult {
  success: boolean;
  txHash?: string;
  error?: string;
  message?: string;
  blockNumber?: number;
}

interface SponsoredClaimHook {
  claimSponsored: (userAddress: string) => Promise<SponsoredClaimResult>;
  isLoading: boolean;
  error: string | null;
}

export function useSponsoredClaim(): SponsoredClaimHook {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const claimSponsored = async (userAddress: string): Promise<SponsoredClaimResult> => {
    if (!userAddress) {
      return { success: false, error: 'User address is required' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/claim-sponsored', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: userAddress,
        }),
      });

      const result: SponsoredClaimResult = await response.json();

      if (!response.ok) {
        setError(result.error || 'Sponsored claim failed');
        return result;
      }

      setError(null);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    claimSponsored,
    isLoading,
    error,
  };
}