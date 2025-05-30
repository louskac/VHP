'use client';

import { useState } from 'react';
import VHPCaptcha from '../components/VHPCaptcha';

export default function DemoPage() {
  const [showCaptcha, setShowCaptcha] = useState(false);

  const handleVerified = (token: string) => {
    console.log('✅ User verified with token:', token);
    setShowCaptcha(false);
  };

  const handleFailed = (error: string) => {
    console.error('❌ Verification failed:', error);
    alert(`Verification failed: ${error}`);
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <button
        onClick={() => setShowCaptcha(true)}
        className="px-4 py-2 bg-gray-100 text-black border border-gray-300 rounded hover:bg-gray-200"
      >
        Complete Action
      </button>

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