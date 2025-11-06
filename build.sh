#!/bin/bash

set -e  # Exit on error

echo "🔧 Starting Render Build Process..."
echo ""

# Step 1: Clean install dependencies
echo "📦 Installing dependencies with npm ci..."
npm ci

# Step 2: Build Next.js application
echo ""
echo "🔨 Building Next.js application..."
npm run build

# Step 3: Verify build was successful
echo ""
echo "✅ Verifying build..."
if [ -f ".next/BUILD_ID" ]; then
    echo "✅ Build successful! .next/BUILD_ID found"
    echo "📦 Build ID: $(cat .next/BUILD_ID)"
else
    echo "❌ Build failed! .next/BUILD_ID not found"
    exit 1
fi

echo ""
echo "🎉 Build completed successfully!"
