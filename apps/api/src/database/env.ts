// Database test environment setup
// Sets up environment variables for database integration tests
/* eslint-disable no-process-env */

process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'jason';
process.env.DB_PASSWORD = '';
process.env.DB_NAME = 'wellflow_test';

// Ensure test database URL is set
process.env.DATABASE_URL = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
