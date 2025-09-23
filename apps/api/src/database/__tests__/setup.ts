/**
 * Database Test Setup
 *
 * Configuration and utilities for database testing
 */
/* eslint-disable
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access,
  sonarjs/sql-queries,
  sonarjs/no-os-command-from-path,
  no-process-env
*/

const { Pool } = require('pg'); // eslint-disable-line @typescript-eslint/no-require-imports
const { execSync } = require('child_process'); // eslint-disable-line @typescript-eslint/no-require-imports

// Test database configuration
const TEST_DB_CONFIG = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  user: process.env.TEST_DB_USER || 'jason',
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
    execSync('pnpm drizzle-kit migrate --config=drizzle.config.test.ts', {
      cwd: process.cwd(),
      env: {
        ...process.env,
        TEST_DB_HOST: TEST_DB_CONFIG.host,
        TEST_DB_PORT: TEST_DB_CONFIG.port.toString(),
        TEST_DB_USER: TEST_DB_CONFIG.user,
        TEST_DB_PASSWORD: TEST_DB_CONFIG.password,
        TEST_DB_NAME: TEST_DB_CONFIG.database,
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

  // Add error event listener to prevent unhandled errors during teardown
  adminPool.on('error', (err: unknown) => {
    // Silently ignore connection termination errors during teardown
    const error = err as { code?: string; message?: string };
    if (
      error.code === '57P01' ||
      error.message?.includes('terminating connection')
    ) {
      return;
    }
    console.warn(
      '⚠️ Unexpected database connection error during teardown:',
      error.message || String(err),
    );
  });

  try {
    // Terminate connections to test database
    await adminPool.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '${TEST_DB_CONFIG.database}' AND pid <> pg_backend_pid()
    `);

    // Wait a moment for connections to be terminated
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Drop test database
    await adminPool.query(
      `DROP DATABASE IF EXISTS "${TEST_DB_CONFIG.database}"`,
    );

    console.log(`✅ Dropped test database: ${TEST_DB_CONFIG.database}`);
  } catch (error) {
    // Log the error but don't throw - database cleanup errors shouldn't fail tests
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(
      '⚠️  Database cleanup warning (this is usually expected):',
      errorMessage,
    );

    // Try one more time to drop the database in case connections were terminated
    try {
      await adminPool.query(
        `DROP DATABASE IF EXISTS "${TEST_DB_CONFIG.database}"`,
      );
      console.log(`✅ Dropped test database: ${TEST_DB_CONFIG.database}`);
    } catch (retryError) {
      const retryErrorMessage =
        retryError instanceof Error ? retryError.message : String(retryError);
      console.warn(
        '⚠️  Final database cleanup attempt failed (this is usually expected):',
        retryErrorMessage,
      );
      // Don't throw - tests have already passed, cleanup failure shouldn't fail the test run
    }
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

// Export functions for CommonJS and ES modules
module.exports = {
  TEST_DB_CONFIG,
  setupTestDatabase,
  teardownTestDatabase,
  checkDatabaseConnection,
  waitForDatabase,
  globalSetup,
  globalTeardown,
};

// Default export for Jest globalSetup/globalTeardown
module.exports.default = globalSetup;
