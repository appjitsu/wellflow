// WellFlow Root Jest Configuration
// Comprehensive test coverage configuration for oil & gas production monitoring platform

module.exports = {
  // Project configuration for monorepo
  projects: [
    '<rootDir>/apps/api',
    '<rootDir>/apps/web',
    '<rootDir>/apps/queue-ui',
    '<rootDir>/packages/ui',
  ],

  // Global coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',

  // Coverage thresholds (70% requirement for WellFlow development)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    // Application-specific thresholds - all set to 80% for consistency
    './apps/api/src/**/*.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './apps/web/**/*.{ts,tsx}': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './apps/queue-ui/src/**/*.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './packages/ui/**/*.{ts,tsx}': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Coverage collection patterns
  collectCoverageFrom: [
    'apps/*/src/**/*.{ts,tsx}',
    'apps/web/**/*.{ts,tsx}',
    'packages/*/src/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.config.{js,ts}',
    '!**/*.stories.{js,ts,tsx}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/test/**',
    '!**/__tests__/**',
    '!**/*.test.{ts,tsx}',
    '!**/*.spec.{ts,tsx}',
  ],

  // Coverage reporters for different formats
  coverageReporters: [
    'text', // Console output
    'text-summary', // Brief summary
    'lcov', // For CI/CD integration
    'html', // Detailed HTML report
    'json', // Machine-readable format
    'cobertura', // XML format for CI tools
    'clover', // Clover XML format
  ],

  // Coverage path ignore patterns
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/.next/',
    '/coverage/',
    '\\.d\\.ts$',
    '\\.config\\.(js|ts)$',
    '\\.stories\\.(js|ts|tsx)$',
    '/test/',
    '/__tests__/',
    '\\.test\\.(ts|tsx)$',
    '\\.spec\\.(ts|tsx)$',
  ],

  // Test environment configuration
  testEnvironment: 'node',

  // Test match patterns
  testMatch: ['**/__tests__/**/*.(js|jsx|ts|tsx)', '**/*.(test|spec).(js|jsx|ts|tsx)'],

  // Test path ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/.next/',
    '/coverage/',
    '/tests/e2e/',
    'apps/*/e2e/',
  ],

  // Global setup and teardown
  globalSetup: '<rootDir>/jest.global-setup.js',
  globalTeardown: '<rootDir>/jest.global-teardown.js',

  // Test timeout (30 seconds for comprehensive tests)
  testTimeout: 30000,

  // Verbose output for detailed test results
  verbose: true,

  // Fail fast on first test failure in CI
  bail: process.env.CI ? 1 : 0,

  // Maximum worker processes
  maxWorkers: process.env.CI ? 2 : '50%',

  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Error handling
  errorOnDeprecated: true,

  // Oil & gas compliance and audit configuration
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/html-report',
        filename: 'test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'WellFlow Test Coverage Report',
        logoImgPath: undefined,
        inlineSource: false,
      },
    ],
    [
      'jest-junit',
      {
        outputDirectory: './coverage',
        outputName: 'junit.xml',
        ancestorSeparator: ' › ',
        uniqueOutputName: 'false',
        suiteNameTemplate: '{filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        includeConsoleOutput: true,
      },
    ],
  ],

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Watch plugins for development
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],

  // Notification configuration
  notify: false,
  notifyMode: 'failure-change',

  // Oil & gas industry specific configuration
  displayName: {
    name: 'WellFlow',
    color: 'blue',
  },

  // Performance monitoring
  detectOpenHandles: true,
  detectLeaks: false,

  // Force exit after tests complete
  forceExit: process.env.CI ? true : false,
};
