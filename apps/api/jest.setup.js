// Jest setup file for API tests
// This file is executed before each test file

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  'postgresql://test:test@localhost:5432/wellflow_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.SENTRY_DSN = '';
process.env.LOGROCKET_APP_ID = '';

// Increase test timeout for integration tests
jest.setTimeout(30000);

// Mock external services for testing
jest.mock('@sentry/nestjs', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setTag: jest.fn(),
  setExtra: jest.fn(),
  setUser: jest.fn(),
  startSpan: jest.fn(),
  withScope: jest.fn((callback) => {
    const mockScope = {
      setTag: jest.fn(),
      setExtra: jest.fn(),
      setUser: jest.fn(),
    };
    callback(mockScope);
  }),
}));

jest.mock('logrocket', () => ({
  init: jest.fn(),
  identify: jest.fn(),
  track: jest.fn(),
  captureException: jest.fn(),
  addTag: jest.fn(),
  log: jest.fn(),
  getSessionURL: jest
    .fn()
    .mockResolvedValue('https://app.logrocket.com/session/123'),
}));

// Global test utilities
global.testUtils = {
  // Add any global test utilities here
};
