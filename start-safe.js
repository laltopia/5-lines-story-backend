#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Checking for Next.js production build...');

const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID');

if (!fs.existsSync(buildIdPath)) {
  console.error('❌ ERROR: No production build found!');
  console.error('');
  console.error('The .next directory does not exist or is incomplete.');
  console.error('');
  console.error('🔧 To fix this on Render:');
  console.error('   1. Go to Settings → Build & Deploy');
  console.error('   2. Set Build Command to: npm ci && npm run build');
  console.error('   3. Set Start Command to: npm start');
  console.error('   4. Clear build cache and redeploy');
  console.error('');
  console.error('The build MUST complete during the Build phase, not the Start phase.');
  process.exit(1);
}

console.log('✅ Production build found!');
console.log('🚀 Starting production server...');

try {
  execSync('npx next start', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
}
