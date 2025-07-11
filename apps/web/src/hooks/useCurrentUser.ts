import { useState, useEffect } from 'react';

interface CurrentUser {
  twitterId?: string;
  twitterUsername?: string;
  displayName?: string;
  walletAddress?: string;
  isNewUser?: boolean;
  authenticated: boolean;
  isLoading: boolean;
  error?: string;
}

export function useCurrentUser(): CurrentUser {
  const [user, setUser] = useState<CurrentUser>({
    isLoading: true,
    authenticated: false
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include', // Include cookies
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Not authenticated
            setUser({ isLoading: false, authenticated: false });
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();
        setUser({
          ...userData,
          isLoading: false
        });
      } catch (error) {
        console.error('Error fetching user info:', error);
        setUser({ 
          isLoading: false,
          authenticated: false,
          error: 'Failed to load user info'
        });
      }
    };

    fetchUserInfo();
  }, []);

  return user;
}