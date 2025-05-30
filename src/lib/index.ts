// Main export file for the VHP package
export { default as VHPCaptcha } from '../components/VHPCaptcha';
export type { VHPCaptchaProps } from '../components/VHPCaptcha';

// Export types that might be useful for consumers
export interface VHPConfig {
  apiEndpoint?: string;
  theme?: 'light' | 'dark';
  autoVerify?: boolean;
}

export interface VHPVerificationResult {
  success: boolean;
  token?: string;
  error?: string;
  userId?: string;
  challengeId?: string;
}

// Utility function to initialize VHP
export const initVHP = (config?: VHPConfig) => {
  // This could set up global configuration, analytics, etc.
  console.log('VHP initialized with config:', config);
  return {
    version: '0.1.0',
    config,
  };
};