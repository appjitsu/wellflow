import * as Sentry from "@sentry/nextjs";

// Prevent multiple Sentry initializations
if (typeof window !== 'undefined' && !window.__SENTRY_INITIALIZED__) {
  window.__SENTRY_INITIALIZED__ = true;

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "development",

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: process.env.NODE_ENV === "development",

    // Session Replay configuration
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0.1,

    integrations: [
      Sentry.replayIntegration({
        // Additional Replay configuration goes in here, for example:
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    beforeSend(event) {
      // Filter out sensitive data
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      // Don't send events for development 404s
      if (process.env.NODE_ENV === "development" && event.exception) {
        const error = event.exception.values?.[0];
        if (
          error?.type === "ChunkLoadError" ||
          error?.value?.includes("Loading chunk")
        ) {
          return null;
        }
      }

      return event;
    },
  });

  console.log("✅ Sentry client initialized");
}
