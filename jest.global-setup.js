// WellFlow Global Jest Setup
// Database setup and teardown for comprehensive testing

const { Client } = require('pg');
const { execSync } = require('child_process');

async function setupTestDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'jason',
    password: process.env.DB_PASSWORD || 'password',
    database: 'postgres', // Connect to default database first
  });

  try {
    await client.connect();

    // Drop test database if it exists
    const dbName = process.env.DB_NAME || 'wellflow_test';
    try {
      // Terminate active connections first
      await client.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '${dbName}' AND pid <> pg_backend_pid()
      `);
      await client.query(`DROP DATABASE IF EXISTS ${dbName}`);
      console.log(`✓ Dropped existing test database '${dbName}'`);
    } catch (dropError) {
      console.log('✓ Test database did not exist or could not be dropped');
    }

    // Create fresh test database
    await client.query(`CREATE DATABASE ${dbName} WITH OWNER ${process.env.DB_USER || 'jason'}`);
    console.log(`✓ Created fresh test database '${dbName}'`);
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  } finally {
    await client.end();
  }

  // Run database setup - use SQL migration files directly
  try {
    // Run all migrations in order
    execSync(
      'psql -h localhost -p 5432 -U jason -d wellflow_test -f /Users/jason/projects/wellflow/apps/api/src/database/migrations/0000_bored_namorita.sql',
      { stdio: 'inherit' }
    );
    console.log('✓ Migration 0000 applied');

    execSync(
      'psql -h localhost -p 5432 -U jason -d wellflow_test -f /Users/jason/projects/wellflow/apps/api/src/database/migrations/0001_flat_amazoness.sql',
      { stdio: 'inherit' }
    );
    console.log('✓ Migration 0001 applied');

    console.log('✓ Database schema created from SQL migrations');
  } catch (error) {
    console.error('Error setting up database schema:', error);
    throw error;
  }
}

async function teardownTestDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'jason',
    password: process.env.DB_PASSWORD || 'password',
    database: 'postgres',
  });

  try {
    await client.connect();
    const dbName = process.env.DB_NAME || 'wellflow_test';

    // Terminate active connections to the test database
    await client.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '${dbName}' AND pid <> pg_backend_pid()
    `);

    // Drop test database
    await client.query(`DROP DATABASE IF EXISTS ${dbName}`);
    console.log(`✓ Test database '${dbName}' dropped`);
  } catch (error) {
    console.error('Error tearing down test database:', error);
  } finally {
    await client.end();
  }
}

module.exports = async () => {
  console.log('🚀 Setting up test environment...');

  try {
    await setupTestDatabase();
    console.log('✅ Test environment setup complete');
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    throw error;
  }
};
