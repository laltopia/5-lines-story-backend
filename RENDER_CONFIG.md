# Render Configuration Guide

## Critical Issue: Build Command Not Running

Your Render deployment is currently configured to only run `npm install`, which doesn't build the Next.js application. This causes the error:

```
Error: Could not find a production build in the '.next' directory.
```

## Solution: Update Render Dashboard Settings

### Go to your Render Dashboard:

1. Navigate to your service: `5-lines-story`
2. Go to **Settings** → **Build & Deploy**
3. Update the following fields:

### Option 1: Use build.sh (Recommended)
```
Build Command: bash build.sh
Start Command: npm start
```

### Option 2: Use npm scripts
```
Build Command: npm run render:build
Start Command: npm run render:start
```

### Option 3: Manual commands
```
Build Command: npm ci && npm run build
Start Command: npm start
```

## Why This Is Needed

Next.js requires two phases:

### Build Phase (creates .next/ directory)
- Installs dependencies
- Compiles TypeScript
- Optimizes React components
- Bundles CSS with Tailwind
- Creates production-ready build in `.next/`

### Start Phase (runs the server)
- Reads from `.next/` directory
- Starts the production server
- Serves the application

**The build MUST happen in the Build Command, not the Start Command!**

## Verify It's Working

After updating the settings and redeploying, you should see:

### In Build Logs:
```
==> Running build command 'bash build.sh'...
📦 Installing dependencies...
🔨 Building Next.js application...
✅ Build successful!
```

### In Start Logs:
```
==> Running 'npm start'
> next start
  ▲ Next.js 14.2.33
  - Local:        http://localhost:10000
 ✓ Ready in XXXms
```

## Troubleshooting

### If you still see the error:
1. Clear build cache in Render dashboard
2. Trigger a manual deploy
3. Check that environment variables are set (see render.yaml)

### Required Environment Variables:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `NODE_ENV` (should be set to `production`)

## Alternative: Enable render.yaml

If your Render service can use Infrastructure as Code:

1. Go to Settings → General
2. Look for "Use Infrastructure as Code"
3. Enable it and point to `render.yaml` in your repo

The `render.yaml` file is already configured with the correct commands.
