'use client';

import { useParams } from 'next/navigation';

export default function UserProfilePage() {
  const params = useParams();
  const walletAddress = params.walletAddress as string;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">プロフィール</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">アカウント情報</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">ウォレットアドレス</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 break-all">{walletAddress}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
