'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import PrimaryButton from '../ui/PrimaryButton';
import ThematicContainer from '../ui/ThematicContainer';
import { SimpleVerificationService, VerificationStep } from '../../lib/verification/simpleVerificationService';

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
  userId: string;
  onComplete: (data: { video: Blob; photo: Blob; verificationResult: any }) => void;
  onBack: () => void;
}

const VerificationReviewScreen: React.FC<VerificationReviewScreenProps> = ({
  challenge,
  videoBlob,
  photoBlob,
  userId,
  onComplete,
  onBack,
}) => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [verificationStage, setVerificationStage] = useState<'ready' | 'verifying' | 'complete' | 'failed'>('ready');
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([]);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [currentStepMessage, setCurrentStepMessage] = useState('Ready to verify submission');

  // Create object URLs for media
  useEffect(() => {
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

  const startVerification = async () => {
    setVerificationStage('verifying');
    
    console.group('🔍 VERIFICATION PROCESS STARTED');
    console.log('Challenge:', challenge.title);
    console.log('Video:', { size: `${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`, type: videoBlob.type });
    console.log('Photo:', { size: `${(photoBlob.size / 1024).toFixed(2)} KB`, type: photoBlob.type });
    console.groupEnd();
    
    try {
      const verificationService = new SimpleVerificationService((steps) => {
        // Update UI with step progress
        setVerificationSteps(steps);
        
        // Update current step message
        const runningStep = steps.find(s => s.status === 'running');
        if (runningStep) {
          setCurrentStepMessage(runningStep.message);
        }
        
        // Log step completions
        const completedStep = steps.find(s => s.status === 'completed' && !s.id.includes('logged'));
        if (completedStep) {
          console.log(`✅ ${completedStep.name} COMPLETED:`, {
            confidence: `${Math.round((completedStep.confidence || 0) * 100)}%`,
            message: completedStep.message
          });
          // Mark as logged to prevent duplicate logs
          completedStep.id += '-logged';
        }
        
        const failedStep = steps.find(s => s.status === 'failed' && !s.id.includes('logged'));
        if (failedStep) {
          console.error(`❌ ${failedStep.name} FAILED:`, failedStep.message);
          // Mark as logged to prevent duplicate logs
          failedStep.id += '-logged';
        }
      });

      console.log('🚀 Starting verification process...');
      
      const result = await verificationService.runFullVerification(
        videoBlob,
        photoBlob,
        challenge.description
      );

      console.group('📊 VERIFICATION RESULTS');
      console.log('Overall result:', result.passed ? '✅ PASSED' : '❌ FAILED');
      console.log('Overall confidence:', `${Math.round(result.overallConfidence * 100)}%`);
      console.groupEnd();

      setVerificationResult(result);
      
      if (result.passed) {
        setVerificationStage('complete');
        setCurrentStepMessage('All verification checks passed!');
      } else {
        setVerificationStage('failed');
        setCurrentStepMessage('Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('💥 VERIFICATION ERROR:', error);
      setVerificationStage('failed');
      setCurrentStepMessage('Verification process encountered an error.');
    }
  };

  const handleSubmit = () => {
    onComplete({ 
      video: videoBlob, 
      photo: photoBlob,
      verificationResult
    });
  };

  const getStepStatusIcon = (step: VerificationStep) => {
    switch (step.status) {
      case 'completed':
        return (
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );
      case 'running':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'failed':
        return (
          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );
      default:
        return <div className="w-4 h-4 bg-gray-500 rounded-full" />;
    }
  };

  const getOverallProgress = () => {
    if (verificationSteps.length === 0) return 0;
    
    const totalSteps = verificationSteps.length;
    const completedSteps = verificationSteps.filter(s => s.status === 'completed').length;
    const runningStep = verificationSteps.find(s => s.status === 'running');
    
    let progress = (completedSteps / totalSteps) * 100;
    
    // Add progress from currently running step
    if (runningStep) {
      progress += (runningStep.progress / 100) * (1 / totalSteps) * 100;
    }
    
    return Math.min(progress, 100);
  };

  return (
    <div className="flex flex-col">
      {/* Back Button */}
      <button 
        onClick={onBack} 
        className="absolute top-0 left-4 text-gray-400 hover:text-white z-10"
        disabled={verificationStage === 'verifying'}
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

      {/* Verification Section */}
      {verificationStage === 'ready' ? (
        // Ready to verify
        <div className="bg-gray-800/30 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-medium mb-3">Review Your Submission</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Challenge:</span>
              <span className="text-white font-medium">{challenge.title}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Video Size:</span>
              <span className="text-white">{(videoBlob.size / 1024 / 1024).toFixed(1)} MB</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Photo Size:</span>
              <span className="text-white">{(photoBlob.size / 1024).toFixed(1)} KB</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-800/30">
            <p className="text-xs text-blue-300">
              Click "Start Verification" to validate your submission with AI verification.
            </p>
          </div>
        </div>
      ) : (
        // Verification in progress or completed
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
              {verificationStage === 'failed' && (
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Main Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                verificationStage === 'complete' 
                  ? 'bg-gradient-to-r from-green-500 to-green-400' 
                  : verificationStage === 'failed'
                  ? 'bg-gradient-to-r from-red-500 to-red-400'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}
              style={{ width: `${getOverallProgress()}%` }}
            />
          </div>

          {/* Individual Steps */}
          {verificationSteps.length > 0 && (
            <div className="space-y-2 mb-4">
              {verificationSteps.map((step) => (
                <div key={step.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    {getStepStatusIcon(step)}
                    <span className={`${
                      step.status === 'completed' ? 'text-green-400' :
                      step.status === 'failed' ? 'text-red-400' :
                      step.status === 'running' ? 'text-blue-400' :
                      'text-gray-500'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {step.confidence && (
                      <span className="text-xs text-gray-400">
                        {Math.round(step.confidence * 100)}%
                      </span>
                    )}
                    {step.status === 'running' && (
                      <span className="text-xs text-blue-400">
                        {step.progress}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Status Message */}
          <div className="text-center">
            <p className={`text-sm font-medium ${
              verificationStage === 'complete' ? 'text-green-400' : 
              verificationStage === 'failed' ? 'text-red-400' :
              'text-blue-400'
            }`}>
              {currentStepMessage}
            </p>
            {verificationResult && (
              <p className="text-xs text-gray-500 mt-1">
                Overall confidence: {Math.round(verificationResult.overallConfidence * 100)}%
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors"
          disabled={verificationStage === 'verifying'}
        >
          Retake
        </button>
        
        {verificationStage === 'ready' ? (
          <PrimaryButton
            onClick={startVerification}
            text="Start Verification"
            className="flex-1"
          />
        ) : (
          <PrimaryButton
            onClick={handleSubmit}
            text={
              verificationStage === 'complete' ? "Submit Challenge" :
              verificationStage === 'failed' ? "Retry Verification" :
              "Verifying..."
            }
            className="flex-1"
            disabled={verificationStage === 'verifying'}
          />
        )}
      </div>

      {/* Result Messages */}
      {verificationStage === 'complete' && (
        <div className="mt-4 bg-green-900/20 rounded-lg p-3 border border-green-800/30">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-xs text-green-300">
              All verification checks passed! You can now submit your challenge.
            </p>
          </div>
        </div>
      )}

      {verificationStage === 'failed' && (
        <div className="mt-4 bg-red-900/20 rounded-lg p-3 border border-red-800/30">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-xs text-red-300">
              Verification failed. Please check your submission and try again.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationReviewScreen;