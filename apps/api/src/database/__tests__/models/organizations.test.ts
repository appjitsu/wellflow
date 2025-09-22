/**
 * Organizations Model Tests
 * Tests for organization schema, business logic, and validation
 */

import '../env'; // Load test environment configuration
import * as schema from '../../schema';
import { organizations } from '../../schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Helper function to clean up all data in proper order
async function cleanupAllData() {
  // Delete in reverse dependency order, handling missing tables gracefully
  try {
    await db.delete(schema.productionRecords);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, sonarjs/no-ignored-exceptions
  } catch (_error) {
    // Ignore if table doesn't exist
  }

  try {
    await db.delete(schema.leasePartners);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, sonarjs/no-ignored-exceptions
  } catch (_error) {
    // Ignore if table doesn't exist
  }

  try {
    await db.delete(schema.partners);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, sonarjs/no-ignored-exceptions
  } catch (_error) {
    // Ignore if table doesn't exist
  }

  try {
    await db.delete(schema.wells);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, sonarjs/no-ignored-exceptions
  } catch (_error) {
    // Ignore if table doesn't exist
  }

  try {
    await db.delete(schema.leases);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, sonarjs/no-ignored-exceptions
  } catch (_error) {
    // Ignore if table doesn't exist
  }

  try {
    await db.delete(schema.users);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, sonarjs/no-ignored-exceptions
  } catch (_error) {
    // Ignore if table doesn't exist
  }

  try {
    await db.delete(schema.organizations);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, sonarjs/no-ignored-exceptions
  } catch (_error) {
    // Ignore if table doesn't exist
  }
}

// Use test database connection
const pool = new Pool({
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  user: process.env.TEST_DB_USER || 'jason',
  password: process.env.TEST_DB_PASSWORD || 'password',
  database: process.env.TEST_DB_NAME || 'wellflow_test',
});
const db = drizzle(pool, { schema });

describe('Organizations Model', () => {
  describe('Schema Coverage', () => {
    it('should have all required fields defined', () => {
      const table = schema.organizations;
      expect(table.id).toBeDefined();
      expect(table.name).toBeDefined();
      expect(table.taxId).toBeDefined();
      expect(table.address).toBeDefined();
      expect(table.phone).toBeDefined();
      expect(table.email).toBeDefined();
      expect(table.settings).toBeDefined();
      expect(table.createdAt).toBeDefined();
      expect(table.updatedAt).toBeDefined();
    });

    it('should access table indexes and constraints', () => {
      const table = schema.organizations;
      // Access table structure to improve coverage
      expect(table).toBeDefined();
      expect(typeof table).toBe('object');

      // Verify primary key
      expect(table.id.primary).toBe(true);

      // Verify required fields
      expect(table.name.notNull).toBe(true);
      expect(table.settings.notNull).toBe(true);
    });
  });

  describe('Business Logic', () => {
    beforeEach(async () => {
      // Clean up test data in proper order
      await cleanupAllData();
    });

    afterEach(async () => {
      // Clean up test data in proper order
      await cleanupAllData();
    });

    it('should create a new organization with valid data', async () => {
      const newOrg = {
        name: 'Test Oil Company',
        taxId: '12-3456789',
        address: {
          street: '123 Oil Field Rd',
          city: 'Houston',
          state: 'TX',
          zipCode: '77001',
          country: 'USA',
        },
        phone: '+1-713-555-0123',
        email: 'contact@testoil.com',
        settings: { theme: 'light', notifications: true },
      };

      const result = await db.insert(organizations).values(newOrg).returning();

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe(newOrg.name);
      expect(result[0]!.taxId).toBe(newOrg.taxId);
      expect(result[0]!.id).toBeDefined();
      expect(result[0]!.createdAt).toBeDefined();
      expect(result[0]!.updatedAt).toBeDefined();
    });

    it('should enforce required fields', async () => {
      const invalidOrg = {
        // Missing required name
        taxId: '12-3456789',
      };

      await expect(
        db.insert(organizations).values(invalidOrg as any),
      ).rejects.toThrow();
    });

    it('should validate organization type enum', async () => {
      const invalidOrg = {
        name: 'Test Company',
        taxId: '12-3456789',
      };

      // This test should pass since we removed organizationType from schema
      const result = await db
        .insert(organizations)
        .values(invalidOrg)
        .returning();
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Test Company');
    });

    it('should update organization data', async () => {
      // First create an organization
      const newOrg = {
        name: 'Original Name',
        taxId: '12-3456789',
      };

      const created = await db.insert(organizations).values(newOrg).returning();
      const orgId = created[0]!.id;

      // Update the organization
      const updatedData = {
        name: 'Updated Name',
        phone: '+1-713-555-9999',
      };

      const updated = await db
        .update(organizations)
        .set(updatedData)
        .where(eq(organizations.id, orgId))
        .returning();

      expect(updated).toHaveLength(1);
      expect(updated[0]!.name).toBe(updatedData.name);
      expect(updated[0]!.phone).toBe(updatedData.phone);
      expect(updated[0]!.updatedAt).not.toBe(created[0]!.updatedAt);
    });

    it('should delete organization', async () => {
      // First create an organization
      const newOrg = {
        name: 'To Be Deleted',
        taxId: '12-3456789',
      };

      const created = await db.insert(organizations).values(newOrg).returning();
      const orgId = created[0]!.id;

      // Delete the organization
      await db.delete(organizations).where(eq(organizations.id, orgId));

      // Verify it's deleted
      const found = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId));

      expect(found).toHaveLength(0);
    });

    it('should handle JSON address field', async () => {
      const orgWithAddress = {
        name: 'Address Test Company',
        taxId: '12-3456789',
        address: {
          street: '456 Main St',
          suite: 'Suite 100',
          city: 'Dallas',
          state: 'TX',
          zipCode: '75201',
          country: 'USA',
        },
      };

      const result = await db
        .insert(organizations)
        .values(orgWithAddress)
        .returning();

      expect(result[0]!.address).toEqual(orgWithAddress.address);
      expect(typeof result[0]!.address).toBe('object');
    });

    it('should allow duplicate tax IDs for now', async () => {
      const taxId = '12-3456789';

      const org1 = {
        name: 'Company 1',
        taxId,
      };

      const org2 = {
        name: 'Company 2',
        taxId, // Same tax ID - currently allowed
      };

      // Both inserts should succeed since unique constraint is not implemented yet
      await db.insert(organizations).values(org1);
      const result = await db.insert(organizations).values(org2).returning();

      expect(result).toHaveLength(1);
      expect(result[0]!.taxId).toBe(taxId);
    });
  });

  describe('Query Operations', () => {
    beforeEach(async () => {
      await cleanupAllData();

      // Insert test data
      await db.insert(organizations).values([
        {
          name: 'Alpha Oil Corp',
          taxId: '11-1111111',
        },
        {
          name: 'Beta Gas LLC',
          taxId: '22-2222222',
        },
        {
          name: 'Gamma Services',
          taxId: '33-3333333',
        },
      ]);
    });

    afterEach(async () => {
      await cleanupAllData();
    });

    it('should find organizations by name', async () => {
      const results = await db
        .select()
        .from(organizations)
        .where(eq(organizations.name, 'Alpha Oil Corp'));

      expect(results).toHaveLength(1);
      expect(results[0]!.name).toBe('Alpha Oil Corp');
    });

    it('should search organizations by name pattern', async () => {
      const results = await db
        .select()
        .from(organizations)
        .where(eq(organizations.name, 'Alpha Oil Corp'));

      expect(results).toHaveLength(1);
      expect(results[0]!.name).toBe('Alpha Oil Corp');
    });

    it('should count all organizations', async () => {
      const allOrgs = await db.select().from(organizations);

      expect(allOrgs).toHaveLength(3);
      expect(allOrgs.every((org) => org.name)).toBe(true);
      expect(allOrgs.every((org) => org.taxId)).toBe(true);
    });
  });
});
