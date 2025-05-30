// Model Verification Script
// Create a file named scripts/verifyModels.js

const fs = require('fs');
const path = require('path');

const modelsPath = path.join(process.cwd(), 'public/models/face-api');

// Required model files
const requiredFiles = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1'
];

console.log('Checking face-api.js models in:', modelsPath);

// Check if the directory exists
if (!fs.existsSync(modelsPath)) {
  console.error('ERROR: Models directory does not exist!');
  console.log('Creating directory structure...');
  fs.mkdirSync(modelsPath, { recursive: true });
  console.log('Created:', modelsPath);
  console.log('Please run the model download script to populate this directory.');
  process.exit(1);
}

// Check each required file
const missingFiles = [];
const existingFiles = [];

for (const file of requiredFiles) {
  const filePath = path.join(modelsPath, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    existingFiles.push({ file, size: formatBytes(stats.size) });
  } else {
    missingFiles.push(file);
  }
}

// Output results
console.log('\nVERIFICATION RESULTS:');
console.log('====================');

if (existingFiles.length > 0) {
  console.log('\nFound models:');
  existingFiles.forEach(item => {
    console.log(`✅ ${item.file} (${item.size})`);
  });
}

if (missingFiles.length > 0) {
  console.log('\nMissing models:');
  missingFiles.forEach(file => {
    console.log(`❌ ${file}`);
  });
  
  console.log('\nRun the following command to download missing models:');
  console.log('node scripts/downloadFaceApiModels.js');
  process.exit(1);
} else {
  console.log('\n✅ All required model files are present!');
  console.log('\nNext steps:');
  console.log('1. Ensure your app can access these files via the URL:');
  console.log('   https://localhost:3000/models/face-api/tiny_face_detector_model-weights_manifest.json');
  console.log('2. Test in your browser by directly visiting this URL');
}

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}