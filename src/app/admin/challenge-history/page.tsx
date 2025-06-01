// pages/admin/challenge-history.tsx or app/admin/challenge-history/page.tsx
'use client';

import { useState, useEffect } from 'react';

interface TransactionRecord {
  id: string;
  transactionId: string;
  timestamp: string;
}

interface OnChainChallengeData {
  transactionId: string;
  blockHeight: number;
  timestamp: string;
  status: string;
  challenge?: {
    title: string;
    challenger: string;
    description: string;
  };
  recipient?: {
    address: string;
    amount: number;
  };
  media?: {
    videoCID: string;
    photoCID: string;
    videoURL: string;
    photoURL: string;
  };
  verification?: {
    score: number;
    confidence: number;
  };
  logs: string[];
  events: any[];
}

export default function VHPHistoryPage() {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [onChainData, setOnChainData] = useState<OnChainChallengeData[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [selectedRecord, setSelectedRecord] = useState<OnChainChallengeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingOnChain, setFetchingOnChain] = useState(false);

  useEffect(() => {
    loadData();
    loadFileInfo();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load transaction IDs from minimal storage
      const response = await fetch('/api/save-transaction');
      const result = await response.json();
      
      if (result.success) {
        setTransactions(result.transactions);
      }

      // Load stats
      const statsResponse = await fetch('/api/save-transaction?action=stats');
      const statsResult = await statsResponse.json();
      if (statsResult.success) {
        setStats(statsResult);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOnChainData = async () => {
    if (transactions.length === 0) return;
    
    setFetchingOnChain(true);
    try {
      console.log('🔍 Fetching on-chain data for', transactions.length, 'transactions');
      
      const response = await fetch('/api/save-transaction?action=onchain');
      const result = await response.json();
      
      if (result.success) {
        setOnChainData(result.onChainData);
        console.log('✅ Loaded on-chain data for', result.onChainData.length, 'transactions');
      }
    } catch (error) {
      console.error('Error loading on-chain data:', error);
    } finally {
      setFetchingOnChain(false);
    }
  };

  const loadFileInfo = async () => {
    try {
      const response = await fetch('/api/save-transaction?action=info');
      const result = await response.json();
      if (result.success) {
        setFileInfo(result.fileInfo);
      }
    } catch (error) {
      console.error('Error loading file info:', error);
    }
  };

  const viewJsonFile = () => {
    window.open('/data/vhp-transactions.json', '_blank');
  };

  const downloadData = async () => {
    try {
      const response = await fetch('/data/vhp-transactions.json');
      const data = await response.text();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vhp-transactions-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">VHP: Verified Human Protocol</h1>
          <p className="text-gray-600 mb-4">100% on-chain verification system - all data fetched from Flow blockchain</p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-semibold text-blue-800">Fully Decentralized Architecture</span>
            </div>
            <div className="text-sm text-blue-700 space-y-1">
              <div>📄 <strong>Minimal Storage:</strong> Only transaction IDs stored locally</div>
              <div>🔗 <strong>On-Chain Data:</strong> All challenge metadata fetched from Flow blockchain</div>
              <div>💾 <strong>Filecoin Storage:</strong> Media permanently stored via Storacha with CIDs on-chain</div>
              <div>🔍 <strong>Fully Auditable:</strong> Zero centralized databases</div>
            </div>
          </div>
          
          {fileInfo && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-700">
                <strong>📄 Transaction Registry:</strong> {fileInfo.size} • 
                <strong> Last Updated:</strong> {new Date(fileInfo.lastModified).toLocaleString()} • 
                <button 
                  onClick={viewJsonFile}
                  className="text-blue-600 hover:text-blue-800 underline ml-2"
                >
                  View Transaction IDs
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.basicStats?.totalTransactions || 0}</div>
              <div className="text-sm text-gray-600">Transaction IDs Stored</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-2xl font-bold text-green-600">
                {stats.onChainStats?.totalTokensDistributed || '---'}
              </div>
              <div className="text-sm text-gray-600">VHP Tokens Distributed</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-2xl font-bold text-purple-600">
                {stats.onChainStats?.averageVerificationScore || '---'}%
              </div>
              <div className="text-sm text-gray-600">Avg Human Score</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-2xl font-bold text-orange-600">
                {stats.onChainStats?.uniqueVerifiedHumans || '---'}
              </div>
              <div className="text-sm text-gray-600">Verified Humans</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={loadData}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Loading...' : 'Refresh Transaction IDs'}
            </button>

            <button
              onClick={loadOnChainData}
              disabled={fetchingOnChain || transactions.length === 0}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              {fetchingOnChain ? 'Fetching On-Chain...' : 'Fetch On-Chain Data'}
            </button>

            <button
              onClick={downloadData}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Download Transaction IDs
            </button>

            <button
              onClick={viewJsonFile}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              View Raw JSON
            </button>

            {fileInfo && (
              <div className="text-sm text-gray-500">
                Storage: {fileInfo.size} • Available at: <code>/data/vhp-transactions.json</code>
              </div>
            )}
          </div>
        </div>

        {/* Data Source Indicator */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">
                  Transaction IDs: {transactions.length} stored locally
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${onChainData.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  On-Chain Data: {onChainData.length} fetched from Flow blockchain
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              100% Decentralized • Zero Database Dependencies
            </div>
          </div>
        </div>

        {/* Transaction IDs vs On-Chain Data */}
        {transactions.length > 0 && onChainData.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 text-yellow-600">⚡</div>
              <span className="font-semibold text-yellow-800">Ready to Fetch On-Chain Data</span>
            </div>
            <p className="text-sm text-yellow-700">
              Found {transactions.length} transaction IDs. Click "Fetch On-Chain Data" to retrieve complete challenge details from the Flow blockchain.
            </p>
          </div>
        )}

        {/* Records Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verification</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Human</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reward</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Block Height</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {onChainData.map((record) => (
                  <tr key={record.transactionId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {record.challenge?.title || 'VHP Verification'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {record.challenge?.challenger || 'VHP AI'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-mono text-gray-600">
                        {record.recipient?.address?.substring(0, 10) || 'Unknown'}...
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-green-600">
                        {record.recipient?.amount || 0} VHP
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {record.verification?.score || '---'}%
                      </div>
                      <div className="text-xs text-gray-500">
                        🤖 AI Verified
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-mono text-blue-600">
                        {record.transactionId.substring(0, 12)}...
                      </div>
                      <div className="text-xs text-gray-500">
                        {record.status}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600">
                        #{record.blockHeight}
                      </div>
                      <div className="text-xs text-gray-500">
                        Flow Network
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="text-blue-500 hover:text-blue-700 text-xs"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                
                {/* Show transaction IDs that haven't been fetched yet */}
                {transactions.filter(t => !onChainData.find(od => od.transactionId === t.transactionId)).map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 bg-gray-25">
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-500">
                        Pending on-chain fetch...
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-400">---</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-400">---</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-400">---</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-mono text-blue-600">
                        {transaction.transactionId.substring(0, 12)}...
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(transaction.timestamp).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-400">---</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-400">Fetch required</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {transactions.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              No VHP verifications found. Complete some verifications to see transaction IDs here!
            </div>
          )}

          {loading && (
            <div className="text-center py-12 text-gray-500">
              Loading transaction IDs...
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">VHP Verification Details (On-Chain)</h2>
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-700">Challenge Info (Flow Blockchain)</h3>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <div><strong>Title:</strong> {selectedRecord.challenge?.title || 'VHP Verification'}</div>
                      <div><strong>Description:</strong> {selectedRecord.challenge?.description || 'Human verification challenge'}</div>
                      <div><strong>Challenger:</strong> {selectedRecord.challenge?.challenger || 'VHP AI'}</div>
                    </div>
                  </div>

                  {selectedRecord.media && (
                    <div>
                      <h3 className="font-semibold text-gray-700">Verification Proofs (Filecoin via Storacha)</h3>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        <div><strong>Video CID:</strong> <code>{selectedRecord.media.videoCID}</code></div>
                        <div><strong>Selfie CID:</strong> <code>{selectedRecord.media.photoCID}</code></div>
                        <div className="mt-2">
                          <a href={selectedRecord.media.videoURL} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-500 hover:underline mr-4">View Verification Video</a>
                          <a href={selectedRecord.media.photoURL} target="_blank" rel="noopener noreferrer"
                             className="text-blue-500 hover:underline">View Verification Selfie</a>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-gray-700">Blockchain Transaction</h3>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <div><strong>Transaction ID:</strong> <code>{selectedRecord.transactionId}</code></div>
                      <div><strong>Block Height:</strong> #{selectedRecord.blockHeight}</div>
                      <div><strong>Network:</strong> Flow Blockchain</div>
                      <div><strong>Status:</strong> 
                        <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          {selectedRecord.status}
                        </span>
                      </div>
                      {selectedRecord.recipient && (
                        <>
                          <div><strong>Verified Human:</strong> <code>{selectedRecord.recipient.address}</code></div>
                          <div><strong>Reward:</strong> {selectedRecord.recipient.amount} VHP tokens</div>
                        </>
                      )}
                    </div>
                  </div>

                  {selectedRecord.verification && (
                    <div>
                      <h3 className="font-semibold text-gray-700">AI Verification Results</h3>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        <div><strong>Human Score:</strong> {selectedRecord.verification.score}%</div>
                        <div><strong>Confidence:</strong> {selectedRecord.verification.confidence}</div>
                        <div><strong>Status:</strong> ✅ Verified Human</div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-gray-700">Raw On-Chain Data</h3>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <div><strong>Events:</strong> {selectedRecord.events.length} blockchain events</div>
                      <div><strong>Logs:</strong> {selectedRecord.logs.length} transaction logs</div>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                          View Raw Logs
                        </summary>
                        <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                          {JSON.stringify(selectedRecord.logs, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}