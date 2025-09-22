/**
 * Test Utilities
 *
 * Helper functions for generating unique test data to prevent conflicts
 * and managing test database cleanup
 */

import * as schema from '../schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

/**
 * Generate a unique email address for testing
 * Uses timestamp and random number to ensure uniqueness
 */
export function generateUniqueEmail(prefix = 'test'): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000) // eslint-disable-line sonarjs/pseudo-random
    .toString()
    .padStart(3, '0');
  return `${prefix}-${timestamp}-${random}@example.com`;
}

/**
 * Generate a unique API number for oil & gas wells
 * Format: 14-digit number starting with 42123 (Texas state code)
 */
export function generateUniqueApiNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000) // eslint-disable-line sonarjs/pseudo-random
    .toString()
    .padStart(3, '0');
  return `42123${timestamp}${random}`.slice(0, 14);
}

/**
 * Generate a unique organization name for testing
 */
export function generateUniqueOrgName(prefix = 'Test Org'): string {
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix} ${timestamp}`;
}

/**
 * Generate a unique well name for testing
 */
export function generateUniqueWellName(prefix = 'Test Well'): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100); // eslint-disable-line sonarjs/pseudo-random
  return `${prefix} #${random}-${timestamp}`;
}

/**
 * Generate a unique lease name for testing
 */
export function generateUniqueLeaseName(prefix = 'Test Lease'): string {
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix} ${timestamp}`;
}

/**
 * Generate a unique partner name for testing
 */
export function generateUniquePartnerName(prefix = 'Test Partner'): string {
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix} ${timestamp}`;
}

/**
 * Generate a unique tax ID for testing
 */
export function generateUniqueTaxId(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000) // eslint-disable-line sonarjs/pseudo-random
    .toString()
    .padStart(3, '0');
  return `${timestamp.slice(0, 2)}-${timestamp.slice(2)}${random}`;
}

/**
 * Generate a unique phone number for testing
 */
export function generateUniquePhone(): string {
  const timestamp = Date.now().toString().slice(-6);
  return `(432) 555-${timestamp.slice(0, 4)}`;
}

/**
 * Sleep utility for tests that need timing delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate test user data with unique values
 */
export function generateTestUser(
  overrides: Partial<{
    organizationId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'owner' | 'manager' | 'operator' | 'viewer';
    isActive: boolean;
  }> = {},
) {
  return {
    email: generateUniqueEmail(),
    firstName: 'Test',
    lastName: 'User',
    role: 'owner' as const,
    isActive: true,
    ...overrides,
  };
}

/**
 * Generate test organization data with unique values
 */
export function generateTestOrganization(
  overrides: Partial<{
    name: string;
    taxId: string;
    email: string;
    phone: string;
  }> = {},
) {
  return {
    name: generateUniqueOrgName(),
    taxId: generateUniqueTaxId(),
    email: generateUniqueEmail('org'),
    phone: generateUniquePhone(),
    address: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'TX',
      zipCode: '12345',
    },
    settings: {
      timezone: 'America/Chicago',
      currency: 'USD',
      units: 'imperial',
    },
    ...overrides,
  };
}

/**
 * Generate test well data with unique values
 */
export function generateTestWell(
  overrides: Partial<{
    organizationId: string;
    leaseId: string;
    apiNumber: string;
    wellName: string;
    wellType: 'OIL' | 'GAS' | 'water' | 'injection';
    status: 'ACTIVE' | 'INACTIVE' | 'plugged' | 'drilling';
  }> = {},
) {
  return {
    apiNumber: generateUniqueApiNumber(),
    wellName: generateUniqueWellName(),
    wellType: 'OIL' as const,
    status: 'ACTIVE' as const,
    ...overrides,
  };
}

/**
 * Helper function to clean up all data in proper order
 * This ensures test isolation by removing all data between test files
 */
export async function cleanupAllData(db: ReturnType<typeof drizzle>) {
  // Delete in reverse dependency order, handling missing tables gracefully
  const tables = [
    // Most dependent tables first (leaf nodes)
    schema.productionRecords,
    schema.revenueDistributions,
    schema.afeLineItems,
    schema.afeApprovals,
    schema.spillReports,
    schema.curativeItems,
    schema.vendorContacts,
    schema.complianceSchedules,
    schema.regulatoryFilings,
    schema.wellTests,
    schema.equipment,
    schema.documents,
    schema.jibStatements,
    schema.complianceReports,

    // Mid-level dependent tables
    schema.afes,
    schema.divisionOrders, // Must be deleted before wells (has FK to wells)
    schema.leaseOperatingStatements,
    schema.environmentalIncidents,
    schema.titleOpinions,
    schema.vendors,
    schema.wells, // Must be deleted after divisionOrders
    schema.leasePartners,

    // Less dependent tables
    schema.partners,
    schema.leases,
    schema.users,

    // Root tables (no dependencies)
    schema.organizations,
  ];

  for (const table of tables) {
    try {
      await db.delete(table);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, sonarjs/no-ignored-exceptions
    } catch (_error) {
      // Ignore if table doesn't exist or has constraints
    }
  }
}

/**
 * Database connection with cleanup capability
 */
interface DatabaseWithCleanup extends ReturnType<typeof drizzle> {
  cleanup?: () => Promise<void>;
}

/**
 * Create a test database connection with proper cleanup
 */
export function createTestDbConnection(): DatabaseWithCleanup {
  // eslint-disable-next-line no-process-env
  const host = process.env.TEST_DB_HOST || 'localhost';
  // eslint-disable-next-line no-process-env
  const port = parseInt(process.env.TEST_DB_PORT || '5432', 10);
  // eslint-disable-next-line no-process-env
  const user = process.env.TEST_DB_USER || 'jason';
  // eslint-disable-next-line no-process-env
  const password = process.env.TEST_DB_PASSWORD || 'password';
  // eslint-disable-next-line no-process-env
  const database = process.env.TEST_DB_NAME || 'wellflow_test';

  const pool = new Pool({
    host,
    port,
    user,
    password,
    database,
  });

  const db = drizzle(pool, { schema }) as DatabaseWithCleanup;

  // Add cleanup method to the database instance
  db.cleanup = async () => {
    try {
      await pool.end();
    } catch {
      // Ignore cleanup errors during test cleanup
    }
  };

  return db;
}

/**
 * Setup global test hooks for a test file
 * Call this at the beginning of each test file to ensure proper cleanup
 */
export function setupTestHooks(db: DatabaseWithCleanup) {
  beforeAll(async () => {
    await cleanupAllData(db);
  });

  afterAll(async () => {
    await cleanupAllData(db);
    // Close database connections
    if (db.cleanup) {
      await db.cleanup();
    }
  });
}
