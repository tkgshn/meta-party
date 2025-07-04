'use client';

import { useParams } from 'next/navigation';

export default function UserProfilePage() {
  const params = useParams();
  const walletAddress = params.walletAddress as string;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">User Profile</h1>
      <p>Wallet Address: {walletAddress}</p>
    </div>
  );
}
