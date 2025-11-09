// ============================================
// SENTRY INITIALIZATION (MUST BE FIRST!)
// ============================================
// Import Sentry BEFORE everything else to capture all errors
const Sentry = require('./instrument');

// Now load environment variables
require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { clerkMiddleware } = require('@clerk/express');

const usersRouter = require('./routes/users');
const aiRouter = require('./routes/ai');

const app = express();

// ============================================
// TRUST PROXY (Required for Render, Heroku, etc.)
// ============================================
// Enable trust proxy to correctly identify client IPs behind reverse proxies
// This is essential for rate limiting and IP-based features to work correctly
app.set('trust proxy', 1);

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet for security headers (configured to allow Clerk, Sentry, and PostHog)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://noted-hornet-6.clerk.accounts.dev",
        "https://*.clerk.accounts.dev",
        "https://browser.sentry-cdn.com",
        "https://us-assets.i.posthog.com"
      ],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "https://noted-hornet-6.clerk.accounts.dev",
        "https://*.clerk.accounts.dev",
        "https://api.anthropic.com",
        "https://*.ingest.sentry.io",
        "https://o4510323955728384.ingest.us.sentry.io",
        "https://us.i.posthog.com",
        process.env.SUPABASE_URL
      ].filter(Boolean),
      workerSrc: ["'self'", "blob:"], // Allow web workers
      frameSrc: ["'self'", "https://*.clerk.accounts.dev"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  permissionsPolicy: {
    features: {
      geolocation: ["'none'"],
      microphone: ["'none'"],
      camera: ["'none'"],
      payment: ["'none'"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limiting for expensive AI endpoints
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 AI requests per windowMs
  message: {
    success: false,
    error: 'Too many AI requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);
app.use('/api/ai/', aiLimiter);

// ============================================
// STANDARD MIDDLEWARE
// ============================================

app.use(express.json({ limit: '10mb' })); // Add size limit to prevent large payload attacks
app.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY
}));

// ============================================
// STATIC FILES WITH CACHING
// ============================================

// Serve static files with optimized caching
// In production, use minified versions
const publicPath = path.join(__dirname, '../public');

// Optimized caching strategy for Lighthouse performance
app.use(express.static(publicPath, {
  maxAge: process.env.NODE_ENV === 'production' ? '5m' : 0, // Default 5 minutes in production
  etag: true,
  lastModified: true,
  immutable: false,
  setHeaders: (res, filePath) => {
    // Versioned static assets get 1 year cache (CSS, JS, fonts, images)
    if (filePath.match(/\.(css|js|woff|woff2|ttf|eot|jpg|jpeg|png|gif|ico|svg)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
    }
    // HTML files should revalidate frequently
    else if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate'); // 5 minutes
    }
  }
}));

// Rotas
app.use('/api/users', usersRouter);
app.use('/api/ai', aiRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date(),
    version: '9.0',
    clerk: process.env.CLERK_PUBLISHABLE_KEY ? 'configured' : 'not configured',
    anthropic: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not configured'
  });
});

// Endpoint para verificar sessão do usuário
app.get('/api/me', (req, res) => {
  if (req.auth?.userId) {
    res.json({
      authenticated: true,
      userId: req.auth.userId
    });
  } else {
    res.json({
      authenticated: false
    });
  }
});

// Test endpoint for Sentry (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.get("/debug-sentry", function mainHandler(req, res) {
    // Send a log before throwing the error
    Sentry.logger.info('User triggered test error', {
      action: 'test_error_endpoint',
    });
    throw new Error("Sentry test error - this is intentional!");
  });
}

// ============================================
// SENTRY ERROR HANDLER
// ============================================
// The Sentry error handler must be registered before any other error middleware
// and after all controllers/routes
Sentry.setupExpressErrorHandler(app);

// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // Log error for debugging
  console.error('Error caught by error handler:', err);

  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = err.statusCode || 500;
  res.json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'An error occurred. Please try again later.'
      : err.message,
    errorId: res.sentry // Include Sentry error ID for support
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
  console.log('Sentry error monitoring:', process.env.SENTRY_DSN ? 'enabled' : 'disabled (no DSN)');
});
