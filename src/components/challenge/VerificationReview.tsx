'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import PrimaryButton from '../ui/PrimaryButton';
import ThematicContainer from '../ui/ThematicContainer';

interface Challenge {
  title: string;
  description: string;
  challengerName: string;
  challengerProfile: string;
  reward: number;
  color: string;
}

interface VerificationReviewScreenProps {
  challenge: Challenge;
  videoBlob: Blob;
  photoBlob: Blob;
  onComplete: (data: { video: Blob; photo: Blob }) => void;
  onBack: () => void;
}

const VerificationReviewScreen: React.FC<VerificationReviewScreenProps> = ({
  challenge,
  videoBlob,
  photoBlob,
  onComplete,
  onBack,
}) => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [verificationStage, setVerificationStage] = useState<'starting' | 'verifying' | 'complete'>('starting');
  const [progress, setProgress] = useState(0);

  // Create object URLs for media
  useEffect(() => {
    const vUrl = URL.createObjectURL(videoBlob);
    const pUrl = URL.createObjectURL(photoBlob);
    
    setVideoUrl(vUrl);
    setPhotoUrl(pUrl);

    // Start verification process after a short delay
    const timer = setTimeout(() => {
      startVerificationProcess();
    }, 1000);

    return () => {
      // Clean up object URLs
      URL.revokeObjectURL(vUrl);
      URL.revokeObjectURL(pUrl);
      clearTimeout(timer);
    };
  }, [videoBlob, photoBlob]);

  const startVerificationProcess = () => {
    setVerificationStage('verifying');
    
    // Simulate progress over 4 seconds
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 25;
      setProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setVerificationStage('complete');
        }, 500);
      }
    }, 1000);
  };

  const getVerificationMessage = () => {
    switch (verificationStage) {
      case 'starting':
        return 'Ready to verify...';
      case 'verifying':
        if (progress <= 25) return 'Checking video quality...';
        if (progress <= 50) return 'AI analyzing challenge completion...';
        if (progress <= 75) return 'Verifying human face in selfie...';
        if (progress <= 100) return 'Matching facial features...';
        return 'Processing...';
      case 'complete':
        return 'All verification checks passed!';
    }
  };

  const handleSubmit = () => {
    onComplete({ video: videoBlob, photo: photoBlob });
  };

  return (
    <div className="flex flex-col">
      {/* Back Button */}
      <button 
        onClick={onBack} 
        className="absolute top-0 left-4 text-gray-400 hover:text-white z-10"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>



      {/* BeReal-style Media Layout */}
      <div className="relative mb-6">
        {/* Main Video (Challenge) */}
        <div className="rounded-xl overflow-hidden bg-black">
          <video
            src={videoUrl}
            controls
            preload="metadata"
            className="w-full h-80 object-cover"
            onError={(e) => {
              console.error('Video error:', e);
              console.log('Video URL:', videoUrl);
              console.log('Video blob size:', videoBlob.size);
              console.log('Video blob type:', videoBlob.type);
            }}
          />
        </div>

        {/* Selfie Overlay (Top Right) */}
        <div className="absolute top-4 right-4 w-24 h-32 rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <img
            src={photoUrl}
            alt="Verification selfie"
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Photo error:', e);
              console.log('Photo URL:', photoUrl);
              console.log('Photo blob size:', photoBlob.size);
              console.log('Photo blob type:', photoBlob.type);
            }}
          />
        </div>

        {/* Challenge Badge */}
        <div className="absolute bottom-4 left-4 right-4">
          <ThematicContainer
            asButton={false}
            glassmorphic={true}
            color={challenge.color as any}
            rounded="xl"
            className="px-4 py-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Image
                  src={challenge.challengerProfile}
                  alt="Challenger"
                  width={24}
                  height={24}
                  className="w-6 h-6 object-cover rounded-full"
                />
                <span className="text-sm font-medium">{challenge.title}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-semibold">{challenge.reward}</span>
                <Image src="/nocenix.ico" alt="Nocenix" width={16} height={16} />
              </div>
            </div>
          </ThematicContainer>
        </div>
      </div>

      {/* Condensed Verification Progress */}
      <div className="bg-gray-800/30 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium">Verification Progress</h3>
          <div className="flex items-center space-x-2">
            {verificationStage === 'verifying' && (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
            {verificationStage === 'complete' && (
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              verificationStage === 'complete' 
                ? 'bg-gradient-to-r from-green-500 to-green-400' 
                : 'bg-gradient-to-r from-blue-500 to-purple-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status Message */}
        <div className="text-center">
          <p className={`text-sm font-medium ${
            verificationStage === 'complete' ? 'text-green-400' : 'text-blue-400'
          }`}>
            {getVerificationMessage()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {verificationStage === 'complete' 
              ? 'Video quality, AI analysis, face detection, and identity matching completed'
              : 'Running video quality, AI analysis, face detection, and identity verification checks'
            }
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors"
          disabled={verificationStage === 'verifying'}
        >
          Retake
        </button>
        <PrimaryButton
          onClick={handleSubmit}
          text={verificationStage === 'complete' ? "Submit Verification" : "Verifying..."}
          className="flex-1"
          disabled={verificationStage !== 'complete'}
        />
      </div>

      {verificationStage === 'complete' && (
        <div className="mt-4 bg-green-900/20 rounded-lg p-3 border border-green-800/30">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-xs text-green-300">
              All verification checks passed! You can now submit your verification.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationReviewScreen;