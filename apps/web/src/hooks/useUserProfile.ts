import { useState, useEffect } from 'react';

interface UserProfile {
  walletAddress: string;
  hasProfile: boolean;
  twitterUsername?: string;
  displayName?: string;
  profileImage?: string;
  lastUpdated?: string;
}

export function useUserProfile(address: string | null) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setUserProfile(null);
      setError(null);
      return;
    }

    const fetchUserProfile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/user/${address}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setUserProfile(data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch user profile');
        setUserProfile({
          walletAddress: address,
          hasProfile: false
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [address]);

  return {
    userProfile,
    isLoading,
    error,
    refetch: () => {
      if (address) {
        const fetchUserProfile = async () => {
          setIsLoading(true);
          setError(null);

          try {
            const response = await fetch(`/api/user/${address}`);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setUserProfile(data);
          } catch (error) {
            console.error('Error fetching user profile:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch user profile');
            setUserProfile({
              walletAddress: address,
              hasProfile: false
            });
          } finally {
            setIsLoading(false);
          }
        };

        fetchUserProfile();
      }
    }
  };
}