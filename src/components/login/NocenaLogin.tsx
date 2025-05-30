'use client';

import React, { useState } from 'react';
import PrimaryButton from '../ui/PrimaryButton';

interface LoginModeProps {
  onSuccess: (token: string) => void;
  onFailed: (error: string) => void;
  apiEndpoint: string;
  onBack?: () => void;
}

const NocenaLogin: React.FC<LoginModeProps> = ({
  onSuccess,
  onFailed,
  apiEndpoint,
  onBack,
}) => {
  const [stage, setStage] = useState<'login' | 'verifying' | 'success'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string>('');

  const handleLogin = async () => {
    if (!username || !password) {
      onFailed('Please enter both username and password');
      return;
    }

    setStage('verifying');

    // Simulate verification process
    setTimeout(() => {
      // Mock successful verification
      const mockToken = 'vhp_login_' + Math.random().toString(36).substr(2, 9);
      setVerificationToken(mockToken);
      setStage('success');
      
      // Call onSuccess after showing success state
      setTimeout(() => {
        onSuccess(mockToken);
      }, 2000);
    }, 2000);
  };

  return (
    <div className="flex flex-col">
      {/* Back Button - Moved outside and positioned absolutely */}
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
      
      {stage === 'login' && (
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
            Login to your account. You must have completed at least 1 challenge.
          </p>

          {/* Login Form - Conjoined inputs */}
          <div className="bg-gray-800/50 rounded-[2rem] overflow-hidden border border-gray-600 divide-y divide-gray-600">
            {/* Username Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter Your Username"
                className="w-full pl-12 pr-4 py-3 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:bg-gray-700/50 transition-colors"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                  <path d="M2 2l20 20" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Your Password"
                className="w-full pl-12 pr-4 py-3 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:bg-gray-700/50 transition-colors"
              />
            </div>
          </div>

          {/* Primary Button */}
          <PrimaryButton
            className="mt-6"
            onClick={handleLogin}
            text="Login"
          />
        </>
      )}

      {stage === 'verifying' && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-300">Verifying your Nocena profile...</p>
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
          
          <h3 className="text-xl font-medium text-green-400 mb-2">Success!</h3>
          <p className="text-sm text-gray-300 text-center mb-4">Your identity has been verified</p>
          
          {/* Show verification token */}
          <div className="bg-gray-800/50 rounded-lg px-4 py-2 mb-4">
            <p className="text-xs text-gray-400">Token:</p>
            <p className="text-sm text-white font-mono">{verificationToken}</p>
          </div>
          
          <p className="text-xs text-gray-400">Redirecting...</p>
        </div>
      )}
    </div>
  );
};

export default NocenaLogin;