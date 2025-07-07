'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { usePlayToken } from '@/hooks/usePlayToken';
import Header from '@/components/Header';

export default function UserProfilePage() {
  const params = useParams();
  const walletAddress = params.walletAddress as string;

  // const [account] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts) => {
          const accountsArray = accounts as string[];
          if (accountsArray.length > 0) {
            // setAccount(accountsArray[0]);
            console.log('Connected account:', accountsArray[0]);
          }
        });
    }
  }, []);

  const { balance } = usePlayToken(walletAddress);

  return (
    <>
      <Header/>
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">ユーザープロフィール</h1>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">ウォレット情報</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">ウォレットアドレス</span>
                <span className="font-mono text-sm text-gray-900">{walletAddress}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600">Play Token 残高</span>
                <span className="text-xl font-semibold text-blue-600">{Number(balance).toLocaleString()} PT</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
