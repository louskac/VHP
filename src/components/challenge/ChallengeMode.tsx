'use client';

import React, { useState } from 'react';
import PrimaryButton from '../ui/PrimaryButton';

interface ChallengeModeProps {
  onSuccess: (token: string) => void;
  onFailed: (error: string) => void;
  apiEndpoint: string;
  onBack?: () => void;
}

const ChallengeMode: React.FC<ChallengeModeProps> = ({
  onSuccess,
  onFailed,
  apiEndpoint,
  onBack,
}) => {
  const [stage, setStage] = useState<'challenge' | 'processing' | 'success'>('challenge');
  const [challengeToken, setChallengeToken] = useState<string>('');

  const handleCompleteChallenge = async () => {
    setStage('processing');

    // Simulate challenge completion process
    setTimeout(() => {
      // Mock successful challenge completion
      const mockToken = 'vhp_challenge_' + Math.random().toString(36).substr(2, 9);
      setChallengeToken(mockToken);
      setStage('success');
      
      // Call onSuccess after showing success state
      setTimeout(() => {
        onSuccess(mockToken);
      }, 2000);
    }, 2000);
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
      
      {stage === 'challenge' && (
        <>
          <div className="mb-6 flex justify-center">
            <img 
              src="/images/logo-full.png" 
              alt="Nocena" 
              className="h-16 object-contain"
            />
          </div>
          
          {/* Description Text */}
          <p className="text-center text-gray-300 mb-8 text-sm px-4 font-thin">
            Complete a simple challenge to verify you're human.
          </p>

          {/* Challenge Content */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-600 mb-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Challenge Mode</h3>
              <p className="text-gray-300 text-sm">
                Click the button below to complete your human verification challenge.
              </p>
            </div>
          </div>

          {/* Primary Button */}
          <PrimaryButton
            className="mt-4"
            onClick={handleCompleteChallenge}
            text="Complete Challenge"
          />
        </>
      )}

      {stage === 'processing' && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-300">Processing your challenge...</p>
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
          
          <h3 className="text-xl font-medium text-green-400 mb-2">Challenge Complete!</h3>
          <p className="text-sm text-gray-300 text-center mb-4">You've successfully verified as human</p>
          
          {/* Show verification token */}
          <div className="bg-gray-800/50 rounded-lg px-4 py-2 mb-4">
            <p className="text-xs text-gray-400">Token:</p>
            <p className="text-sm text-white font-mono">{challengeToken}</p>
          </div>
          
          <p className="text-xs text-gray-400">Redirecting...</p>
        </div>
      )}
    </div>
  );
};

export default ChallengeMode;