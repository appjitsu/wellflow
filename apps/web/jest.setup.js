import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
process.env.NEXT_PUBLIC_SENTRY_DSN = 'test-dsn';
process.env.NEXT_PUBLIC_LOGROCKET_APP_ID = 'test-app-id';

// Mock LogRocket
jest.mock('logrocket', () => ({
  init: jest.fn(),
  identify: jest.fn(),
  track: jest.fn(),
  captureMessage: jest.fn(),
}));

jest.mock('logrocket-react', () => ({
  setupLogRocketReact: jest.fn(),
}));

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withSentry: (handler) => handler,
}));

// Global test utilities
global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});
