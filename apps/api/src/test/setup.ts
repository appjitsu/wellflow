/**
 * Jest Test Setup
 *
 * Global test configuration and setup for the WellFlow API tests.
 * This file is executed before each test file.
 */

import { Logger } from '@nestjs/common';

// Suppress console output during tests unless explicitly needed
const originalConsole = global.console;

beforeAll(() => {
  // Mock console methods to reduce noise during tests
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };

  // Mock NestJS Logger
  jest.spyOn(Logger.prototype, 'log').mockImplementation();
  jest.spyOn(Logger.prototype, 'error').mockImplementation();
  jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  jest.spyOn(Logger.prototype, 'verbose').mockImplementation();
});

afterAll(() => {
  // Restore original console
  global.console = originalConsole;
});

// Global test utilities
(global as any).testUtils = {
  /**
   * Create a mock Date that returns a fixed timestamp
   */
  mockDate: (timestamp: string | number | Date) => {
    const mockDate = new Date(timestamp);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
    return mockDate;
  },

  /**
   * Restore the original Date implementation
   */
  restoreDate: () => {
    jest.restoreAllMocks();
  },

  /**
   * Wait for a specified number of milliseconds
   */
  sleep: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  /**
   * Generate a random string for testing
   */
  randomString: (length: number = 10) => {
    // eslint-disable-next-line sonarjs/pseudo-random
    return Math.random()
      .toString(36)
      .substring(2, length + 2);
  },

  /**
   * Generate a mock organization ID
   */
  // eslint-disable-next-line sonarjs/pseudo-random
  mockOrgId: () => `org-${Math.random().toString(36).substring(2, 8)}`,

  /**
   * Generate a mock user ID
   */

  /**
   * Generate a mock user ID
   */
  // eslint-disable-next-line sonarjs/pseudo-random
  mockUserId: () => `user-${Math.random().toString(36).substring(2, 8)}`,

  /**
   * Generate a mock job ID
   */

  /**
   * Generate a mock job ID
   */
  // eslint-disable-next-line sonarjs/pseudo-random
  mockJobId: () => `job-${Math.random().toString(36).substring(2, 8)}`,
};

// Environment setup for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.REDIS_URL = 'redis://localhost:6379/1'; // Use test database

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Type declarations for global test utilities
declare global {
  var testUtils: {
    mockDate: (timestamp: string | number | Date) => Date;
    restoreDate: () => void;
    sleep: (ms: number) => Promise<void>;
    randomString: (length?: number) => string;
    mockOrgId: () => string;
    mockUserId: () => string;
    mockJobId: () => string;
  };
}
