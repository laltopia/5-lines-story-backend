#!/bin/bash

set -e  # Exit on error

echo "🔧 Starting Render Build Process..."
echo ""

# Diagnostic information
echo "📊 Diagnostic Information:"
echo "  - Node version: $(node --version)"
echo "  - npm version: $(npm --version)"
echo "  - Working directory: $(pwd)"
echo "  - package.json exists: $([ -f package.json ] && echo 'YES' || echo 'NO')"
echo "  - package-lock.json exists: $([ -f package-lock.json ] && echo 'YES' || echo 'NO')"
echo "  - package-lock.json size: $(wc -l < package-lock.json 2>/dev/null || echo 'N/A') lines"
echo ""

# Show package.json name and version
echo "📦 Package Info:"
cat package.json | grep -A2 '"name"' | head -3
echo ""

# Step 1: Force fresh package-lock.json (bypass Render cache)
echo "🗑️  Removing cached package-lock.json..."
rm -f package-lock.json
echo "  Deleted to force fresh dependency resolution"
echo ""

# Step 2: Install dependencies and generate fresh lock file
echo "📦 Installing dependencies with npm install..."
echo "  Note: This will generate a fresh package-lock.json from package.json"
npm install --legacy-peer-deps

# Count installed packages
echo ""
echo "✅ Dependency installation complete!"
echo "  - Total node_modules dirs: $(ls -1 node_modules 2>/dev/null | wc -l)"
echo "  - Key packages installed:"
echo "    - next: $([ -d node_modules/next ] && echo 'YES' || echo 'NO')"
echo "    - react: $([ -d node_modules/react ] && echo 'YES' || echo 'NO')"
echo "    - tailwindcss: $([ -d node_modules/tailwindcss ] && echo 'YES' || echo 'NO')"
echo ""

# Step 2: Build Next.js application
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
