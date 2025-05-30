'use client';

import React, { useState } from 'react';
import { IDKitWidget, VerificationLevel, ISuccessResult } from '@worldcoin/idkit';
import PrimaryButton from '../ui/PrimaryButton';

interface WorldLoginProps {
  onSuccess: (token: string) => void;
  onFailed: (error: string) => void;
  apiEndpoint: string;
  onBack?: () => void;
}

const WorldLogin: React.FC<WorldLoginProps> = ({
  onSuccess,
  onFailed,
  apiEndpoint,
  onBack,
}) => {
  const [stage, setStage] = useState<'login' | 'verifying' | 'success'>('login');
  const [verificationToken, setVerificationToken] = useState<string>('');

  const handleWorldVerify = async (proof: ISuccessResult) => {
    setStage('verifying');
    
    try {
      const response = await fetch('/api/world/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proof,
          signal: '', // Optional signal for additional data
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const worldToken = `vhp_world_${data.nullifier_hash?.slice(0, 8)}_${Date.now()}`;
        setVerificationToken(worldToken);
        setStage('success');
        
        // Call onSuccess after showing success state
        setTimeout(() => {
          onSuccess(worldToken);
        }, 2000);
      } else {
        onFailed(data.detail || 'World ID verification failed');
        setStage('login');
      }
    } catch (error) {
      console.error('World verification error:', error);
      onFailed('Network error during World ID verification');
      setStage('login');
    }
  };

  const handleWorldSuccess = (result: ISuccessResult) => {
    // This is called when the World ID modal closes successfully
    console.log('World ID verification completed:', result);
  };

  return (
    <div className="flex flex-col">
      {/* Back Button */}
      {onBack && (
        <button 
          onClick={onBack} 
          className="absolute top-0 left-4 text-gray-400 hover:text-white z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      
      {stage === 'login' && (
        <>
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 rounded-full overflow-hidden">
              <img 
                src="/images/world-small.png" 
                alt="World ID" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          {/* Description Text */}
          <p className="text-center text-gray-300 mb-8 text-sm px-4 font-thin">
            Verify your identity with World ID. Secure biometric verification that proves you're a unique human.
          </p>

          {/* World ID Features */}
          <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-600 mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4" />
                    <path d="M21 12c0 1.66-.5 3.22-1.36 4.55-.87 1.33-2.07 2.37-3.49 3.02a8.97 8.97 0 0 1-4.30 1.08c-1.51 0-2.95-.37-4.22-1.08-1.42-.65-2.62-1.69-3.49-3.02C3.5 15.22 3 13.66 3 12s.5-3.22 1.36-4.55C5.23 6.12 6.43 5.08 7.85 4.43A8.97 8.97 0 0 1 12.15 3.35c1.51 0 2.95.37 4.22 1.08 1.42.65 2.62 1.69 3.49 3.02C20.5 8.78 21 10.34 21 12z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Proof of Personhood</p>
                  <p className="text-gray-400 text-xs">Cryptographically proves you're human</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="10" rx="2" ry="2" />
                    <circle cx="12" cy="16" r="1" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Privacy Protected</p>
                  <p className="text-gray-400 text-xs">Zero-knowledge verification</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Sybil Resistant</p>
                  <p className="text-gray-400 text-xs">One verification per person</p>
                </div>
              </div>
            </div>
          </div>

          {/* World ID Widget */}
          <IDKitWidget
            app_id={process.env.NEXT_PUBLIC_WORLD_APP_ID || "app_staging_example"} // You'll need to set this
            action="verify-human" // Updated to match your World ID action identifier
            onSuccess={handleWorldSuccess}
            handleVerify={handleWorldVerify}
            verification_level={VerificationLevel.Device} // Can be Device or Orb
            // Add accessibility props to suppress warnings
            theme="dark"
            autoClose={true}
          >
            {({ open }: { open: () => void }) => (
              <PrimaryButton
                className="mt-4 w-full"
                onClick={open}
                text="Verify with World ID"
              />
            )}
          </IDKitWidget>

          {/* Privacy Notice */}
          <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-800/30">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <circle cx="12" cy="17" r=".5" />
              </svg>
              <p className="text-xs text-blue-300">
                World ID uses biometric verification to ensure you're a unique human. Your privacy is protected with zero-knowledge proofs.
              </p>
            </div>
          </div>
        </>
      )}

      {stage === 'verifying' && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-300">Verifying with World ID...</p>
          <p className="text-xs text-gray-400 mt-2">Processing your proof</p>
        </div>
      )}

      {stage === 'success' && (
        <div className="flex flex-col items-center justify-center py-12">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          
          <h3 className="text-xl font-medium text-green-400 mb-2">World ID Verified!</h3>
          <p className="text-sm text-gray-300 text-center mb-4">Your identity has been confirmed as a unique human</p>
          
          {/* Show verification token */}
          <div className="bg-gray-800/50 rounded-lg px-4 py-2 mb-4">
            <p className="text-xs text-gray-400">Verification Token:</p>
            <p className="text-sm text-white font-mono">{verificationToken}</p>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span>Redirecting...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorldLogin;