'use client';

import { useState } from 'react';
import VHPCaptcha from '../components/VHPCaptcha';

export default function DemoPage() {
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState<string | null>(null);

  const handleVerified = (token: string) => {
    console.log('✅ User verified with token:', token);
    setShowCaptcha(false);
  };

  const handleFailed = (error: string) => {
    console.error('❌ Verification failed:', error);
    alert(`Verification failed: ${error}`);
  };

  const handleTokenTransfer = async () => {
    setIsTransferring(true);
    setTransferResult(null);

    try {
      console.log('🪙 Testing token transfer...');
      
      const response = await fetch('/api/transfer-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientAddress: '0xb99674a12153c37a',
          amount: 10,
          description: 'Test transfer from Demo page',
          challengeData: {
            title: 'Demo Page Test Challenge',
            verificationResult: { success: true, demoMode: true },
            timestamp: Date.now()
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Token transfer successful:', result);
        setTransferResult(`✅ Success! Transaction ID: ${result.transactionId}`);
      } else {
        console.error('❌ Token transfer failed:', result.error);
        setTransferResult(`❌ Failed: ${result.error}`);
      }
    } catch (error) {
      console.error('💥 Token transfer error:', error);
      setTransferResult(`💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        {/* Captcha Demo Button */}
        <button
          onClick={() => setShowCaptcha(true)}
          className="px-4 py-2 bg-gray-100 text-black border border-gray-300 rounded hover:bg-gray-200"
        >
          Complete Action (Captcha)
        </button>

        {/* Token Transfer Test Button */}
        <button
          onClick={handleTokenTransfer}
          disabled={isTransferring}
          className={`px-4 py-2 border rounded font-medium transition-colors ${
            isTransferring
              ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
              : 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
          }`}
        >
          {isTransferring ? '🔄 Transferring...' : '🪙 Test Token Transfer (10 Nocenix)'}
        </button>

        {/* Transfer Result Display */}
        {transferResult && (
          <div className={`mt-4 p-4 rounded-md text-sm max-w-md text-center ${
            transferResult.startsWith('✅') 
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {transferResult}
          </div>
        )}
      </div>

      {/* VHP Captcha Popup */}
      <VHPCaptcha
        isOpen={showCaptcha}
        onClose={() => setShowCaptcha(false)}
        onVerified={handleVerified}
        onFailed={handleFailed}
      />
    </main>
  );
}