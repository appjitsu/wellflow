import { Client } from 'pg';

export default async function globalTeardown() {
  // Clean up test database
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'jason',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres', // Connect to default postgres database
  });

  try {
    await client.connect();

    // Terminate any active connections to the test database
    await client.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = 'wellflow_test' AND pid <> pg_backend_pid();
    `);

    // Drop test database
    await client.query('DROP DATABASE IF EXISTS wellflow_test;');

    await client.end();

    console.log('Database test cleanup completed');
  } catch (error) {
    console.error('Database test cleanup failed:', error);
    throw error;
  }
}
