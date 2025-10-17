import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    new Sentry.Replay({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
    new Sentry.BrowserTracing({
      // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
      tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
    }),
  ],

  // Release Health
  environment: process.env.NODE_ENV,

  // Set tags that will be applied to all events
  initialScope: {
    tags: {
      component: 'client'
    }
  },

  // Performance monitoring
  enabled: process.env.NODE_ENV === 'production',

  // Filter out specific errors
  beforeSend(event, hint) {
    // Filter out network errors and other non-actionable errors
    if (event.exception) {
      const error = hint.originalException
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as Error).message

        // Filter out common non-actionable errors
        const errorMessage = String(message)
        if (
          errorMessage.includes('Network Error') ||
          errorMessage.includes('fetch') ||
          errorMessage.includes('Script error') ||
          errorMessage.includes('Non-Error promise rejection captured')
        ) {
          return null
        }
      }
    }

    return event
  },

  // Set user context when available
  beforeBreadcrumb(breadcrumb) {
    // Filter out noisy breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
      return null
    }
    return breadcrumb
  }
})
