// WellFlow Global Jest Setup
// Global test configuration for oil & gas production monitoring platform

// Extend Jest matchers
// import '@testing-library/jest-dom';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.TZ = 'UTC';

// Oil & gas specific test environment variables
process.env.WELLFLOW_ENV = 'test';
process.env.API_URL = 'http://localhost:3001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/wellflow_test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'jason';
process.env.DB_PASSWORD = '';
process.env.DB_NAME = 'wellflow_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// Mock external services for testing
process.env.SENTRY_DSN = 'https://test@test.ingest.sentry.io/test';
process.env.LOGROCKET_APP_ID = 'test/test';
process.env.DATADOG_API_KEY = 'test-datadog-key';

// Security and compliance test settings
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';
process.env.API_KEY = 'test-api-key-for-testing';

// Oil & gas regulatory compliance test data
process.env.REGULATORY_REPORTING_ENDPOINT = 'https://test-regulatory.example.com';
process.env.ENVIRONMENTAL_MONITORING_API = 'https://test-environmental.example.com';
process.env.SAFETY_SYSTEM_ENDPOINT = 'https://test-safety.example.com';

// Global test utilities and mocks
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: process.env.DEBUG_TESTS ? console.log : jest.fn(),
  debug: process.env.DEBUG_TESTS ? console.debug : jest.fn(),
  info: process.env.DEBUG_TESTS ? console.info : jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Mock fetch globally
global.fetch = jest.fn();

// Mock WebSocket for real-time monitoring tests
global.WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1, // OPEN
}));

// Mock geolocation for well location tests
global.navigator = {
  ...global.navigator,
  geolocation: {
    getCurrentPosition: jest.fn().mockImplementation((success) =>
      success({
        coords: {
          latitude: 32.7767, // Dallas, TX (oil & gas region)
          longitude: -96.797,
          accuracy: 10,
        },
      })
    ),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  },
};

// Mock IntersectionObserver for component visibility tests
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver for responsive component tests
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Browser-specific mocks (only if window exists)
if (typeof window !== 'undefined') {
  // Mock matchMedia for responsive design tests
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock localStorage for client-side storage tests
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
  };

  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: localStorageMock,
    });
  }
}

// Mock URL.createObjectURL for file upload tests
global.URL.createObjectURL = jest.fn(() => 'mocked-url');
global.URL.revokeObjectURL = jest.fn();

// Mock File and FileReader for file handling tests
global.File = jest.fn().mockImplementation((bits, name, options) => ({
  bits,
  name,
  options,
  size: bits.length,
  type: options?.type || '',
}));

global.FileReader = jest.fn().mockImplementation(() => ({
  readAsDataURL: jest.fn(),
  readAsText: jest.fn(),
  result: null,
  onload: null,
  onerror: null,
}));

// Oil & gas specific test utilities
global.WellFlowTestUtils = {
  // Generate test well data
  createTestWell: (overrides = {}) => ({
    id: 'test-well-001',
    apiNumber: '42-123-45678',
    name: 'Test Well #1',
    operator: 'Test Operator LLC',
    status: 'ACTIVE',
    location: {
      latitude: 32.7767,
      longitude: -96.797,
      county: 'Dallas',
      state: 'TX',
    },
    production: {
      oil: 150.5,
      gas: 2500.0,
      water: 75.2,
      date: '2024-01-01',
    },
    ...overrides,
  }),

  // Generate test production data
  createTestProduction: (overrides = {}) => ({
    wellId: 'test-well-001',
    date: '2024-01-01',
    oil: 150.5,
    gas: 2500.0,
    water: 75.2,
    pressure: 1250.0,
    temperature: 185.5,
    ...overrides,
  }),

  // Generate test regulatory data
  createTestRegulatoryReport: (overrides = {}) => ({
    reportId: 'test-report-001',
    wellId: 'test-well-001',
    reportType: 'MONTHLY_PRODUCTION',
    period: '2024-01',
    status: 'SUBMITTED',
    submittedAt: '2024-01-15T10:00:00Z',
    ...overrides,
  }),

  // Mock API responses
  mockApiResponse: (data, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  }),

  // Wait for async operations in tests
  waitFor: (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms)),
};

// Global test hooks
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();

  // Reset fetch mock
  if (global.fetch) {
    global.fetch.mockClear();
  }

  // Clear localStorage (only if it exists)
  if (typeof window !== 'undefined' && localStorageMock) {
    localStorageMock.clear();
  }

  // Reset console mocks
  if (jest.isMockFunction(console.log)) {
    console.log.mockClear();
  }
  if (jest.isMockFunction(console.debug)) {
    console.debug.mockClear();
  }
  if (jest.isMockFunction(console.info)) {
    console.info.mockClear();
  }
});

afterEach(() => {
  // Clean up any timers
  jest.clearAllTimers();

  // Clean up any pending promises
  jest.clearAllMocks();
});

// Global error handling for tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Oil & gas compliance test configuration
global.WELLFLOW_TEST_CONFIG = {
  // Regulatory compliance requirements
  REGULATORY_STANDARDS: ['API_1164', 'NIST_CSF', 'IEC_62443'],

  // Test data retention (7 years for oil & gas)
  DATA_RETENTION_DAYS: 2555,

  // Security test requirements
  SECURITY_REQUIREMENTS: {
    ENCRYPTION: 'AES-256',
    AUTHENTICATION: 'JWT',
    AUTHORIZATION: 'RBAC',
  },

  // Performance test thresholds
  PERFORMANCE_THRESHOLDS: {
    API_RESPONSE_TIME: 500, // ms
    PAGE_LOAD_TIME: 2000, // ms
    DATABASE_QUERY_TIME: 100, // ms
  },

  // Coverage requirements
  COVERAGE_THRESHOLDS: {
    STATEMENTS: 80,
    BRANCHES: 80,
    FUNCTIONS: 80,
    LINES: 80,
  },
};
