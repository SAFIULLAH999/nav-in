import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  // Performance monitoring
  enabled: process.env.NODE_ENV === 'production',

  // Release Health
  environment: process.env.NODE_ENV,

  // Set tags that will be applied to all events
  initialScope: {
    tags: {
      component: 'server'
    }
  },

  // Filter out specific errors
  beforeSend(event, hint) {
    // Filter out network errors and other non-actionable errors
    if (event.exception) {
      const error = hint.originalException
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as Error).message
        const errorMessage = String(message)

        // Filter out common non-actionable errors
        if (
          errorMessage.includes('Network Error') ||
          errorMessage.includes('fetch') ||
          errorMessage.includes('Script error') ||
          errorMessage.includes('Non-Error promise rejection captured') ||
          errorMessage.includes('Client disconnected') ||
          errorMessage.includes('aborted')
        ) {
          return null
        }
      }
    }

    return event
  },

  // Performance monitoring for API routes
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection(),
  ],
})
