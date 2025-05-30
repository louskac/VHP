'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ThematicContainer from './ui/ThematicContainer';
import ChallengeMode from './challenge/ChallengeMode';
import NocenaLogin from './login/NocenaLogin';
import WorldLogin from './login/WorldLogin';

export interface VHPCaptchaProps {
  onVerified: (token: string) => void;
  onFailed?: (error: string) => void;
  apiEndpoint?: string;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const VHPCaptcha: React.FC<VHPCaptchaProps> = ({
  onVerified,
  onFailed,
  apiEndpoint = '/api/vhp/verify',
  className = '',
  isOpen = true,
  onClose,
}) => {
  const [mode, setMode] = useState<'initial' | 'challenge' | 'nocena' | 'world' | 'success' | 'failed'>('initial');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const handleVerificationSuccess = (token: string) => {
    setVerificationToken(token);
    setMode('success');
    onVerified(token);
    
    setTimeout(() => {
      if (onClose) onClose();
      setMode('initial');
    }, 2000);
  };

  const handleVerificationFailed = (error: string) => {
    setMode('failed');
    if (onFailed) onFailed(error);
  };

  const resetState = () => {
    setMode('initial');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Popup content */}
      <motion.div
        layout
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <ThematicContainer
          color="nocenaBlue"
          isActive={false}
          glassmorphic={false}
          rounded="xl"
          asButton={false}
          className="relative z-10 w-[400px] p-8"
        >
          {/* Initial State - Now with 3 buttons */}
          {mode === 'initial' && (
            <div className="w-full">
              <h2 className="text-2xl font-medium text-center mb-6 text-white">
                Verify you're a human
              </h2>
              
              <div className="flex gap-3 justify-center px-4">
                <ThematicContainer
                  color="nocenaPurple"
                  isActive={false}
                  glassmorphic={false}
                  rounded="full"
                  className="w-[110px] py-2 text-center h-[48px] flex items-center"
                  onClick={() => setMode('nocena')}
                >
                  <div className="flex items-center gap-3 justify-center w-full">
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 scale-150">
                      <img 
                        src="/images/nocena-logo.png" 
                        alt="Nocena" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-base font-medium">Login</span>
                  </div>
                </ThematicContainer>

                <ThematicContainer
                  color="nocenaBlue"
                  isActive={false}
                  glassmorphic={false}
                  rounded="full"
                  className="w-[110px] py-2 text-center h-[48px] flex items-center"
                  onClick={() => setMode('world')}
                >
                  <div className="flex items-center gap-3 justify-center w-full">
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 scale-150">
                      <img 
                        src="/images/world-small.png" 
                        alt="Nocena" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-base font-medium">Login</span>
                  </div>
                </ThematicContainer>
                
                <ThematicContainer
                  color="nocenaPink"
                  isActive={false}
                  glassmorphic={false}
                  rounded="full"
                  className="w-[110px] py-3 px-4 text-center h-[48px] flex items-center justify-center"
                  onClick={() => setMode('challenge')}
                >
                  <span className="text-base font-medium">Challenge</span>
                </ThematicContainer>
              </div>
            </div>
          )}

          {/* Challenge Mode */}
          {mode === 'challenge' && (
            <div className="relative">
              <ChallengeMode
                onSuccess={handleVerificationSuccess}
                onFailed={handleVerificationFailed}
                apiEndpoint={apiEndpoint}
                onBack={resetState}
              />
            </div>
          )}

          {/* Login Mode */}
          {mode === 'nocena' && (
            <div className="relative">
              <NocenaLogin
                onSuccess={handleVerificationSuccess}
                onFailed={handleVerificationFailed}
                apiEndpoint={apiEndpoint}
                onBack={resetState}
              />
            </div>
          )}
          {mode === 'world' && (
            <div className="relative">
              <WorldLogin
                onSuccess={handleVerificationSuccess}
                onFailed={handleVerificationFailed}
                apiEndpoint={apiEndpoint}
                onBack={resetState}
              />
            </div>
          )}

          {/* Success State */}
          {mode === 'success' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-green-400">Verified!</h3>
              <p className="text-sm text-gray-300 mt-2">You're human. Token earned!</p>
            </motion.div>
          )}

          {/* Failed State */}
          {mode === 'failed' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-red-400">Verification Failed</h3>
              <p className="text-sm text-gray-300 mt-2">Please try again</p>
              <button
                onClick={resetState}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm text-white"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </ThematicContainer>
      </motion.div>
    </div>
  );
};

export default VHPCaptcha;