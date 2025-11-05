#!/bin/bash
set -e

echo "🔍 Checking for production build..."

# Check if .next directory exists and has build-manifest.json
if [ ! -f ".next/BUILD_ID" ]; then
    echo "⚠️  No production build found!"
    echo "🔨 Building Next.js application..."
    npm run build
    echo "✅ Build completed successfully!"
else
    echo "✅ Production build found!"
fi

echo "🚀 Starting production server..."
npm start
