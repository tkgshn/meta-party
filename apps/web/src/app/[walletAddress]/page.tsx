'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePlayToken } from '@/hooks/usePlayToken';
import Header from '@/components/Header';

export default function UserProfilePage() {
  const params = useParams();
  const walletAddress = params.walletAddress as string;

  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts) => {
          const accountsArray = accounts as string[];
          if (accountsArray.length > 0) {
            setAccount(accountsArray[0]);
          }
        });
    }
  }, []);

  const { balance } = usePlayToken(walletAddress);

  return (
    <>
      <Header/>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">User Profile</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Wallet Information</h2>
          <p className="text-gray-700"><strong>Wallet Address:</strong> {walletAddress}</p>
          <p className="text-gray-700"><strong>Play Token Balance:</strong> {Number(balance).toLocaleString()} PT</p>
        </div>
      </div>
    </>
  );
}
