/**
 * Jest Configuration for Database Tests
 *
 * Specialized configuration for running database integration tests
 */

module.exports = {
  // Display name
  displayName: {
    name: 'DATABASE',
    color: 'blue',
  },

  // Test environment
  testEnvironment: 'node',

  // Root directory
  rootDir: 'src',

  // Only run database tests
  testMatch: ['<rootDir>/database/__tests__/**/*.test.ts'],

  // Test timeout (database tests may take longer)
  testTimeout: 30000,

  // Run tests serially to avoid database conflicts
  maxWorkers: 1,

  // Coverage configuration for database tests
  collectCoverageFrom: [
    'database/**/*.ts',
    '!database/__tests__/**',
    '!database/migrations/**',
    '!database/drizzle.config.ts',
  ],

  // Coverage directory
  coverageDirectory: '../coverage-database',

  // Coverage reporters
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json'],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Environment variables for tests
  setupFiles: ['<rootDir>/database/__tests__/env.ts'],

  // Global setup and teardown
  globalSetup: '<rootDir>/database/__tests__/global-setup.ts',
  globalTeardown: '<rootDir>/database/__tests__/global-teardown.ts',

  // Transform configuration
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        transpilation: true,
      },
    ],
  },

  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'ts'],

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/', 'query-builder.test.ts'],

  // Verbose output for debugging
  verbose: true,

  // Clear mocks
  clearMocks: true,
  restoreMocks: true,

  // Force exit to handle database connections
  forceExit: true,
  detectOpenHandles: false,
};
