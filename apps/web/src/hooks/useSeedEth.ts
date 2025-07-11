import { useState } from 'react';

interface SeedEthResult {
  success: boolean;
  txHash?: string;
  error?: string;
  message?: string;
  blockNumber?: number;
  userBalance?: string;
}

interface SeedEthHook {
  seedEth: (userAddress: string, twitterId?: string) => Promise<SeedEthResult>;
  isLoading: boolean;
  error: string | null;
}

export function useSeedEth(): SeedEthHook {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seedEth = async (userAddress: string, twitterId?: string): Promise<SeedEthResult> => {
    if (!userAddress) {
      return { success: false, error: 'User address is required' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/seed-eth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress,
          twitterId,
        }),
      });

      const result: SeedEthResult = await response.json();

      if (!response.ok) {
        setError(result.error || 'Seed ETH failed');
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
    seedEth,
    isLoading,
    error,
  };
}