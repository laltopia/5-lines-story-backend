# Sentry Error Monitoring Setup

## Overview

Sentry is now integrated into StoryMaking.AI for real-time error tracking and monitoring.

## What's Been Configured

### Backend (Node.js)
- ✅ Sentry Node.js SDK installed
- ✅ `backend/instrument.js` created for initialization
- ✅ Error handler configured in `backend/server.js`
- ✅ CSP headers updated to allow Sentry
- ✅ Test endpoint added: `/debug-sentry` (development only)

### Frontend (Browser JavaScript)
- ✅ Sentry browser SDK integrated via CDN
- ✅ Added to all HTML pages: `index.html`, `ai.html`, `history.html`, `pricing.html`, `terms.html`, `privacy.html`
- ✅ Performance monitoring enabled (10% sampling)
- ✅ Session replay enabled (10% normal, 100% on errors)
- ✅ Automatic page load tracking
- ✅ Environment detection (localhost = development)

## Setup Instructions

### 1. Add Sentry DSN to Environment Variables

The Sentry DSN is already in `.env.example`. You need to add it to your actual environment:

**For local development:**
Create a `.env` file in the root directory:
```bash
SENTRY_DSN=https://6d7672a39d3c9a15ccd94979c6ac4ca3@o4510323955728384.ingest.us.sentry.io/4510323974602752
```

**For production (Render/Heroku/etc.):**
Add the environment variable in your hosting platform's dashboard:
```
SENTRY_DSN=https://6d7672a39d3c9a15ccd94979c6ac4ca3@o4510323955728384.ingest.us.sentry.io/4510323974602752
```

### 2. Test Sentry Integration

**Start the server:**
```bash
npm start
```

**Test error reporting (in development):**
```bash
curl http://localhost:3000/debug-sentry
```

This will trigger a test error that should appear in your Sentry dashboard within seconds.

**Check Sentry dashboard:**
Go to: https://sentry.io/organizations/your-org/issues/

You should see the test error appear with full stack trace and context.

## What Gets Tracked

### Automatically Tracked:
- ✅ Unhandled exceptions
- ✅ Unhandled promise rejections
- ✅ Express route errors
- ✅ HTTP request context (URL, method, headers)
- ✅ User IP addresses (with `sendDefaultPii: true`)
- ✅ Performance metrics (with 10% sampling in production)

### Privacy & Security:
- ❌ Authorization headers are filtered out
- ❌ Cookie headers are filtered out
- ⚠️ IP addresses are collected (can be disabled if needed)

## Adding Custom Error Tracking

You can manually track errors in your code:

### Capture an exception:
```javascript
const Sentry = require('./instrument');

try {
  // Your code
  throw new Error('Something went wrong');
} catch (error) {
  Sentry.captureException(error);
}
```

### Add breadcrumbs (context):
```javascript
Sentry.addBreadcrumb({
  category: 'story',
  message: 'User generated story',
  level: 'info',
  data: {
    storyId: '123',
    tokensUsed: 450
  }
});
```

### Set user context:
```javascript
Sentry.setUser({
  id: userId,
  email: userEmail // optional
});
```

### Log custom messages:
```javascript
Sentry.logger.info('User action', {
  action: 'story_created',
  storyId: '123'
});
```

## Environment Configuration

### Development
- All errors are tracked
- Test endpoint `/debug-sentry` is available
- 100% performance monitoring sampling
- Errors are also logged to console

### Production
- Only real errors are tracked
- Test endpoint is disabled
- 10% performance monitoring sampling
- User-friendly error messages returned to clients

## Sentry Dashboard

**View errors:** https://sentry.io/organizations/your-org/issues/
**View performance:** https://sentry.io/organizations/your-org/performance/

## Disabling Sentry

To temporarily disable Sentry (e.g., for testing):

**Remove or comment out the DSN:**
```bash
# SENTRY_DSN=...
```

The server will start normally but won't send errors to Sentry.

## Cost

**Free tier includes:**
- 5,000 errors per month
- 10,000 performance transactions per month
- 30-day data retention

This should be more than enough for the initial launch.

## Frontend Error Tracking

### What Gets Tracked Automatically:
- ✅ JavaScript errors and exceptions
- ✅ Unhandled promise rejections
- ✅ Console errors
- ✅ Network request failures
- ✅ Page load performance
- ✅ User interactions (with Session Replay)

### Testing Frontend Sentry:

**Method 1: Trigger a JavaScript error**
Open browser console on any page and run:
```javascript
throw new Error("Frontend Sentry test error");
```

**Method 2: Test unhandled promise rejection**
```javascript
Promise.reject("Test promise rejection");
```

**Method 3: Test from your code**
In `public/ai.js` or `public/history.js`, add:
```javascript
// Test Sentry
Sentry.captureMessage("Test message from frontend");
```

### Session Replay Feature:

Sentry will record 10% of sessions and 100% of sessions where errors occur. This lets you see exactly what the user was doing when an error happened:
- Mouse movements and clicks
- Page navigation
- Console logs
- Network requests

View replays in: **Sentry Dashboard → Replays**

## Next Steps

1. ✅ Backend error monitoring is complete
2. ✅ Frontend error monitoring is complete
3. ⏳ Set up alerts and notifications
4. ⏳ Configure issue assignment rules
5. ⏳ Integrate with Slack/Discord for real-time alerts
6. ⏳ Add custom event tracking (story created, line refined, etc.)

## Troubleshooting

### "Sentry error monitoring: disabled (no DSN)"
- Check that `SENTRY_DSN` is set in your environment variables
- Verify the DSN format is correct
- Restart the server after adding the DSN

### Errors not appearing in Sentry dashboard
- Check your internet connection
- Verify the DSN is correct
- Check Sentry's status page: https://status.sentry.io/
- Look for console errors mentioning Sentry

### CSP errors blocking Sentry
- Ensure CSP headers include Sentry domains (already configured)
- Check browser console for CSP violation warnings

## Support

- Sentry docs: https://docs.sentry.io/platforms/node/
- StoryMaking.AI issues: https://github.com/yourusername/storymaking-ai/issues
