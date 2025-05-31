'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import PrimaryButton from '../ui/PrimaryButton';
import ThematicContainer from '../ui/ThematicContainer';

interface ChallengeModeProps {
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
  onSuccess,
  onFailed,
  apiEndpoint,
  onBack,
}) => {
  const [stage, setStage] = useState<'challenge' | 'processing' | 'success'>('challenge');
  const [challengeToken, setChallengeToken] = useState<string>('');
  const [challenge, setChallenge] = useState<Challenge | null>(null);

  // Generate random challenge on component mount
  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const response = await fetch('/api/generate-challenge', {
          method: 'POST',
        });
        
        const data = await response.json();
        
        if (data.success) {
          setChallenge(data.challenge);
        } else {
          // Fallback to hardcoded challenge if API fails
          const randomPhotoNumber = Math.floor(Math.random() * 3) + 1;
          const colors = ["nocenaPink", "nocenaBlue", "nocenaPurple"];
          
          setChallenge({
            title: "Take a quick selfie",
            description: "Show us your face to verify you're a real person.",
            challengerName: "Nocena GPT",
            challengerProfile: `/images/${randomPhotoNumber}.jpg`,
            reward: 50,
            color: colors[Math.floor(Math.random() * colors.length)]
          });
        }
      } catch (error) {
        console.error('Failed to fetch challenge:', error);
        // Fallback challenge
        const randomPhotoNumber = Math.floor(Math.random() * 3) + 1;
        const colors = ["nocenaPink", "nocenaBlue", "nocenaPurple"];
        
        setChallenge({
          title: "Show your hands",
          description: "Simple verification - take a photo of your hands.",
          challengerName: "Nocena GPT", 
          challengerProfile: `/images/${randomPhotoNumber}.jpg`,
          reward: 40,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    };

    fetchChallenge();
  }, []);

  const handleCompleteChallenge = async () => {
    setStage('processing');

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeData: challenge,
          timestamp: Date.now()
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const challengeToken = data.token || `vhp_challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setChallengeToken(challengeToken);
        setStage('success');
        
        // Call onSuccess after showing success state
        setTimeout(() => {
          onSuccess(challengeToken);
        }, 2000);
      } else {
        onFailed(data.message || 'Challenge verification failed');
        setStage('challenge');
      }
    } catch (error) {
      console.error('Challenge verification error:', error);
      onFailed('Network error during challenge verification');
      setStage('challenge');
    }
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
            className="w-full px-6 py-4 mb-6 relative" // Make sure parent has relative positioning
          >
            {/* Regenerate Button - Using regular button */}
            <button
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center z-10 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
              onClick={async () => {
                setChallenge(null); // Show loading
                const fetchChallenge = async () => {
                  try {
                    const response = await fetch('/api/generate-challenge', {
                      method: 'POST',
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                      setChallenge(data.challenge);
                    } else {
                      // Fallback to hardcoded challenge if API fails
                      const randomPhotoNumber = Math.floor(Math.random() * 3) + 1;
                      const colors = ["nocenaPink", "nocenaBlue", "nocenaPurple"];
                      
                      setChallenge({
                        title: "Take a quick selfie",
                        description: "Show us your face to verify you're a real person.",
                        challengerName: "Nocena GPT",
                        challengerProfile: `/images/${randomPhotoNumber}.jpg`,
                        reward: 50,
                        color: colors[Math.floor(Math.random() * colors.length)]
                      });
                    }
                  } catch (error) {
                    console.error('Failed to fetch challenge:', error);
                    // Fallback challenge
                    const randomPhotoNumber = Math.floor(Math.random() * 3) + 1;
                    const colors = ["nocenaPink", "nocenaBlue", "nocenaPurple"];
                    
                    setChallenge({
                      title: "Show your hands",
                      description: "Simple verification - take a photo of your hands.",
                      challengerName: "Nocena GPT", 
                      challengerProfile: `/images/${randomPhotoNumber}.jpg`,
                      reward: 40,
                      color: colors[Math.floor(Math.random() * colors.length)]
                    });
                  }
                };
                fetchChallenge();
              }}
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

            {/* Rest of the content remains the same */}
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

          {/* Instructions */}
          <div className="bg-blue-900/20 rounded-lg p-3 mb-6 border border-blue-800/30">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <circle cx="12" cy="17" r=".5" />
              </svg>
              <p className="text-xs text-blue-300">
                Click "Accept Challenge" to complete this task and earn your verification token.
              </p>
            </div>
          </div>

          {/* Primary Button */}
          <PrimaryButton
            className="mt-4"
            onClick={handleCompleteChallenge}
            text="Accept Challenge"
          />
        </>
      )}

      {stage === 'processing' && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-300">Verifying challenge completion...</p>
          <p className="text-xs text-gray-400 mt-2">This may take a moment</p>
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