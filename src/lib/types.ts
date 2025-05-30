// Type definitions for VHP package
export interface VHPChallenge {
    id: string;
    title: string;
    description: string;
    type: 'photo' | 'video' | 'selfie';
    difficulty?: 'easy' | 'medium' | 'hard';
  }
  
  export interface VHPUser {
    id: string;
    nocenaId: string;
    completedChallenges: number;
    lastVerification?: Date;
  }
  
  export interface VHPVerificationResult {
    success: boolean;
    token?: string;
    error?: string;
    userId?: string;
    challengeId?: string;
    timestamp: number;
  }
  
  export type VHPTheme = 'light' | 'dark';
  
  export interface VHPConfig {
    apiEndpoint?: string;
    theme?: VHPTheme;
    autoVerify?: boolean;
    debug?: boolean;
  }