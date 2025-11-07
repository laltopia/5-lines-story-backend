// ============================================
// SENTRY ERROR MONITORING INITIALIZATION
// ============================================
// This file must be imported FIRST in server.js
// to ensure Sentry captures all errors

const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Set environment (production, development, staging)
  environment: process.env.NODE_ENV || 'development',

  // Send structured logs to Sentry
  enableLogs: true,

  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,

  // Set sample rate for transactions (performance monitoring)
  // 1.0 = 100% of transactions, 0.1 = 10% of transactions
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Configure integrations
  integrations: [
    // Add profiling integration if needed
    // new Sentry.ProfilingIntegration(),
  ],

  // Before send hook - useful for filtering sensitive data
  beforeSend(event, hint) {
    // Filter out errors in development if desired
    // if (process.env.NODE_ENV === 'development') {
    //   return null;
    // }

    // Remove sensitive data from error context
    if (event.request) {
      // Remove authorization headers from being sent to Sentry
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
    }

    return event;
  },
});

module.exports = Sentry;
