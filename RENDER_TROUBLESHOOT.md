# Render Deployment Troubleshooting

## Issue: Only 102 Packages Installed (Expected ~448)

If you're seeing this error:
```
added 102 packages, and audited 103 packages
Module not found: Can't resolve '@/components/Navbar'
```

### Root Cause
Render is likely using a **cached version of package-lock.json** from a previous build, or the build is running in an unexpected state.

### Solution Steps

#### 1. Clear Render Build Cache (CRITICAL)
1. Go to your Render Dashboard
2. Navigate to your service: **5-lines-story**
3. Click **Settings** in the left sidebar
4. Scroll down to **Build & Deploy** section
5. Click the **Clear build cache** button
6. Confirm the action

#### 2. Verify Build Command
Make sure your build command is set to ONE of these options:

**Option A (with diagnostics):**
```bash
bash build.sh
```

**Option B (direct):**
```bash
npm ci && npm run build
```

**Option C (using npm scripts):**
```bash
npm run render:build
```

#### 3. Verify Start Command
```bash
npm start
```

#### 4. Trigger Manual Deploy
1. After clearing cache and updating settings
2. Go to **Manual Deploy** → **Deploy latest commit**
3. Or push a new commit to trigger auto-deploy

### Expected Build Output

After clearing cache, you should see:

```
📊 Diagnostic Information:
  - Node version: v25.x.x
  - package.json exists: YES
  - package-lock.json size: 6787 lines

📦 Installing dependencies with npm ci...
added 447 packages, and audited 448 packages

✅ Dependency installation complete!
  - next: YES
  - react: YES
  - tailwindcss: YES

🔨 Building Next.js application...
✓ Compiled successfully
✓ Generating static pages (12/12)

✅ Build successful!
```

### Still Having Issues?

If clearing the cache doesn't work:

1. **Check package-lock.json in your repo:**
   ```bash
   wc -l package-lock.json
   # Should show: 6787 lines
   ```

2. **Verify the commit:**
   ```bash
   git log -1 --oneline
   # Should show: fix: Add build.sh script...
   ```

3. **Try deleting and recreating the service:**
   - Sometimes Render's cache can get stuck
   - Create a new service pointing to the same repo
   - Make sure to set environment variables

### Alternative: Use render.yaml

Enable **Infrastructure as Code** in Render:
1. Settings → General
2. Enable "Infrastructure as Code"
3. Point to `render.yaml` in your repo
4. Render will use the configuration from the file

The `render.yaml` already has the correct settings:
```yaml
buildCommand: npm ci && npm run build
startCommand: npm start
```

### Required Environment Variables

Make sure these are set in Render Dashboard:
- `NODE_ENV=production`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

### Contact Support

If none of these solutions work, contact Render support with:
- Service name: 5-lines-story
- Commit: 6076f88d3a313cedc76595a46b18c687bd3b5e95
- Issue: package-lock.json appears cached, only 102 packages installed instead of 447

They can manually clear server-side caches.
