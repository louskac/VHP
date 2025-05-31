// lib/verification/steps/aiChallengeCheck.ts

export interface AIChallengeCheckResult {
    passed: boolean;
    confidence: number; // 0-100
    details: string;
    challengeCompleted: boolean;
    aiConfidence: number;
    explanation: string;
    score: number; // 0-100 from OpenAI
  }
  
  /**
   * STEP 4: AI Challenge Verification
   * Uses OpenAI GPT-4 Vision to analyze if the submitted video properly completes the given challenge
   * Returns a score from 0-100 based on completion quality and creativity
   */
  export async function runAIChallengeCheck(
    videoBlob: Blob,
    challengeDescription: string,
    onProgress?: (progress: number, message: string) => void
  ): Promise<AIChallengeCheckResult> {
    
    console.group('🤖 AI CHALLENGE VERIFICATION');
    console.log('Challenge:', challengeDescription);
    console.log('Video size:', `${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`);
  
    try {
      // Progress: Starting
      onProgress?.(5, 'Preparing video for AI analysis...');
  
      // Basic video validation
      if (!videoBlob.type.startsWith('video/')) {
        throw new Error('Invalid file format - not a video file');
      }
  
      if (videoBlob.size < 1024) {
        throw new Error('Video file too small for analysis');
      }
  
      if (videoBlob.size > 100 * 1024 * 1024) {
        throw new Error('Video file too large for AI analysis (>100MB)');
      }
  
      // Progress: Uploading
      onProgress?.(20, 'Uploading video to AI service...');
  
      // Prepare form data for API request
      const formData = new FormData();
      formData.append('video', videoBlob);
      formData.append('challengeDescription', challengeDescription);
  
      console.log('📤 Sending video to AI analysis API...');
  
      // Progress: AI analyzing
      onProgress?.(40, 'AI analyzing challenge completion...');
  
      // Call our AI challenge check API (App Router)
      const response = await fetch('/api/ai-challenge-check', {
        method: 'POST',
        body: formData,
      });
  
      // Progress: Processing response
      onProgress?.(80, 'Processing AI evaluation results...');
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ AI API Error Response:', errorText);
        throw new Error(`AI API request failed: ${response.status} - ${errorText}`);
      }
  
      const result = await response.json();
      console.log('📊 AI Analysis Response:', result);
  
      if (!result.success) {
        throw new Error(result.error || 'AI analysis failed');
      }
  
      // Interpret AI scoring
      const score = result.score || 0;
      const aiConfidence = result.confidence || 0;
      
      // Determine pass/fail based on score thresholds
      let passed = false;
      let challengeCompleted = false;
      
      if (score >= 60) {
        // Score 60+ means challenge was completed (even if basic)
        passed = true;
        challengeCompleted = true;
      } else if (score >= 40) {
        // Score 40-59 is uncertain, but we'll be lenient and pass it
        passed = true;
        challengeCompleted = true;
      } else {
        // Score under 40 means challenge likely not completed
        passed = false;
        challengeCompleted = false;
      }
  
      // Convert to 0-100 confidence scale
      const confidence = passed ? Math.max(60, score) : Math.min(40, score);
  
      // Create detailed explanation based on score
      let details = result.explanation || 'AI analysis completed';
      
      if (score >= 80) {
        details = `Excellent! ${details} (Score: ${score}/100 - Creative and engaging completion)`;
      } else if (score >= 60) {
        details = `Good! ${details} (Score: ${score}/100 - Challenge completed successfully)`;
      } else if (score >= 40) {
        details = `Acceptable. ${details} (Score: ${score}/100 - Partial completion detected)`;
      } else {
        details = `Challenge not completed. ${details} (Score: ${score}/100)`;
      }
  
      // Progress: Complete
      onProgress?.(100, details);
  
      console.log('📊 AI challenge verification result:', {
        score: `${score}/100`,
        passed,
        challengeCompleted,
        confidence: `${confidence}%`,
        aiConfidence: `${Math.round(aiConfidence * 100)}%`,
        explanation: result.explanation
      });
  
      console.log('✅ AI challenge check completed');
      console.groupEnd();
  
      return {
        passed,
        confidence,
        details,
        challengeCompleted,
        aiConfidence,
        explanation: result.explanation,
        score
      };
  
    } catch (error) {
      console.error('💥 AI challenge check error:', error);
      console.groupEnd();
  
      onProgress?.(100, 'AI verification failed due to error');
  
      // In development mode, you might want to be more lenient
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: simulating AI analysis due to error');
        
        return {
          passed: true,
          confidence: 75,
          details: 'AI analysis simulated (development mode)',
          challengeCompleted: true,
          aiConfidence: 0.75,
          explanation: 'Challenge appears to be completed (simulated)',
          score: 75
        };
      }
  
      return {
        passed: false,
        confidence: 0,
        details: `AI verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        challengeCompleted: false,
        aiConfidence: 0,
        explanation: 'AI analysis could not be completed due to technical error',
        score: 0
      };
    }
  }