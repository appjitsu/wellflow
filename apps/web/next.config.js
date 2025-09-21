import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure for Railway deployment
  serverExternalPackages: [],
  // Explicitly set experimental to empty object to prevent Sentry from adding deprecated config
  experimental: {},
  // Ensure proper hostname binding for Railway
  async rewrites() {
    return [];
  },
};

// Sentry configuration
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry webpack plugin
  // eslint-disable-next-line no-undef
  org: process.env.SENTRY_ORG,
  // eslint-disable-next-line no-undef
  project: process.env.SENTRY_PROJECT_WEB,

  // Only print logs for uploading source maps in CI
  // eslint-disable-next-line no-undef
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Transpiles SDK to be compatible with IE11 (increases bundle size)
  transpileClientSDK: false,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: false,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
