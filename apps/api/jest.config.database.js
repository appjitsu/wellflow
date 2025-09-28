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

  // Only run database schema tests
  testMatch: ['<rootDir>/database/schemas/__tests__/**/*.spec.ts'],

  // Test timeout (database tests may take longer)
  testTimeout: 30000,

  // Run tests serially to avoid database conflicts
  maxWorkers: 1,

  // Coverage configuration for database schema tests
  collectCoverageFrom: [
    'database/schemas/**/*.ts',
    '!database/schemas/__tests__/**',
  ],

  // Coverage directory
  coverageDirectory: '../coverage-database',

  // Coverage reporters
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json'],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
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
