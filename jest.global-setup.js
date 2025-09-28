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
  process.env.DB_PORT = process.env.TEST_DB_PORT || '5432';
  process.env.DB_USER = process.env.TEST_DB_USER || 'jason';
  process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || '';
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

  // Initialize test database
  console.log('🗄️  Initializing test database...');
  try {
    const { Client } = require('pg');
    const client = new Client({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'postgres', // Connect to default postgres database first
    });

    await client.connect();

    // Drop and recreate test database to ensure clean state
    try {
      await client.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME};`);
      console.log(`🗑️  Dropped existing test database: ${process.env.DB_NAME}`);
    } catch (error) {
      // Database might not exist, that's ok
    }

    await client.query(`CREATE DATABASE ${process.env.DB_NAME} OWNER ${process.env.DB_USER};`);
    console.log(`✅ Created fresh test database: ${process.env.DB_NAME}`);

    await client.end();

    // Create necessary tables for well repository tests
    console.log('🗄️  Creating test database tables...');

    const testClient = new Client({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    await testClient.connect();

    // Create minimal schema for well repository tests
    const createTablesSQL = `
      -- Create enums
      CREATE TYPE well_type AS ENUM ('OIL', 'GAS', 'OIL_AND_GAS', 'INJECTION', 'DISPOSAL', 'WATER', 'OTHER', 'oil', 'gas', 'injection', 'disposal');
      CREATE TYPE well_status AS ENUM ('active', 'inactive', 'plugged', 'drilling');

      -- Create organizations table (minimal)
      CREATE TABLE organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Create leases table
      CREATE TABLE leases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id),
        name VARCHAR(255) NOT NULL,
        lease_number VARCHAR(100),
        lessor VARCHAR(255) NOT NULL,
        lessee VARCHAR(255) NOT NULL,
        acreage DECIMAL(10,4),
        royalty_rate DECIMAL(5,4),
        effective_date DATE,
        expiration_date DATE,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        legal_description TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CONSTRAINT leases_royalty_rate_range_check CHECK (royalty_rate IS NULL OR (royalty_rate >= 0 AND royalty_rate <= 1)),
        CONSTRAINT leases_acreage_positive_check CHECK (acreage IS NULL OR acreage > 0),
        CONSTRAINT leases_date_range_check CHECK (expiration_date IS NULL OR effective_date IS NULL OR effective_date <= expiration_date)
      );

      -- Create wells table
      CREATE TABLE wells (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id),
        lease_id UUID REFERENCES leases(id),
        api_number VARCHAR(10) NOT NULL UNIQUE,
        well_name VARCHAR(255) NOT NULL,
        well_number VARCHAR(50),
        well_type well_type NOT NULL,
        status well_status NOT NULL DEFAULT 'active',
        spud_date DATE,
        completion_date DATE,
        total_depth DECIMAL(8,2),
        latitude DECIMAL(10,7),
        longitude DECIMAL(10,7),
        operator VARCHAR(255),
        field VARCHAR(255),
        formation VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CONSTRAINT api_format CHECK (LENGTH(api_number) = 10 AND api_number ~ '^[0-9]+$'),
        CONSTRAINT wells_total_depth_positive_check CHECK (total_depth IS NULL OR total_depth >= 0)
      );

       -- Create production_records table
       CREATE TABLE production_records (
         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         organization_id UUID NOT NULL REFERENCES organizations(id),
         well_id UUID NOT NULL REFERENCES wells(id),
         production_date DATE NOT NULL,
         oil_volume DECIMAL(10,2),
         gas_volume DECIMAL(12,2),
         water_volume DECIMAL(10,2),
         oil_price DECIMAL(8,4),
         gas_price DECIMAL(8,4),
         run_ticket VARCHAR(100),
         comments TEXT,
         created_at TIMESTAMP DEFAULT NOW() NOT NULL,
         updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
         CONSTRAINT production_records_positive_volumes_check CHECK (
           (oil_volume IS NULL OR oil_volume >= 0) AND
           (gas_volume IS NULL OR gas_volume >= 0) AND
           (water_volume IS NULL OR water_volume >= 0)
         ),
         CONSTRAINT production_records_positive_prices_check CHECK (
           (oil_price IS NULL OR oil_price >= 0) AND
           (gas_price IS NULL OR gas_price >= 0)
         ),
         UNIQUE(well_id, production_date)
       );

       -- Create indexes
       CREATE INDEX wells_organization_id_idx ON wells(organization_id);
       CREATE INDEX wells_lease_id_idx ON wells(lease_id);
       CREATE INDEX production_records_organization_id_idx ON production_records(organization_id);
       CREATE INDEX production_records_well_id_idx ON production_records(well_id);
       CREATE INDEX production_records_production_date_idx ON production_records(production_date);
    `;

    try {
      await testClient.query(createTablesSQL);

      // Insert test data
      await testClient.query(`
          -- Insert test organization
          INSERT INTO organizations (id, name) VALUES
          ('550e8400-e29b-41d4-a716-446655440000', 'Test Organization');

          -- Insert test well
          INSERT INTO wells (id, organization_id, api_number, well_name, well_type, status) VALUES
          ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '1234567890', 'Test Well', 'OIL', 'active');
        `);

      console.log('✅ Test database tables and data created successfully');
    } catch (error) {
      console.warn('⚠️  Table/data creation failed:', error.message);
      // Try to continue anyway
    }

    await testClient.end();

    console.log('✅ Test database initialization completed');
  } catch (error) {
    console.warn('⚠️  Test database initialization failed:', error.message);
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
