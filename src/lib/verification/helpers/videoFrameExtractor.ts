// lib/verification/helpers/videoFrameExtractor.ts

export interface FrameExtractionOptions {
  framesPerSecond?: number; // Default: 4 frames per second
  maxFrames?: number; // Default: 20 frames max
  quality?: number; // JPEG quality 0-1, default: 0.7
  maxDimension?: number; // Resize if larger, default: 640px
}

export interface FrameExtractionResult {
  frames: string[]; // Base64 encoded frames
  totalFrames: number;
  videoDuration: number;
  frameRate: number;
  videoResolution: { width: number; height: number };
}

/**
 * Extract frames from video blob on client-side
 * This must run in browser environment (not server-side)
 */
export async function extractVideoFrames(
  videoBlob: Blob,
  options: FrameExtractionOptions = {}
): Promise<FrameExtractionResult> {
  const {
    framesPerSecond = 4,
    maxFrames = 20,
    quality = 0.7,
    maxDimension = 64
  } = options;

  console.group('🎬 Video Frame Extraction');
  console.log('Options:', { framesPerSecond, maxFrames, quality, maxDimension });
  console.log('Video size:', `${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`);

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const frames: string[] = [];
    
    // Create object URL for video
    const videoUrl = URL.createObjectURL(videoBlob);
    
    video.onloadedmetadata = () => {
      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;
      
      console.log(`📹 Video loaded: ${width}x${height}, duration: ${duration.toFixed(2)}s`);
      
      // Calculate canvas dimensions (maintain aspect ratio)
      let canvasWidth = width;
      let canvasHeight = height;
      
      if (Math.max(width, height) > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        canvasWidth = Math.round(width * scale);
        canvasHeight = Math.round(height * scale);
        console.log(`📐 Resizing to: ${canvasWidth}x${canvasHeight} (scale: ${scale.toFixed(2)})`);
      }
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Calculate frame extraction parameters
      const frameInterval = 1 / framesPerSecond; // Seconds between frames
      const totalPossibleFrames = Math.ceil(duration * framesPerSecond);
      const framesToExtract = Math.min(totalPossibleFrames, maxFrames);
      const actualInterval = duration / framesToExtract; // Adjust interval if limited by maxFrames
      
      console.log(`📊 Extracting ${framesToExtract} frames (interval: ${actualInterval.toFixed(2)}s)`);
      
      let currentTime = 0;
      let frameCount = 0;
      
      const extractNextFrame = () => {
        if (frameCount >= framesToExtract || currentTime >= duration) {
          // Cleanup and resolve
          URL.revokeObjectURL(videoUrl);
          
          const result: FrameExtractionResult = {
            frames,
            totalFrames: frames.length,
            videoDuration: duration,
            frameRate: frames.length / duration,
            videoResolution: { width, height }
          };
          
          console.log(`✅ Extraction complete: ${frames.length} frames`);
          console.groupEnd();
          resolve(result);
          return;
        }
        
        video.currentTime = currentTime;
        
        const onSeeked = () => {
          try {
            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight);
            
            // Convert to base64 JPEG
            const frameData = canvas.toDataURL('image/jpeg', quality);
            const base64Data = frameData.split(',')[1]; // Remove data:image/jpeg;base64, prefix
            frames.push(base64Data);
            
            console.log(`📷 Frame ${frameCount + 1}/${framesToExtract} extracted (${currentTime.toFixed(2)}s)`);
            
            frameCount++;
            currentTime += actualInterval;
            
            // Continue to next frame
            setTimeout(extractNextFrame, 50);
          } catch (error) {
            console.warn(`⚠️ Failed to extract frame at ${currentTime.toFixed(2)}s:`, error);
            frameCount++;
            currentTime += actualInterval;
            setTimeout(extractNextFrame, 50);
          }
        };
        
        video.onseeked = onSeeked;
        
        // Handle seek errors
        video.onerror = () => {
          console.warn(`⚠️ Video seek error at ${currentTime.toFixed(2)}s, skipping...`);
          frameCount++;
          currentTime += actualInterval;
          setTimeout(extractNextFrame, 50);
        };
      };
      
      // Start extraction
      extractNextFrame();
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error('Failed to load video for frame extraction'));
    };
    
    // Load the video
    video.src = videoUrl;
    video.load();
  });
}

/**
 * Estimate token usage for OpenAI API based on frame count and dimensions
 */
export function estimateTokenUsage(result: FrameExtractionResult): number {
  // OpenAI charges ~765 tokens per image at 512x512
  // Scale based on our actual image size
  const { frames, videoResolution } = result;
  const pixelCount = videoResolution.width * videoResolution.height;
  const basePixels = 512 * 512; // Reference size
  const tokensPerImage = Math.round(765 * (pixelCount / basePixels));
  return frames.length * tokensPerImage;
}

/**
 * Create a preview of extracted frames (for debugging)
 */
export function createFramePreview(frames: string[]): string {
  if (frames.length === 0) return 'No frames extracted';
  
  const sampleFrames = frames.slice(0, 5); // First 5 frames
  return `Extracted ${frames.length} frames. Sample frame sizes: ${sampleFrames.map(f => `${(f.length / 1024).toFixed(1)}KB`).join(', ')}`;
}

/**
 * Validate video before frame extraction
 */
export function validateVideoForExtraction(videoBlob: Blob): { valid: boolean; error?: string } {
  if (!videoBlob.type.startsWith('video/')) {
    return { valid: false, error: 'File is not a video' };
  }
  
  if (videoBlob.size < 1024) {
    return { valid: false, error: 'Video file too small' };
  }
  
  if (videoBlob.size > 100 * 1024 * 1024) {
    return { valid: false, error: 'Video file too large (>100MB)' };
  }
  
  return { valid: true };
}