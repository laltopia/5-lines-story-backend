# PostHog Analytics Setup

## Overview

PostHog is integrated into StoryMaking.AI for user behavior analytics and product insights.

## What's Been Configured

### Frontend Integration
- ✅ PostHog HTML snippet integrated via CDN
- ✅ Added to all 6 HTML pages: `index.html`, `ai.html`, `history.html`, `pricing.html`, `terms.html`, `privacy.html`
- ✅ Project key: `phc_OSy3hvI8Hz2qmurJ7drszcTBUknq44HPzowALOdORMv`
- ✅ API host: `https://us.i.posthog.com` (US region)
- ✅ Person profiles: `identified_only` (privacy-friendly)
- ✅ CSP headers updated to allow PostHog

## What PostHog Tracks Automatically

### Page Views
- Every page visit is tracked automatically
- Page URL, referrer, browser info
- User location (city/country level)

### User Sessions
- Session duration
- Pages per session
- Entry and exit pages

### User Properties
- Browser, OS, device type
- Screen resolution
- Timezone

## Configuration

PostHog is already configured in all HTML files. No environment variables needed for basic functionality.

**Project Key:** `phc_OSy3hvI8Hz2qmurJ7drszcTBUknq44HPzowALOdORMv` (public, safe to expose)
**API Host:** `https://us.i.posthog.com`
**Person Profiles:** `identified_only` - Only creates profiles for authenticated users

## Custom Event Tracking

To track specific user actions, add custom events in your JavaScript files:

### Basic Event
```javascript
// In public/ai.js or public/history.js
posthog.capture('story_generated', {
  pathSelected: pathTitle,
  tokensUsed: tokensCount,
  duration: generationTime
});
```

### Recommended Events to Implement

**Story Creation Flow:**
```javascript
// When user enters story idea
posthog.capture('story_idea_entered', {
  ideaLength: input.length
});

// When path is selected
posthog.capture('story_path_selected', {
  pathId: selectedPath.id,
  pathTitle: selectedPath.title
});

// When story is generated
posthog.capture('story_generated', {
  success: true,
  tokensUsed: response.tokensUsed,
  generationTime: duration
});

// When line is refined with AI
posthog.capture('line_refined', {
  lineNumber: lineNum,
  refinementType: 'ai_assisted'
});

// When story is saved
posthog.capture('story_saved', {
  storyId: story.id,
  hasTitle: !!story.title
});
```

**User Engagement:**
```javascript
// When story is shared
posthog.capture('story_shared', {
  storyId: story.id,
  shareMethod: 'clipboard'
});

// When pricing page is viewed
posthog.capture('pricing_viewed', {
  source: 'navigation'
});

// When user signs up
posthog.capture('user_signed_up', {
  method: 'clerk'
});
```

### Identifying Users

When a user signs in with Clerk, identify them in PostHog:

```javascript
// In Clerk onSignIn callback
window.Clerk.addListener((session) => {
  if (session?.user) {
    posthog.identify(session.user.id, {
      email: session.user.emailAddresses[0].emailAddress,
      name: session.user.fullName,
      signupDate: session.user.createdAt
    });
  }
});
```

## PostHog Dashboard

**Access your analytics:**
https://app.posthog.com

**Key metrics to monitor:**
1. **Insights → Trends** - Page views over time
2. **Insights → Funnels** - Story creation conversion funnel
3. **Insights → Retention** - User return rate
4. **Insights → User Paths** - How users navigate your app
5. **Session Recordings** - Watch actual user sessions (enable if desired)

## Privacy & GDPR Compliance

PostHog is configured for privacy:

✅ **Person profiles:** Only created for authenticated users
✅ **No cookies:** Uses localStorage only
✅ **IP anonymization:** Can be enabled if needed
✅ **GDPR compliant:** Respects Do Not Track
✅ **Data residency:** US region (can be changed to EU if needed)

### Opt-out
Users can opt out by calling:
```javascript
posthog.opt_out_capturing();
```

### Disable Locally
To disable PostHog in development:
```javascript
// Add before posthog.init()
if (window.location.hostname === 'localhost') {
  window.posthog = {
    capture: () => {},
    identify: () => {},
    // Mock all methods
  };
}
```

## Testing

**Test that PostHog is loaded:**
Open browser console on any page:
```javascript
posthog.isFeatureEnabled('test'); // Should not throw error
console.log(posthog._isIdentified()); // Shows if user is identified
```

**Manually trigger a test event:**
```javascript
posthog.capture('test_event', {
  source: 'manual_test',
  timestamp: new Date()
});
```

Then check PostHog dashboard → Activity → Live Events to see it appear.

## Cost

**Free tier includes:**
- 1 million events/month
- Unlimited team members
- 1 year data retention
- All core analytics features

This is more than enough for initial launch and growth!

## Next Steps

1. ✅ PostHog is integrated on all pages
2. ⏳ Add custom event tracking for key user actions
3. ⏳ Set up conversion funnels in dashboard
4. ⏳ Create user retention cohorts
5. ⏳ Enable session recordings (optional)
6. ⏳ Set up alerts for important metrics

## Useful Resources

- PostHog docs: https://posthog.com/docs
- Event capture guide: https://posthog.com/docs/product-analytics/capture-events
- Funnels guide: https://posthog.com/docs/product-analytics/funnels
- Retention guide: https://posthog.com/docs/product-analytics/retention

## Troubleshooting

### PostHog not loading
- Check browser console for errors
- Verify CSP headers allow `us-assets.i.posthog.com` and `us.i.posthog.com`
- Check network tab for failed requests

### Events not appearing in dashboard
- Wait 1-2 minutes for events to process
- Check Activity → Live Events for real-time feed
- Verify events are being captured: `posthog.capture('test')`

### User not identified
- Ensure `posthog.identify()` is called after user signs in
- Check that user ID is correct
- Verify Clerk session is active
