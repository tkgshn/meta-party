'use client';

import { useEffect, useState } from 'react';

export default function EnvironmentDebug() {
  const [env, setEnv] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check environment variables
    setEnv({
      NEXT_PUBLIC_PLAY_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_PLAY_TOKEN_ADDRESS || 'NOT_SET',
      NEXT_PUBLIC_MARKET_FACTORY_ADDRESS: process.env.NEXT_PUBLIC_MARKET_FACTORY_ADDRESS || 'NOT_SET',
      NEXT_PUBLIC_CONDITIONAL_TOKENS_ADDRESS: process.env.NEXT_PUBLIC_CONDITIONAL_TOKENS_ADDRESS || 'NOT_SET',
      NEXT_PUBLIC_POLYGON_AMOY_RPC_URL: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'NOT_SET',
    });
  }, []);

  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <h3 className="font-bold mb-2">Environment Debug</h3>
      <div className="space-y-1 text-sm font-mono">
        {Object.entries(env).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-gray-600">{key}:</span>
            <span className={value === 'NOT_SET' ? 'text-red-600' : 'text-green-600'}>
              {value === 'NOT_SET' ? 'NOT_SET' : value.slice(0, 10) + '...'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}