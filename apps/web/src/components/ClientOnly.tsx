'use client';

import { useState, useEffect, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * ClientOnly component to prevent hydration mismatches
 * Based on patterns used by Uniswap, OpenSea, and other major DApps
 * 
 * This wrapper ensures components only render on the client side,
 * preventing SSR/hydration issues with wallet connections and dynamic content
 */
export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}