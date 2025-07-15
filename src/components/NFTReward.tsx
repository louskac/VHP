import React, { useState, useEffect } from 'react';
import PrimaryButton from './ui/PrimaryButton';

interface NFTRewardProps {
  challengeTitle: string;
  userWalletAddress: string;
  challengeType?: string;
  location?: any;
}

export const NFTReward: React.FC<NFTRewardProps> = ({
  challengeTitle,
  userWalletAddress,
  challengeType,
  location,
}) => {
  const [stage, setStage] = useState<'idle' | 'generating' | 'waiting' | 'minting' | 'completed'>('idle');
  const [collectionId, setCollectionId] = useState<string>('');
  const [nftResult, setNftResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const startNFTGeneration = async () => {
    setStage('generating');
    setError('');

    try {
      // Step 1: Start NFT generation
      const response = await fetch('/api/generateChallengeNFT', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeTitle,
          userWalletAddress,
          challengeType,
          location,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCollectionId(data.collectionId);
        setStage('waiting');
        
        // Start polling for completion
        pollForCompletion(data.collectionId);
      } else {
        setError(data.error);
        setStage('idle');
      }
    } catch (err) {
      setError('Failed to start NFT generation');
      setStage('idle');
    }
  };

  const pollForCompletion = async (id: string) => {
    const checkProgress = async () => {
      try {
        const response = await fetch(`/api/checkNFTProgress?collectionId=${id}`);
        const data = await response.json();

        if (data.success && data.progress) {
          const progress = data.progress;
          
          // Check if generation is completed
          if (progress.data && progress.data.generated) {
            setStage('minting');
            await mintNFT(id);
          } else {
            // Continue polling if not completed
            setTimeout(checkProgress, 3000); // Check every 3 seconds
          }
        }
      } catch (err) {
        setError('Error checking progress');
        setStage('idle');
      }
    };

    checkProgress();
  };

  const mintNFT = async (id: string) => {
    try {
      const response = await fetch('/api/mintNFT', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionId: id,
          name: `${challengeTitle} Achievement`,
          description: `Completed Nocena challenge: ${challengeTitle}`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNftResult(data.nft);
        setStage('completed');
      } else {
        setError(data.error);
        setStage('idle');
      }
    } catch (err) {
      setError('Failed to mint NFT');
      setStage('idle');
    }
  };

  if (stage === 'completed' && nftResult) {
    return (
      <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-6 text-white">
        <h3 className="text-xl font-bold mb-4">🎉 NFT Minted Successfully!</h3>
        <div className="space-y-4">
          {nftResult.image && (
            <img 
              src={nftResult.image} 
              alt="Challenge NFT"
              className="w-full max-w-sm mx-auto rounded-lg"
            />
          )}
          <div className="text-sm space-y-1">
            <p><strong>Name:</strong> {nftResult.name}</p>
            <p><strong>Description:</strong> {nftResult.description}</p>
            {nftResult.transaction && (
              <a 
                href={`https://polygonscan.com/tx/${nftResult.transaction}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-200 hover:underline block"
              >
                View on PolygonScan →
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
      <h3 className="text-xl font-bold mb-2">🏆 Claim Your NFT Reward</h3>
      <p className="mb-4 opacity-90">
        Complete this challenge to earn a unique AI-generated NFT on Polygon!
      </p>
      
      {error && (
        <div className="bg-red-500 bg-opacity-20 border border-red-400 rounded p-3 mb-4">
          {error}
        </div>
      )}

        <PrimaryButton
            onClick={startNFTGeneration}
            disabled={stage !== 'idle'}
            className="w-full"
            text={
            stage === 'generating' ? 'Starting Generation...' :
            stage === 'waiting' ? 'Generating NFT...' :
            stage === 'minting' ? 'Minting NFT...' :
            'Generate NFT Reward'
            }
        />
    </div>
  );
};