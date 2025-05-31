'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import PrimaryButton from '../ui/PrimaryButton';
import ThematicContainer from '../ui/ThematicContainer';
import VerificationSelfieScreen from './VerificationSelfie';

interface Challenge {
  title: string;
  description: string;
  challengerName: string;
  challengerProfile: string;
  reward: number;
  color: string;
}

interface CompleteChallengeScreenProps {
  challenge: Challenge;
  userId: string;
  onComplete: (data: { video: Blob; photo: Blob; verificationResult?: any }) => void;
  onBack: () => void;
}

type Stage = 'ready' | 'countdown' | 'recording' | 'review' | 'selfie';

const CompleteChallengeScreen: React.FC<CompleteChallengeScreenProps> = ({
  challenge,
  userId,
  onComplete,
  onBack,
}) => {
  const [stage, setStage] = useState<Stage>('ready');
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [actualRecordingDuration, setActualRecordingDuration] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);

  // Countdown effect
  useEffect(() => {
    if (stage === 'countdown') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setStage('recording');
            return 3;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [stage]);

  // Recording timer effect
  useEffect(() => {
    if (stage === 'recording') {
      recordingStartTimeRef.current = Date.now();
      setRecordingTime(0);
      
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        setRecordingTime(elapsed);
      }, 100);

      return () => clearInterval(timer);
    }
  }, [stage]);

  // Initialize camera when recording starts
  useEffect(() => {
    if (stage === 'recording') {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [stage]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log(`📊 Video chunk received: ${event.data.size} bytes`);
        }
      };

      mediaRecorder.onstop = () => {
        const actualDuration = (Date.now() - recordingStartTimeRef.current) / 1000;
        setActualRecordingDuration(actualDuration);
        
        console.log(`🎬 Recording stopped. Total chunks: ${chunksRef.current.length}`);
        console.log(`⏱️ Actual recording duration: ${actualDuration.toFixed(1)}s`);
        console.log(`⏱️ Timer showed: ${recordingTime}s`);
        
        const blob = new Blob(chunksRef.current, { 
          type: 'video/webm;codecs=vp9,opus' 
        });
        
        console.log(`📦 Final video blob:`, {
          size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
          type: blob.type,
          actualDuration: `${actualDuration.toFixed(1)}s`,
          timerDuration: `${recordingTime}s`
        });
        
        setVideoBlob(blob);
        setVideoUrl(URL.createObjectURL(blob));
        setStage('review');
      };

      mediaRecorder.start(1000);
      console.log('🔴 Recording started with 1s timeslice');
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
      onBack();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      const actualDuration = (Date.now() - recordingStartTimeRef.current) / 1000;
      console.log(`🛑 Stopping recording after ${actualDuration.toFixed(1)}s`);
      mediaRecorderRef.current.stop();
    }
    stopCamera();
  };

  const handleStartChallenge = () => {
    setStage('countdown');
  };

  const handleSubmit = () => {
    if (videoBlob) {
      setStage('selfie');
    }
  };

  const handleRetry = () => {
    setVideoBlob(null);
    setVideoUrl('');
    setRecordingTime(0);
    setActualRecordingDuration(0);
    recordingStartTimeRef.current = 0;
    setStage('ready');
  };

  const handleSelfieComplete = (data: { video: Blob; photo: Blob; verificationResult?: any }) => {
    onComplete(data);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canSubmit = actualRecordingDuration >= 3;

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

      {/* Challenge Header */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-light mb-2">{challenge.title}</h2>
        <div className="flex items-center justify-center space-x-2">
          <span className="text-sm text-gray-300">Reward:</span>
          <ThematicContainer asButton={false} color="nocenaPink" className="px-3 py-1">
            <div className="flex items-center space-x-1">
              <span className="text-sm font-semibold">{challenge.reward}</span>
              <Image src="/nocenix.ico" alt="Nocenix" width={16} height={16} />
            </div>
          </ThematicContainer>
        </div>
      </div>

      {/* Ready Stage */}
      {stage === 'ready' && (
        <div className="flex flex-col items-center">
          <div className="bg-gray-800/30 rounded-xl p-6 mb-6 text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
              </svg>
            </div>
            <p className="text-gray-300 mb-4">
              Get ready to complete your challenge! The recording will start automatically after a 3-second countdown.
            </p>
            <p className="text-sm text-gray-400">
              Make sure you're in good lighting and your camera is positioned correctly.
            </p>
          </div>

          <PrimaryButton
            onClick={handleStartChallenge}
            text="Start Recording"
            className="w-full"
          />
        </div>
      )}

      {/* Countdown Stage */}
      {stage === 'countdown' && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-8xl font-bold text-pink-500 mb-4 animate-pulse">
            {countdown}
          </div>
          <p className="text-gray-300 text-lg">Get ready...</p>
        </div>
      )}

      {/* Recording Stage */}
      {stage === 'recording' && (
        <div className="flex flex-col">
          {/* Video Preview */}
          <div className="relative mb-4 rounded-xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-64 object-cover"
            />
            
            {/* Recording Indicator */}
            <div className="absolute top-4 left-4 flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white text-sm font-medium">REC</span>
            </div>

            {/* Timer */}
            <div className="absolute top-4 right-4 bg-black/50 rounded-lg px-3 py-1">
              <span className="text-white text-sm font-medium">{formatTime(recordingTime)}</span>
            </div>
          </div>

          {/* Recording Controls */}
          <div className="flex flex-col items-center">
            <button
              onClick={stopRecording}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 transition-colors"
              title="Stop recording"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
            
            <p className="text-xs text-gray-400 mt-2">
              Recording: {recordingTime}s
            </p>
          </div>
        </div>
      )}

      {/* Review Stage */}
      {stage === 'review' && (
        <div className="flex flex-col">
          {/* Video Preview */}
          <div className="relative mb-4 rounded-xl overflow-hidden bg-black">
            <video
              src={videoUrl}
              controls
              className="w-full h-64 object-cover"
            />
          </div>

          {/* Review Message */}
          <div className={`rounded-lg p-3 mb-6 border ${
            canSubmit 
              ? 'bg-green-900/20 border-green-800/30' 
              : 'bg-red-900/20 border-red-800/30'
          }`}>
            <div className="flex items-start gap-2">
              <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                canSubmit ? 'text-green-400' : 'text-red-400'
              }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {canSubmit ? (
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
              <div>
                <p className={`text-xs mb-1 ${
                  canSubmit ? 'text-green-300' : 'text-red-300'
                }`}>
                  {canSubmit 
                    ? `Perfect! Your ${actualRecordingDuration.toFixed(1)}s recording meets the requirements.`
                    : `Recording too short: ${actualRecordingDuration.toFixed(1)}s (minimum 3s required).`
                  }
                </p>
                <p className="text-xs text-gray-400">
                  {canSubmit 
                    ? 'Review your recording above. If you\'re happy with it, submit to complete the challenge!'
                    : 'Please record again for at least 3 seconds to ensure proper verification.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors"
            >
              Try Again
            </button>
            <PrimaryButton
              onClick={handleSubmit}
              text={canSubmit ? "Submit Challenge" : "Record Again (Too Short)"}
              className={`flex-1 ${!canSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!canSubmit}
            />
          </div>
        </div>
      )}

      {/* Selfie Verification Stage */}
      {stage === 'selfie' && videoBlob && (
        <VerificationSelfieScreen
          challenge={challenge}
          videoBlob={videoBlob}
          userId={userId}
          onComplete={handleSelfieComplete}
          onBack={() => setStage('review')}
        />
      )}
    </div>
  );
};

export default CompleteChallengeScreen;