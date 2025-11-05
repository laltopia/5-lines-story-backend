#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for Next.js production build...');

const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID');

if (!fs.existsSync(buildIdPath)) {
  console.log('⚠️  No production build found!');
  console.log('🔨 Building Next.js application...');

  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Production build found!');
}

console.log('🚀 Starting production server...');
execSync('npx next start', { stdio: 'inherit' });
