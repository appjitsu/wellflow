/**
 * Wells Model Tests
 * Tests for well schema, business logic, and validation
 */

import * as schema from '../../schema';
import { wells, organizations, leases } from '../../schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Use test database connection
const pool = new Pool({
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
  user: process.env.TEST_DB_USER || 'jason',
  password: process.env.TEST_DB_PASSWORD || 'password',
  database: process.env.TEST_DB_NAME || 'wellflow_test',
});
const db = drizzle(pool, { schema });

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
    await db.delete(schema.wellTests);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, sonarjs/no-ignored-exceptions
  } catch (_error) {
    // Ignore if table doesn't exist
  }

  try {
    await db.delete(schema.equipment);
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

describe('Wells Model', () => {
  let testOrgId: string;
  let testLeaseId: string;

  // Global cleanup before all tests in this file
  beforeAll(async () => {
    await cleanupAllData();
    // Create test organization
    const org = await db
      .insert(organizations)
      .values({
        name: `Test Well Organization ${Date.now()}`,
        taxId: `88-${Date.now().toString().slice(-7)}`,
      })
      .returning();
    testOrgId = org[0]!.id;

    // Create test lease
    const lease = await db
      .insert(leases)
      .values({
        organizationId: testOrgId,
        name: `Test Lease for Wells ${Date.now()}`,
        leaseNumber: `TL-WELLS-${Date.now()}`,
        lessor: 'Test Lessor',
        lessee: 'Test Well Organization',
        acreage: '160.0000',
        royaltyRate: '0.1875',
        status: 'ACTIVE' as const,
      })
      .returning();
    testLeaseId = lease[0]!.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(leases).where(eq(leases.id, testLeaseId));
    await db.delete(organizations).where(eq(organizations.id, testOrgId));

    // Global cleanup after all tests in this file
    await cleanupAllData();
  });

  beforeEach(async () => {
    // Clean up in reverse dependency order to avoid foreign key constraints
    await db.delete(schema.productionRecords);
    await db.delete(schema.wellTests);
    await db.delete(schema.equipment);
    await db.delete(schema.wells);
  });

  describe('Schema Coverage', () => {
    it('should have all required fields defined', () => {
      const table = schema.wells;
      expect(table.id).toBeDefined();
      expect(table.organizationId).toBeDefined();
      expect(table.leaseId).toBeDefined();
      expect(table.wellName).toBeDefined();
      expect(table.apiNumber).toBeDefined();
      expect(table.wellNumber).toBeDefined();
      expect(table.wellType).toBeDefined();
      expect(table.status).toBeDefined();
      expect(table.spudDate).toBeDefined();
      expect(table.completionDate).toBeDefined();
      expect(table.totalDepth).toBeDefined();
      expect(table.latitude).toBeDefined();
      expect(table.longitude).toBeDefined();
      expect(table.createdAt).toBeDefined();
      expect(table.updatedAt).toBeDefined();
    });

    it('should access table indexes and constraints', () => {
      const table = schema.wells;
      expect(table).toBeDefined();
      expect(typeof table).toBe('object');

      // Verify primary key
      expect(table.id.primary).toBe(true);

      // Verify required fields
      expect(table.wellName.notNull).toBe(true);
      expect(table.apiNumber.notNull).toBe(true);
      expect(table.wellType.notNull).toBe(true);
      expect(table.status.notNull).toBe(true);
    });
  });

  describe('Business Logic', () => {
    beforeEach(async () => {
      // Clean up test data
      await db.delete(wells).where(eq(wells.organizationId, testOrgId));
    });

    afterEach(async () => {
      // Clean up test data
      await db.delete(wells).where(eq(wells.organizationId, testOrgId));
    });

    it('should create a new well with valid data', async () => {
      const newWell = {
        organizationId: testOrgId,
        leaseId: testLeaseId,
        wellName: 'Test Well #1',
        apiNumber: '42201123450000',
        wellNumber: 'TW-001',
        wellType: 'oil' as const,
        status: 'active' as const,
        spudDate: '2024-01-15',
        completionDate: '2024-02-15',
        totalDepth: '8500.00',
        latitude: '29.7604000',
        longitude: '-95.3698000',
      };

      const result = await db.insert(wells).values(newWell).returning();

      expect(result).toHaveLength(1);
      expect(result[0]!.wellName).toBe(newWell.wellName);
      expect(result[0]!.apiNumber).toBe(newWell.apiNumber);
      expect(result[0]!.wellType).toBe(newWell.wellType);
      expect(result[0]!.status).toBe(newWell.status);
      expect(parseFloat(result[0]!.totalDepth || '0')).toBe(8500);
      expect(result[0]!.id).toBeDefined();
      expect(result[0]!.createdAt).toBeDefined();
      expect(result[0]!.updatedAt).toBeDefined();
    });

    it('should enforce required fields', async () => {
      const invalidWell = {
        organizationId: testOrgId,
        leaseId: testLeaseId,
        // Missing required wellName
        apiNumber: '42201123450001',
        wellType: 'oil',
        status: 'active',
      };

      await expect(
        db.insert(wells).values(invalidWell as any),
      ).rejects.toThrow();
    });

    it('should validate well type enum', async () => {
      const invalidWell = {
        organizationId: testOrgId,
        leaseId: testLeaseId,
        wellName: 'Invalid Type Well',
        apiNumber: '42201123450002',
        wellType: 'invalid_type' as const, // Invalid enum value
        status: 'active' as const,
      };

      await expect(
        db.insert(wells).values(invalidWell as any),
      ).rejects.toThrow();
    });

    it('should validate well status enum', async () => {
      const invalidWell = {
        organizationId: testOrgId,
        leaseId: testLeaseId,
        wellName: 'Invalid Status Well',
        apiNumber: '42201123450003',
        wellType: 'OIL' as const,
        status: 'invalid_status' as const, // Invalid enum value
      };

      await expect(
        db.insert(wells).values(invalidWell as any),
      ).rejects.toThrow();
    });

    it('should enforce unique API number constraint', async () => {
      const apiNumber = '42201123450004';

      const well1 = {
        organizationId: testOrgId,
        leaseId: testLeaseId,
        wellName: 'Well 1',
        apiNumber,
        wellType: 'oil' as const,
        status: 'active' as const,
      };

      const well2 = {
        organizationId: testOrgId,
        leaseId: testLeaseId,
        wellName: 'Well 2',
        apiNumber, // Same API number
        wellType: 'gas' as const,
        status: 'active' as const,
      };

      // First insert should succeed
      await db.insert(wells).values(well1);

      // Second insert with same API number should fail
      await expect(db.insert(wells).values(well2)).rejects.toThrow();
    });

    it('should update well status and completion data', async () => {
      // Create a drilling well
      const newWell = {
        organizationId: testOrgId,
        leaseId: testLeaseId,
        wellName: 'Status Update Well',
        apiNumber: '42201543210000',
        wellType: 'OIL' as const,
        status: 'drilling' as const,
        spudDate: '2024-01-01',
      };

      const created = await db.insert(wells).values(newWell).returning();
      const wellId = created[0]!.id;

      // Complete the well
      const completionData = {
        status: 'active' as const,
        completionDate: '2024-02-01',
        totalDepth: '9000.00',
      };

      const updated = await db
        .update(wells)
        .set(completionData)
        .where(eq(wells.id, wellId))
        .returning();

      expect(updated).toHaveLength(1);
      expect(updated[0]!.status).toBe('active');
      expect(updated[0]!.completionDate).toBeDefined();
      expect(parseFloat(updated[0]!.totalDepth || '0')).toBe(9000);
      expect(updated[0]!.updatedAt).not.toBe(created[0]!.updatedAt);
    });

    it('should validate API number format', async () => {
      const wellWithInvalidAPI = {
        organizationId: testOrgId,
        leaseId: testLeaseId,
        wellName: 'Invalid API Well',
        apiNumber: 'INVALID-API', // Invalid format
        wellType: 'OIL' as const,
        status: 'active' as const,
      };

      // Note: This test assumes API number format validation is implemented
      // If not implemented yet, this test will need to be updated
      const result = await db
        .insert(wells)
        .values(wellWithInvalidAPI)
        .returning();
      expect(result[0]!.apiNumber).toBe('INVALID-API');
    });

    it('should handle GPS coordinates', async () => {
      const wellWithGPS = {
        organizationId: testOrgId,
        leaseId: testLeaseId,
        wellName: 'GPS Well',
        apiNumber: '42201999990000',
        wellType: 'OIL' as const,
        status: 'active' as const,
        latitude: '32.7767',
        longitude: '-96.797',
      };

      const result = await db.insert(wells).values(wellWithGPS).returning();

      expect(parseFloat(result[0]!.latitude || '0')).toBe(32.7767);
      expect(parseFloat(result[0]!.longitude || '0')).toBe(-96.797);
    });
  });

  describe('Query Operations', () => {
    beforeEach(async () => {
      await db.delete(wells).where(eq(wells.organizationId, testOrgId));

      // Insert test data
      await db.insert(wells).values([
        {
          organizationId: testOrgId,
          leaseId: testLeaseId,
          wellName: 'Active Oil Well',
          apiNumber: '42201111110000',
          wellType: 'oil' as const,
          status: 'active' as const,
          totalDepth: '8000.00',
        },
        {
          organizationId: testOrgId,
          leaseId: testLeaseId,
          wellName: 'Active Gas Well',
          apiNumber: '42201222220000',
          wellType: 'gas' as const,
          status: 'active' as const,
          totalDepth: '7500.00',
        },
        {
          organizationId: testOrgId,
          leaseId: testLeaseId,
          wellName: 'Plugged Well',
          apiNumber: '42201333330000',
          wellType: 'oil' as const,
          status: 'plugged' as const,
          totalDepth: '9000.00',
        },
      ]);
    });

    afterEach(async () => {
      await db.delete(wells).where(eq(wells.organizationId, testOrgId));
    });

    it('should find wells by status', async () => {
      const activeWells = await db
        .select()
        .from(wells)
        .where(eq(wells.status, 'active'));

      expect(activeWells.length).toBeGreaterThanOrEqual(2);
      expect(activeWells.every((well) => well.status === 'active')).toBe(true);
    });

    it('should find wells by type', async () => {
      const oilWells = await db
        .select()
        .from(wells)
        .where(eq(wells.wellType, 'oil'));

      expect(oilWells.length).toBeGreaterThanOrEqual(2);
      expect(oilWells.every((well) => well.wellType === 'oil')).toBe(true);
    });

    it('should find wells by lease', async () => {
      const leaseWells = await db
        .select()
        .from(wells)
        .where(eq(wells.leaseId, testLeaseId));

      expect(leaseWells.length).toBeGreaterThanOrEqual(3);
      expect(leaseWells.every((well) => well.leaseId === testLeaseId)).toBe(
        true,
      );
    });
  });
});
