import { execSync } from 'child_process';
import { Client } from 'pg';

export default async function globalSetup() {
  // Create test database if it doesn't exist
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'jason',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres', // Connect to default postgres database first
  });

  try {
    await client.connect();

    // Create test database if it doesn't exist
    await client
      .query('CREATE DATABASE wellflow_test OWNER jason;')
      .catch(() => {
        // Database might already exist, that's ok
      });

    await client.end();

    console.log(
      'Database test setup completed - database created successfully',
    );
  } catch (error) {
    console.error('Database test setup failed:', error);
    throw error;
  }
}
