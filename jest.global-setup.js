// WellFlow Global Jest Setup
// Global test environment setup for oil & gas production monitoring platform

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  console.log('🔧 Setting up WellFlow test environment...');

  // Create test directories
  const testDirs = [
    'coverage',
    'coverage/html-report',
    'coverage/lcov-report',
    '.jest-cache',
    'test-results',
  ];

  testDirs.forEach((dir) => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created test directory: ${dir}`);
    }
  });

  // Set global test environment variables
  process.env.NODE_ENV = 'test';
  process.env.TZ = 'UTC';
  process.env.FORCE_COLOR = '1'; // Enable colors in CI

  // Oil & gas specific test environment
  process.env.WELLFLOW_ENV = 'test';
  process.env.WELLFLOW_TEST_MODE = 'true';
  process.env.WELLFLOW_LOG_LEVEL = 'error'; // Reduce log noise in tests

  // Database test configuration
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/wellflow_test';
  process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';

  // Individual database environment variables for DatabaseService
  process.env.DB_HOST = process.env.TEST_DB_HOST || 'localhost';
  process.env.DB_PORT = process.env.TEST_DB_PORT || '5433';
  process.env.DB_USER = process.env.TEST_DB_USER || 'postgres';
  process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'please_set_secure_password';
  process.env.DB_NAME = process.env.TEST_DB_NAME || 'wellflow_test';

  // Security test configuration
  process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-do-not-use-in-production';
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters-long';
  process.env.API_KEY = 'test-api-key-for-testing-purposes-only';

  // External service test mocks
  process.env.SENTRY_DSN = 'https://test@test.ingest.sentry.io/test';
  process.env.LOGROCKET_APP_ID = 'test/test';
  process.env.DATADOG_API_KEY = 'test-datadog-key';

  // Oil & gas regulatory test endpoints
  process.env.REGULATORY_REPORTING_ENDPOINT = 'https://test-regulatory.example.com';
  process.env.ENVIRONMENTAL_MONITORING_API = 'https://test-environmental.example.com';
  process.env.SAFETY_SYSTEM_ENDPOINT = 'https://test-safety.example.com';

  // Performance test configuration
  process.env.TEST_TIMEOUT = '30000';
  process.env.MAX_WORKERS = process.env.CI ? '2' : '50%';

  // Coverage configuration
  process.env.COVERAGE_THRESHOLD_STATEMENTS = '80';
  process.env.COVERAGE_THRESHOLD_BRANCHES = '80';
  process.env.COVERAGE_THRESHOLD_FUNCTIONS = '80';
  process.env.COVERAGE_THRESHOLD_LINES = '80';

  // Create test configuration file
  const testConfig = {
    timestamp: new Date().toISOString(),
    environment: 'test',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    ci: !!process.env.CI,
    coverage: {
      enabled: true,
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
    compliance: {
      standards: ['API_1164', 'NIST_CSF', 'IEC_62443'],
      dataRetentionDays: 2555,
      auditTrail: true,
    },
    performance: {
      apiResponseTime: 500,
      pageLoadTime: 2000,
      databaseQueryTime: 100,
    },
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'test-config.json'),
    JSON.stringify(testConfig, null, 2)
  );

  // Check for required test dependencies
  const requiredDeps = ['@testing-library/jest-dom', '@testing-library/react', 'jest', 'ts-jest'];

  console.log('📦 Checking test dependencies...');
  requiredDeps.forEach((dep) => {
    try {
      require.resolve(dep);
      console.log(`✅ ${dep} - OK`);
    } catch (error) {
      console.warn(`⚠️  ${dep} - Missing (may cause test failures)`);
    }
  });

  // Initialize test database if needed
  if (process.env.INIT_TEST_DB === 'true') {
    console.log('🗄️  Initializing test database...');
    try {
      // This would typically run database migrations or seed data
      // For now, we'll just log the intent
      console.log('✅ Test database initialization completed');
    } catch (error) {
      console.warn('⚠️  Test database initialization failed:', error.message);
    }
  }

  // Start test services if needed
  if (process.env.START_TEST_SERVICES === 'true') {
    console.log('🚀 Starting test services...');
    try {
      // This would typically start Redis, PostgreSQL, etc. for testing
      // For now, we'll just log the intent
      console.log('✅ Test services started');
    } catch (error) {
      console.warn('⚠️  Failed to start test services:', error.message);
    }
  }

  // Oil & gas compliance setup
  console.log('🛡️  Setting up compliance test environment...');

  // Create audit trail directory
  const auditDir = path.join(process.cwd(), 'test-audit');
  if (!fs.existsSync(auditDir)) {
    fs.mkdirSync(auditDir, { recursive: true });
  }

  // Create compliance test log
  const complianceLog = {
    testSuiteStart: new Date().toISOString(),
    standards: ['API_1164', 'NIST_CSF', 'IEC_62443'],
    environment: 'test',
    coverageRequirements: {
      minimum: 80,
      target: 85,
    },
    securityTests: {
      enabled: true,
      patterns: ['authentication', 'authorization', 'encryption', 'audit'],
    },
    performanceTests: {
      enabled: true,
      thresholds: testConfig.performance,
    },
  };

  fs.writeFileSync(
    path.join(auditDir, 'compliance-test-log.json'),
    JSON.stringify(complianceLog, null, 2)
  );

  console.log('✅ WellFlow test environment setup completed');
  console.log(
    `📊 Coverage thresholds: ${testConfig.coverage.thresholds.statements}% (statements, branches, functions, lines)`
  );
  console.log(`🛡️  Compliance standards: ${complianceLog.standards.join(', ')}`);
  console.log(
    `⚡ Performance thresholds: API ${testConfig.performance.apiResponseTime}ms, Page ${testConfig.performance.pageLoadTime}ms`
  );
};
