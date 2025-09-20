import * as Sentry from "@sentry/nextjs";

// Extend Window interface for our custom flags
declare global {
  interface Window {
    __SENTRY_INITIALIZED__?: boolean;
    __SENTRY_REPLAY_INITIALIZED__?: boolean;
  }
}

// Prevent multiple Sentry initializations with more robust checking
if (typeof window !== 'undefined' && !window.__SENTRY_INITIALIZED__ && !Sentry.getClient()) {
  window.__SENTRY_INITIALIZED__ = true;

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "development",

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: process.env.NODE_ENV === "development",

    // Session Replay configuration (disabled until multiple instances error is fixed)
    // replaysOnErrorSampleRate: 1.0,
    // replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0.1,

    integrations: [
      // Temporarily disable Session Replay to fix multiple instances error
      // TODO: Re-enable with proper initialization guards after fixing the root cause
      // ...(typeof window !== 'undefined' && !window.__SENTRY_REPLAY_INITIALIZED__
      //   ? [Sentry.replayIntegration({
      //       // Additional Replay configuration goes in here, for example:
      //       maskAllText: false,
      //       blockAllMedia: false,
      //     })]
      //   : []
      // ),
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

  // Replay integration disabled - no need to set flag
  // if (typeof window !== 'undefined') {
  //   window.__SENTRY_REPLAY_INITIALIZED__ = true;
  // }

  console.log("✅ Sentry client initialized");
}
