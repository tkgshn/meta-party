'use client';

import { useState } from 'react';
import Header from '@/components/Header';

/**
 * Manual test page for Header component
 * This page allows visual testing of all Header features
 */
export default function TestHeaderPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [testLog, setTestLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setTestLog(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev]);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    addLog(`Search query: "${query}"`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSearch={handleSearch} searchQuery={searchQuery} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Header Component Test Page</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Checklist */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Checklist</h2>
            <div className="space-y-3">
              <label className="flex items-start space-x-2">
                <input type="checkbox" className="mt-1" />
                <div>
                  <div className="font-medium">Portfolio & Cash Display (PT Symbol)</div>
                  <div className="text-sm text-gray-600">
                    ✓ Shows "PT" for all networks (not MATIC/SEP)<br />
                    ✓ Displays at header level (not in dropdown)<br />
                    ✓ Links to /portfolio page
                  </div>
                </div>
              </label>
              
              <label className="flex items-start space-x-2">
                <input type="checkbox" className="mt-1" />
                <div>
                  <div className="font-medium">Play Token Claim Button</div>
                  <div className="text-sm text-gray-600">
                    ✓ Only visible on Polygon Amoy network<br />
                    ✓ Only shows for users who haven't claimed<br />
                    ✓ Shows "1,000 PT受け取る"<br />
                    ✓ Auto-adds PT to MetaMask after claim
                  </div>
                </div>
              </label>
              
              <label className="flex items-start space-x-2">
                <input type="checkbox" className="mt-1" />
                <div>
                  <div className="font-medium">PT Add to MetaMask Button</div>
                  <div className="text-sm text-gray-600">
                    ✓ Shows "PT追加" on Polygon Amoy<br />
                    ✓ Hidden on other networks
                  </div>
                </div>
              </label>
              
              <label className="flex items-start space-x-2">
                <input type="checkbox" className="mt-1" />
                <div>
                  <div className="font-medium">Error Handling</div>
                  <div className="text-sm text-gray-600">
                    ✓ Gas shortage shows faucet link<br />
                    ✓ Other errors show clear messages
                  </div>
                </div>
              </label>
              
              <label className="flex items-start space-x-2">
                <input type="checkbox" className="mt-1" />
                <div>
                  <div className="font-medium">No Auto-loading</div>
                  <div className="text-sm text-gray-600">
                    ✓ Balance doesn't auto-refresh on page load<br />
                    ✓ Only refreshes on user interaction
                  </div>
                </div>
              </label>
              
              <label className="flex items-start space-x-2">
                <input type="checkbox" className="mt-1" />
                <div>
                  <div className="font-medium">Admin Dashboard</div>
                  <div className="text-sm text-gray-600">
                    ✓ Shows for whitelisted address<br />
                    Address: 0x2c5329fFa2A1f02A241Ec1932b4358bf71e158ae
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          {/* Test Scenarios */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Test Scenarios</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium">Scenario 1: New User Flow</h3>
                <ol className="text-sm text-gray-600 mt-1 list-decimal list-inside space-y-1">
                  <li>Connect wallet</li>
                  <li>Switch to Polygon Amoy network</li>
                  <li>See claim button (not portfolio yet)</li>
                  <li>Click "1,000 PT受け取る"</li>
                  <li>If no gas, get faucet alert</li>
                  <li>After claim, PT auto-added to MetaMask</li>
                  <li>Portfolio shows 1,000 PT</li>
                </ol>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium">Scenario 2: Existing User</h3>
                <ol className="text-sm text-gray-600 mt-1 list-decimal list-inside space-y-1">
                  <li>Connect wallet</li>
                  <li>Portfolio & Cash show immediately</li>
                  <li>No claim button (already claimed)</li>
                  <li>"PT追加" button available</li>
                  <li>All values show "PT" symbol</li>
                </ol>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-medium">Scenario 3: Network Switching</h3>
                <ol className="text-sm text-gray-600 mt-1 list-decimal list-inside space-y-1">
                  <li>Connect on Sepolia</li>
                  <li>Should still show "PT" (not SEP)</li>
                  <li>No claim/add buttons</li>
                  <li>Switch to Polygon Amoy</li>
                  <li>Claim/add buttons appear</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
        
        {/* Test Log */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Log</h2>
          <div className="bg-gray-50 rounded p-4 h-48 overflow-y-auto font-mono text-sm">
            {testLog.length === 0 ? (
              <div className="text-gray-500">No events logged yet...</div>
            ) : (
              testLog.map((log, index) => (
                <div key={index} className="text-gray-700">{log}</div>
              ))
            )}
          </div>
        </div>
        
        {/* Current State Display */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Current State</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded p-4">
              <div className="text-sm text-gray-600">Search Query</div>
              <div className="font-medium">{searchQuery || 'None'}</div>
            </div>
            <div className="bg-gray-50 rounded p-4">
              <div className="text-sm text-gray-600">Expected Currency</div>
              <div className="font-medium">PT (Play Token)</div>
            </div>
            <div className="bg-gray-50 rounded p-4">
              <div className="text-sm text-gray-600">Supported Networks</div>
              <div className="font-medium">Polygon Amoy, Sepolia</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}