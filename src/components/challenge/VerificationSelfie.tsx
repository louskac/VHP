'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import PrimaryButton from '../ui/PrimaryButton';
import ThematicContainer from '../ui/ThematicContainer';
import VerificationReviewScreen from './VerificationReview';

interface Challenge {
  title: string;
  description: string;
  challengerName: string;
  challengerProfile: string;
  reward: number;
  color: string;
}

interface VerificationSelfieScreenProps {
  challenge: Challenge;
  videoBlob: Blob;
  userId: string; // Add userId prop
  onComplete: (data: { video: Blob; photo: Blob; verificationResult?: any }) => void;
  onBack: () => void;
}

type Stage = 'ready' | 'countdown' | 'camera' | 'review' | 'verification';

const VerificationSelfieScreen: React.FC<VerificationSelfieScreenProps> = ({
  challenge,
  videoBlob,
  userId, // Destructure userId
  onComplete,
  onBack,
}) => {
  const [stage, setStage] = useState<Stage>('ready');
  const [countdown, setCountdown] = useState(3);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Countdown effect
  useEffect(() => {
    if (stage === 'countdown') {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setStage('camera');
            return 3;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [stage]);

  // Initialize camera when camera stage starts
  useEffect(() => {
    if (stage === 'camera') {
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
        audio: false
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
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

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        setPhotoBlob(blob);
        setPhotoUrl(URL.createObjectURL(blob));
        setStage('review');
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const handleStartSelfie = () => {
    setStage('countdown');
  };

  const handleSubmit = () => {
    if (photoBlob) {
      // Go to verification review screen instead of completing immediately
      setStage('verification');
    }
  };

  const handleVerificationComplete = (data: { video: Blob; photo: Blob; verificationResult?: any }) => {
    onComplete(data);
  };

  const handleRetry = () => {
    setPhotoBlob(null);
    setPhotoUrl('');
    setStage('ready');
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

      {/* Ready Stage */}
      {stage === 'ready' && (
        <div className="flex flex-col items-center">
          <div className="bg-gray-800/30 rounded-xl p-6 mb-6 text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <p className="text-gray-300 mb-4">
              We need to verify your identity with a clear selfie photo.
            </p>
            <div className="text-left space-y-2 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span>Look directly at the camera</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span>Ensure good lighting on your face</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span>Remove sunglasses or hats</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span>Keep your face centered in frame</span>
              </div>
            </div>
          </div>

          <PrimaryButton
            onClick={handleStartSelfie}
            text="Take Selfie"
            className="w-full"
          />
        </div>
      )}

      {/* Countdown Stage */}
      {stage === 'countdown' && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-8xl font-bold text-purple-500 mb-4 animate-pulse">
            {countdown}
          </div>
          <p className="text-gray-300 text-lg">Position yourself...</p>
        </div>
      )}

      {/* Camera Stage */}
      {stage === 'camera' && (
        <div className="flex flex-col">
          {/* Video Preview */}
          <div className="relative mb-4 rounded-xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-80 object-cover"
            />
            
            {/* Face Guide Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-60 border-2 border-white/50 rounded-full flex items-center justify-center">
                <div className="text-white/70 text-xs text-center">
                  <div>Center your face</div>
                  <div>in this area</div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 rounded-lg px-3 py-1">
              <span className="text-white text-sm">Look directly at the camera</span>
            </div>
          </div>

          {/* Capture Button */}
          <div className="flex justify-center">
            <button
              onClick={capturePhoto}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-6 transition-colors shadow-lg"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
          </div>

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}

      {/* Review Stage */}
      {stage === 'review' && (
        <div className="flex flex-col">
          {/* Photo Preview */}
          <div className="relative mb-4 rounded-xl overflow-hidden bg-black">
            <img
              src={photoUrl}
              alt="Verification selfie"
              className="w-full h-80 object-cover"
            />
          </div>

          {/* Review Message */}
          <div className="bg-blue-900/20 rounded-lg p-3 mb-6 border border-blue-800/30">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <circle cx="12" cy="17" r=".5" />
              </svg>
              <div>
                <p className="text-xs text-blue-300 mb-1">
                  Make sure your face is clearly visible and well-lit in the photo.
                </p>
                <p className="text-xs text-blue-400">
                  This photo will be used for identity verification purposes.
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
              Retake Photo
            </button>
            <PrimaryButton
              onClick={handleSubmit}
              text="Use This Photo"
              className="flex-1"
            />
          </div>
        </div>
      )}

      {/* Verification Review Stage */}
      {stage === 'verification' && photoBlob && (
        <VerificationReviewScreen
          challenge={challenge}
          videoBlob={videoBlob}
          photoBlob={photoBlob}
          userId={userId} // Pass userId prop
          onComplete={handleVerificationComplete}
          onBack={() => setStage('review')}
        />
      )}
    </div>
  );
};

export default VerificationSelfieScreen;