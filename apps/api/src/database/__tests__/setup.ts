/**
 * Database Test Setup
 *
 * Configuration and utilities for database testing
 */

const { Pool } = require('pg');
const { execSync } = require('child_process');

// Test database configuration
const TEST_DB_CONFIG = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5433'),
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'password',
  database: process.env.TEST_DB_NAME || 'wellflow_test',
};

/**
 * Setup test database
 * Creates test database and runs migrations
 */
async function setupTestDatabase() {
  const adminPool = new Pool({
    ...TEST_DB_CONFIG,
    database: 'postgres', // Connect to default database to create test db
  });

  try {
    // Drop test database if exists
    await adminPool.query(
      `DROP DATABASE IF EXISTS "${TEST_DB_CONFIG.database}"`,
    );

    // Create test database
    await adminPool.query(`CREATE DATABASE "${TEST_DB_CONFIG.database}"`);

    console.log(`✅ Created test database: ${TEST_DB_CONFIG.database}`);
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    throw error;
  } finally {
    await adminPool.end();
  }

  // Run migrations on test database
  try {
    execSync('pnpm drizzle-kit migrate', {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DB_HOST: TEST_DB_CONFIG.host,
        DB_PORT: TEST_DB_CONFIG.port.toString(),
        DB_USER: TEST_DB_CONFIG.user,
        DB_PASSWORD: TEST_DB_CONFIG.password,
        DB_NAME: TEST_DB_CONFIG.database,
      },
      stdio: 'inherit',
    });

    console.log('✅ Applied migrations to test database');
  } catch (error) {
    console.error('❌ Failed to run migrations:', error);
    throw error;
  }
}

/**
 * Teardown test database
 * Drops the test database
 */
async function teardownTestDatabase() {
  const adminPool = new Pool({
    ...TEST_DB_CONFIG,
    database: 'postgres',
  });

  try {
    // Terminate connections to test database
    await adminPool.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '${TEST_DB_CONFIG.database}' AND pid <> pg_backend_pid()
    `);

    // Drop test database
    await adminPool.query(
      `DROP DATABASE IF EXISTS "${TEST_DB_CONFIG.database}"`,
    );

    console.log(`✅ Dropped test database: ${TEST_DB_CONFIG.database}`);
  } catch (error) {
    console.error('❌ Failed to teardown test database:', error);
    throw error;
  } finally {
    await adminPool.end();
  }
}

/**
 * Check if PostgreSQL is running and accessible
 */
async function checkDatabaseConnection() {
  const pool = new Pool({
    ...TEST_DB_CONFIG,
    database: 'postgres',
  });

  try {
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL connection successful');
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    return false;
  } finally {
    await pool.end();
  }
}

/**
 * Wait for database to be ready
 */
async function waitForDatabase(maxAttempts = 30, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isConnected = await checkDatabaseConnection();

    if (isConnected) {
      return;
    }

    if (attempt < maxAttempts) {
      console.log(
        `⏳ Waiting for database... (attempt ${attempt}/${maxAttempts})`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(`Database not ready after ${maxAttempts} attempts`);
}

/**
 * Global test setup
 */
async function globalSetup() {
  console.log('🚀 Setting up database tests...');

  await waitForDatabase();
  await setupTestDatabase();

  console.log('✅ Database test setup complete');
}

/**
 * Global test teardown
 */
async function globalTeardown() {
  console.log('🧹 Cleaning up database tests...');

  await teardownTestDatabase();

  console.log('✅ Database test cleanup complete');
}

// Export functions for CommonJS
module.exports = {
  TEST_DB_CONFIG,
  setupTestDatabase,
  teardownTestDatabase,
  checkDatabaseConnection,
  waitForDatabase,
  globalSetup,
  globalTeardown,
};
