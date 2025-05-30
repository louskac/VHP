// scripts/downloadFaceApiModels.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Create directory for models
const modelsDir = path.join(process.cwd(), 'public/models/face-api');

// Ensure the directory exists
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
  console.log(`Created directory: ${modelsDir}`);
}

// Base URL for face-api.js models
const baseUrl = 'https://github.com/justadudewhohacks/face-api.js/raw/master/weights';

// List of model files to download
const modelFiles = [
  // Tiny Face Detector
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  
  // Face Landmark Detection
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  
  // Face Recognition
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  
  // Face Expression
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1',
];

// Download a file from URL to destination
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        downloadFile(response.headers.location, dest)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// Download all model files
async function downloadAllModels() {
  console.log('Starting download of face-api.js models...');
  
  let downloadedCount = 0;
  const totalFiles = modelFiles.length;
  
  for (const fileName of modelFiles) {
    const fileUrl = `${baseUrl}/${fileName}`;
    const filePath = path.join(modelsDir, fileName);
    
    try {
      console.log(`Downloading ${fileName}...`);
      await downloadFile(fileUrl, filePath);
      downloadedCount++;
      console.log(`Downloaded ${downloadedCount}/${totalFiles}: ${fileName}`);
    } catch (error) {
      console.error(`Error downloading ${fileName}:`, error.message);
    }
  }
  
  console.log(`\nDownload complete! ${downloadedCount}/${totalFiles} files downloaded.`);
  console.log(`Models saved to: ${modelsDir}`);
}

// Alternative: Use curl or wget if available
function downloadUsingCliTools() {
  try {
    console.log('Trying to download using curl...');
    
    // Change to models directory
    process.chdir(modelsDir);
    
    for (const fileName of modelFiles) {
      const fileUrl = `${baseUrl}/${fileName}`;
      console.log(`Downloading ${fileName}...`);
      
      try {
        // Try with curl
        execSync(`curl -L -o "${fileName}" "${fileUrl}"`, { stdio: 'inherit' });
      } catch (e) {
        // Fall back to wget if curl fails
        console.log('Curl failed, trying wget...');
        execSync(`wget -O "${fileName}" "${fileUrl}"`, { stdio: 'inherit' });
      }
    }
    
    console.log('\nDownload complete!');
    console.log(`Models saved to: ${modelsDir}`);
    
  } catch (error) {
    console.error('Failed to download using CLI tools:', error.message);
    console.log('Falling back to Node.js download method...');
    downloadAllModels();
  }
}

// Try to use CLI tools first (faster), fall back to Node.js implementation
try {
  // Check if curl or wget is available
  try {
    execSync('curl --version', { stdio: 'ignore' });
    downloadUsingCliTools();
  } catch (e) {
    try {
      execSync('wget --version', { stdio: 'ignore' });
      downloadUsingCliTools();
    } catch (e) {
      // Neither curl nor wget is available
      downloadAllModels();
    }
  }
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}