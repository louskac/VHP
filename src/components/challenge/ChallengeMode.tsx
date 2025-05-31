'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import PrimaryButton from '../ui/PrimaryButton';
import ThematicContainer from '../ui/ThematicContainer';
import CompleteChallengeScreen from './CompleteChallenge';

interface ChallengeModeProps {
  userId: string; // Add userId prop
  onSuccess: (token: string) => void;
  onFailed: (error: string) => void;
  apiEndpoint: string;
  onBack?: () => void;
}

interface Challenge {
  title: string;
  description: string;
  challengerName: string;
  challengerProfile: string;
  reward: number;
  color: string;
}

const ChallengeMode: React.FC<ChallengeModeProps> = ({
  userId, // Destructure userId
  onSuccess,
  onFailed,
  apiEndpoint,
  onBack,
}) => {
  const [stage, setStage] = useState<'challenge' | 'processing' | 'success' | 'completing'>('challenge');
  const [challengeToken, setChallengeToken] = useState<string>('');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  
  // Track the last 3 challenges that were generated (and potentially regenerated)
  const [challengeHistory, setChallengeHistory] = useState<Challenge[]>([]);

  // Helper function to add challenge to history
  const addToHistory = (newChallenge: Challenge) => {
    setChallengeHistory(prev => {
      const updated = [newChallenge, ...prev];
      // Keep only the last 3 challenges
      return updated.slice(0, 3);
    });
  };

  // Generate random challenge on component mount
  useEffect(() => {
    fetchChallenge();
  }, []);

  const fetchChallenge = async (isRegeneration = false) => {
    try {
      const response = await fetch('/api/generate-challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeHistory: challengeHistory
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setChallenge(data.challenge);
        // Only add to history if this is a regeneration (user didn't like previous ones)
        if (isRegeneration && challenge) {
          addToHistory(challenge);
        }
      } else {
        // Fallback to hardcoded challenge if API fails
        const randomPhotoNumber = Math.floor(Math.random() * 3) + 1;
        const colors = ["nocenaPink", "nocenaBlue", "nocenaPurple"];
        
        const fallbackChallenge = {
          title: "Take a quick selfie",
          description: "Show us your face to verify you're a real person.",
          challengerName: "Nocena GPT",
          challengerProfile: `/images/${randomPhotoNumber}.jpg`,
          reward: 50,
          color: colors[Math.floor(Math.random() * colors.length)]
        };
        
        setChallenge(fallbackChallenge);
        if (isRegeneration && challenge) {
          addToHistory(challenge);
        }
      }
    } catch (error) {
      console.error('Failed to fetch challenge:', error);
      // Fallback challenge
      const randomPhotoNumber = Math.floor(Math.random() * 3) + 1;
      const colors = ["nocenaPink", "nocenaBlue", "nocenaPurple"];
      
      const fallbackChallenge = {
        title: "Show your hands",
        description: "Simple verification - take a photo of your hands.",
        challengerName: "Nocena GPT", 
        challengerProfile: `/images/${randomPhotoNumber}.jpg`,
        reward: 40,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
      
      setChallenge(fallbackChallenge);
      if (isRegeneration && challenge) {
        addToHistory(challenge);
      }
    }
  };

  const handleCompleteChallenge = async () => {
    // Instead of processing, go to the complete challenge screen
    setStage('completing');
  };

  // Updated to handle both video and photo with verification result
  const handleChallengeCompletion = async (data: { video: Blob; photo: Blob; verificationResult?: any }) => {
    setStage('processing');

    try {
      // Create FormData to send challenge data, video, and photo
      const formData = new FormData();
      formData.append('video', data.video, 'challenge-video.webm');
      formData.append('photo', data.photo, 'verification-selfie.jpg');
      formData.append('challengeData', JSON.stringify({
        ...challenge,
        timestamp: Date.now(),
        verificationResult: data.verificationResult // Include verification results
      }));
      formData.append('userId', userId); // Include userId for backend processing

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        const challengeToken = responseData.token || `vhp_challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setChallengeToken(challengeToken);
        setStage('success');
        
        // Call onSuccess after showing success state
        setTimeout(() => {
          onSuccess(challengeToken);
        }, 2000);
      } else {
        onFailed(responseData.message || 'Challenge verification failed');
        setStage('challenge');
      }
    } catch (error) {
      console.error('Challenge verification error:', error);
      onFailed('Network error during challenge verification');
      setStage('challenge');
    }
  };

  const handleRegenerate = async () => {
    setChallenge(null); // Show loading
    await fetchChallenge(true); // Pass true to indicate this is a regeneration
  };

  if (!challenge) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-300">Loading challenge...</p>
      </div>
    );
  }

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
            Complete this challenge to verify you're human.
          </p>

          {/* Challenge Display */}
          <ThematicContainer
            asButton={false}
            glassmorphic={true}
            color={challenge.color as any}
            rounded="xl"
            className="w-full px-6 py-4 mb-6 relative"
          >
            {/* Regenerate Button */}
            <button
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center z-10 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
              onClick={handleRegenerate}
              title="Get a different challenge"
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
            </button>

            {/* Challenge Title - Added right padding to avoid overlap */}
            <div className="text-lg font-light mb-3 pr-12">{challenge.title}</div>

            {/* Challenge Description */}
            <div className="text-sm text-gray-300 mb-4 leading-relaxed">
              {challenge.description}
            </div>

            {/* User and Reward Info Row */}
            <div className="flex items-center justify-between">
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <Image
                  src={challenge.challengerProfile}
                  alt="Challenger Profile"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-cover rounded-full"
                />
                {/* Username */}
                <span className="text-base font-bold">{challenge.challengerName}</span>
              </div>

              {/* Reward Display */}
              <ThematicContainer asButton={false} color="nocenaPink" className="px-4 py-1">
                <div className="flex items-center space-x-1">
                  <span className="text-lg font-semibold">{challenge.reward}</span>
                  <Image src="/nocenix.ico" alt="Nocenix" width={24} height={24} />
                </div>
              </ThematicContainer>
            </div>
          </ThematicContainer>

          {/* Debug info (remove in production) */}
          {challengeHistory.length > 0 && (
            <div className="bg-gray-800/30 rounded-lg p-2 mb-4 text-xs">
              <p className="text-gray-400 mb-1">Recently generated ({challengeHistory.length}):</p>
              {challengeHistory.map((prev, index) => (
                <p key={index} className="text-gray-500">• {prev.title}</p>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-900/20 rounded-lg p-3 mb-6 border border-blue-800/30">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <circle cx="12" cy="17" r=".5" />
              </svg>
              <p className="text-xs text-blue-300">
                Complete the challenge and take a verification selfie to earn your token.
                {challengeHistory.length > 0 && " Don't like this one? Click the refresh button to get something different!"}
              </p>
            </div>
          </div>

          {/* Primary Button */}
          <PrimaryButton
            className="mt-4"
            onClick={handleCompleteChallenge}
            text="Start Challenge"
          />
        </>
      )}

      {stage === 'completing' && (
        <CompleteChallengeScreen 
          challenge={challenge}
          userId={userId} // Pass userId prop
          onComplete={handleChallengeCompletion}
          onBack={() => setStage('challenge')}
        />
      )}

      {stage === 'processing' && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-300">Verifying challenge completion...</p>
          <p className="text-xs text-gray-400 mt-2">Processing video and identity verification</p>
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
          
          <h3 className="text-xl font-medium text-green-400 mb-2">Verification Complete!</h3>
          <p className="text-sm text-gray-300 text-center mb-4">Challenge and identity verification successful</p>
          
          {/* Show verification token */}
          <div className="bg-gray-800/50 rounded-lg px-4 py-2 mb-4">
            <p className="text-xs text-gray-400">Verification Token:</p>
            <p className="text-sm text-white font-mono">{challengeToken}</p>
          </div>
          
          <p className="text-xs text-gray-400">Redirecting...</p>
        </div>
      )}
    </div>
  );
};

export default ChallengeMode;