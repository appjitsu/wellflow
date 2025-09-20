import * as Sentry from "@sentry/nextjs";

// Initialize Sentry for client-side (without Session Replay to avoid multiple instances)
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === "development",
  // Session Replay configuration (will be used when lazy-loaded in MonitoringProvider)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    // Note: Session Replay is NOT instantiated here to avoid multiple instances error
    // It will be lazy-loaded in the MonitoringProvider component
  ],
});

// Export router transition hook for navigation instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
