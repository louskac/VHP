'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import PrimaryButton from '../ui/PrimaryButton';
import ThematicContainer from '../ui/ThematicContainer';

interface NFTReward {
  collectionId?: string;
  previewImage?: string;
  status: 'generating' | 'ready' | 'error';
  prompt?: string;
}

interface Challenge {
  title: string;
  description: string;
  challengerName: string;
  challengerProfile: string;
  reward: number;
  color: string;
}

interface ChallengeSuccessScreenProps {
  challenge: Challenge;
  videoBlob: Blob;
  photoBlob: Blob;
  verificationResult: any;
  nftReward: NFTReward;
  onClaimToken: (data: { walletAddress: string; description: string; transactionId?: string; amount?: number }) => void;
  onBack: () => void;
}

const ChallengeSuccessScreen: React.FC<ChallengeSuccessScreenProps> = ({
  challenge,
  videoBlob,
  photoBlob,
  verificationResult,
  nftReward,
  onClaimToken,
  onBack,
}) => {
  const [stage, setStage] = useState<'input' | 'claiming' | 'complete'>('input');
  const [walletAddress, setWalletAddress] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');

  // Create object URLs for media
  React.useEffect(() => {
    const vUrl = URL.createObjectURL(videoBlob);
    const pUrl = URL.createObjectURL(photoBlob);
    
    setVideoUrl(vUrl);
    setPhotoUrl(pUrl);

    return () => {
      // Clean up object URLs
      URL.revokeObjectURL(vUrl);
      URL.revokeObjectURL(pUrl);
    };
  }, [videoBlob, photoBlob]);

  const handleClaimToken = async () => {
    if (!walletAddress || !description) {
      return;
    }

    setStage('claiming');

    try {
      console.log('🪙 Processing token transfer...');
      
      // Call the correct API endpoint for token transfer
      const response = await fetch('/api/transfer-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientAddress: walletAddress,
          amount: Number(challenge.reward),
          description: description,
          challengeData: {
            title: challenge.title,
            verificationResult: verificationResult,
            timestamp: Date.now()
          }
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('✅ Token transfer successful:', result);
        setTransactionId(result.transactionId);
        setStage('complete');
        
        // Call the callback after showing success
        setTimeout(() => {
          onClaimToken({ 
            walletAddress, 
            description,
            transactionId: result.transactionId,
            amount: challenge.reward
          });
        }, 2000);
      } else {
        console.error('❌ Token transfer failed:', result.error);
        // Show error state or go back to input
        alert(`Token transfer failed: ${result.error || 'Unknown error'}`);
        setStage('input');
      }
    } catch (error) {
      console.error('💥 Network error during token transfer:', error);
      alert('Network error during token transfer. Please try again.');
      setStage('input');
    }
  };

  const isValidWalletAddress = (address: string) => {
    // Flow blockchain address validation (0x followed by 16 hex characters for Flow)
    return /^0x[a-fA-F0-9]{16}$/.test(address);
  };

  const canProceed = walletAddress && description && isValidWalletAddress(walletAddress);

  return (
    <div className="flex flex-col">
      {/* Back Button */}
      <button 
        onClick={onBack} 
        className="absolute top-0 left-4 text-gray-400 hover:text-white z-10"
        disabled={stage === 'claiming'}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {stage === 'input' && (
        <>
          {/* Success Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Challenge Complete!</h2>
            <p className="text-gray-300 text-sm">
              Your submission has been verified and approved
            </p>
          </div>

          {/* Challenge Preview */}
          <div className="relative mb-6">
            {/* Main Video (Challenge) - Smaller preview */}
            <div className="rounded-xl overflow-hidden bg-black">
              <video
                src={videoUrl}
                preload="metadata"
                className="w-full h-48 object-cover"
                muted
              />
            </div>

            {/* Selfie Overlay (Top Right) */}
            <div className="absolute top-3 right-3 w-16 h-20 rounded-lg overflow-hidden border-2 border-white shadow-lg">
              <img
                src={photoUrl}
                alt="Verification selfie"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Challenge Badge */}
            <div className="absolute bottom-3 left-3 right-3">
              <ThematicContainer
                asButton={false}
                glassmorphic={true}
                color={challenge.color as any}
                rounded="xl"
                className="px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Image
                      src={challenge.challengerProfile}
                      alt="Challenger"
                      width={20}
                      height={20}
                      className="w-5 h-5 object-cover rounded-full"
                    />
                    <span className="text-xs font-medium">{challenge.title}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-semibold">{challenge.reward}</span>
                    <Image src="/nocenix.ico" alt="Nocenix" width={14} height={14} />
                  </div>
                </div>
              </ThematicContainer>
            </div>
          </div>

          {/* Verification Results */}
          <div className="bg-green-900/20 rounded-xl p-4 mb-6 border border-green-800/30">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm font-medium text-green-400">Verification Passed</span>
            </div>
            <p className="text-xs text-green-300">
              Confidence: {Math.round(verificationResult.overallConfidence * 100)}% • 
              All checks completed successfully
            </p>
          </div>

          {/* Reward Claim Form */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4 text-center">Claim Your Reward</h3>
            
            {/* Form Inputs - Conjoined style */}
            <div className="bg-gray-800/50 rounded-[2rem] overflow-hidden border border-gray-600 divide-y divide-gray-600 mb-4">
              {/* Wallet Address Input */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Enter Your Flow Wallet Address (0x...)"
                  className="w-full pl-12 pr-4 py-3 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:bg-gray-700/50 transition-colors"
                />
              </div>

              {/* Description Input */}
              <div className="relative">
                <div className="absolute left-4 top-4 text-gray-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10,9 9,9 8,9" />
                  </svg>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you did in this challenge..."
                  rows={3}
                  className="w-full pl-12 pr-4 py-3 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:bg-gray-700/50 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Validation Messages */}
            {walletAddress && !isValidWalletAddress(walletAddress) && (
              <div className="mb-4 bg-red-900/20 rounded-lg p-3 border border-red-800/30">
                <p className="text-xs text-red-300">
                  Please enter a valid Flow wallet address (0x followed by 16 characters)
                </p>
              </div>
            )}
          </div>

          {/* Claim Token Button */}
          <PrimaryButton
            onClick={handleClaimToken}
            text="Claim Token"
            disabled={!canProceed}
            className="mb-4"
          />

          {/* Info */}
          <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-800/30">
            <p className="text-xs text-blue-300 text-center">
              You will receive {challenge.reward} Nocenix tokens for completing this challenge
            </p>
          </div>
        </>
      )}

      {stage === 'claiming' && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Claiming Your Reward</h3>
          <p className="text-gray-300 text-center">
            Processing your token claim on the Flow network...
          </p>
        </div>
      )}

      {stage === 'complete' && (
        <div className="flex flex-col items-center justify-center py-12">
          {/* Success Icon with Token */}
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <Image src="/nocenix.ico" alt="Nocenix" width={32} height={32} />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-green-400 mb-2">Tokens Claimed!</h3>
          <p className="text-lg text-white mb-1">+{challenge.reward} Nocenix</p>
          <p className="text-sm text-gray-300 text-center mb-6">
            Your tokens have been successfully transferred to your wallet
          </p>
          
          {/* Transaction Details */}
          <div className="bg-gray-800/50 rounded-lg px-4 py-3 mb-4 w-full">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-400">Wallet:</span>
              <span className="text-white font-mono text-xs">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            </div>
            {transactionId && (
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-400">Transaction:</span>
                <span className="text-blue-400 font-mono text-xs">
                  {transactionId.slice(0, 6)}...{transactionId.slice(-4)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Network:</span>
              <span className="text-blue-400">Flow</span>
            </div>
          </div>
          
          <p className="text-xs text-gray-400 text-center">
            Returning to home in a moment...
          </p>
        </div>
      )}
    </div>
  );
};

export default ChallengeSuccessScreen;