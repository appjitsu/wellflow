/**
 * Environment Configuration for Database Tests
 *
 * Sets up environment variables for database testing
 */

// Test database environment variables
process.env.NODE_ENV = 'test';
process.env.TEST_DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.TEST_DB_PORT = process.env.TEST_DB_PORT || '5432';
process.env.TEST_DB_USER = process.env.TEST_DB_USER || 'jason';
process.env.TEST_DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'password';
process.env.TEST_DB_NAME = process.env.TEST_DB_NAME || 'wellflow_test';

// Override main database config for tests
process.env.DB_HOST = process.env.TEST_DB_HOST;
process.env.DB_PORT = process.env.TEST_DB_PORT;
process.env.DB_USER = process.env.TEST_DB_USER;
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD;
process.env.DB_NAME = process.env.TEST_DB_NAME;

// Disable SSL for test database
process.env.DB_SSL = 'false';

// Set test-specific configurations
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.BCRYPT_ROUNDS = '4'; // Faster hashing for tests

console.log('🔧 Database test environment configured');
console.log(`📊 Test Database: ${process.env.TEST_DB_NAME}`);
console.log(
  `🏠 Test Host: ${process.env.TEST_DB_HOST}:${process.env.TEST_DB_PORT}`,
);
