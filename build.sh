#!/bin/bash
set -e

echo "🧹 Cleaning old dependencies..."
rm -rf node_modules
rm -f package-lock.json

echo "📦 Installing fresh dependencies..."
npm install

echo "🔨 Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"
