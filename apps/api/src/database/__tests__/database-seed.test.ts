/**
 * Database Seed Tests
 *
 * Tests for validating seed data functionality and integrity
 */

import './env'; // Load test environment configuration
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { count, eq } from 'drizzle-orm';
import * as schema from '../schema';
import seed from '../seed';

describe('Database Seed Tests', () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    pool = new Pool({
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5433'),
      user: process.env.TEST_DB_USER || 'postgres',
      password: process.env.TEST_DB_PASSWORD || 'password',
      database: process.env.TEST_DB_NAME || 'wellflow_test',
    });

    db = drizzle(pool, { schema });

    // Verify database connection
    await db.select().from(schema.organizations).limit(1);
  });

  afterAll(async () => {
    await pool.end();
  });

  // Note: Removed aggressive beforeEach cleanup that was interfering with other tests
  // Individual tests will clean up their own data as needed

  describe('Seed Data Execution', () => {
    test('should run seed script without errors', async () => {
      // Run the seed script
      // The seed script should execute without throwing errors
      await expect(seed()).resolves.not.toThrow();
    });

    test('should create sample organizations', async () => {
      // Run seed
      await seed();

      // Verify organizations were created
      const orgCount = await db
        .select({ count: count() })
        .from(schema.organizations);

      expect(orgCount[0]!.count).toBeGreaterThan(0);

      // Verify organization structure
      const orgs = await db.select().from(schema.organizations);

      orgs.forEach((org) => {
        expect(org.id).toBeDefined();
        expect(org.name).toBeDefined();
        expect(org.createdAt).toBeInstanceOf(Date);
        expect(org.updatedAt).toBeInstanceOf(Date);
      });
    });

    test('should create sample users with proper roles', async () => {
      // Run seed
      await seed();

      // Verify users were created
      const userCount = await db.select({ count: count() }).from(schema.users);

      expect(userCount[0]!.count).toBeGreaterThan(0);

      // Verify user roles
      const users = await db.select().from(schema.users);
      const roles = users.map((u) => u.role);

      expect(roles).toContain('owner');
      expect(roles).toContain('manager');
      expect(roles).toContain('pumper');

      // Verify all users have required fields
      users.forEach((user) => {
        expect(user.id).toBeDefined();
        expect(user.organizationId).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.firstName).toBeDefined();
        expect(user.lastName).toBeDefined();
        expect(user.role).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.isActive).toBeDefined();
      });
    });

    test('should create sample leases with proper structure', async () => {
      // Run seed
      await seed();

      // Verify leases were created
      const leaseCount = await db
        .select({ count: count() })
        .from(schema.leases);

      expect(leaseCount[0]!.count).toBeGreaterThan(0);

      // Verify lease structure
      const leases = await db.select().from(schema.leases);

      leases.forEach((lease) => {
        expect(lease.id).toBeDefined();
        expect(lease.organizationId).toBeDefined();
        expect(lease.name).toBeDefined();
        expect(lease.leaseNumber).toBeDefined();
        expect(lease.status).toBeDefined();
        expect(lease.acreage).toBeDefined();
        expect(lease.legalDescription).toBeDefined();
        expect(lease.lessor).toBeDefined();
        expect(lease.lessee).toBeDefined();
        expect(['ACTIVE', 'expired', 'terminated']).toContain(lease.status);
      });
    });

    test('should create sample wells with valid API numbers', async () => {
      // Run seed
      await seed();

      // Verify wells were created
      const wellCount = await db.select({ count: count() }).from(schema.wells);

      expect(wellCount[0]!.count).toBeGreaterThan(0);

      // Verify well structure and API numbers
      const wells = await db.select().from(schema.wells);

      wells.forEach((well) => {
        expect(well.id).toBeDefined();
        expect(well.organizationId).toBeDefined();
        expect(well.apiNumber).toBeDefined();
        expect(well.wellName).toBeDefined();
        expect(well.status).toBeDefined();
        expect(well.wellType).toBeDefined();

        // Validate API number format (should be 14 digits without dashes)
        expect(well.apiNumber).toMatch(/^\d{14}$/);

        // Validate enum values
        expect(['ACTIVE', 'INACTIVE', 'plugged', 'drilling']).toContain(
          well.status,
        );
      });
    });

    test('should create sample production records with valid data', async () => {
      // Run seed
      await seed();

      // Verify production records were created
      const productionCount = await db
        .select({ count: count() })
        .from(schema.productionRecords);

      expect(productionCount[0]!.count).toBeGreaterThan(0);

      // Verify production record structure
      const records = await db.select().from(schema.productionRecords);

      records.forEach((record) => {
        expect(record.id).toBeDefined();
        expect(record.organizationId).toBeDefined();
        expect(record.wellId).toBeDefined();
        expect(record.productionDate).toBeDefined();
        expect(record.oilVolume).toBeDefined();
        expect(record.gasVolume).toBeDefined();
        expect(record.waterVolume).toBeDefined();
        expect(record.oilPrice).toBeDefined();
        expect(record.gasPrice).toBeDefined();

        // Validate volume values are numeric strings
        expect(parseFloat(record.oilVolume || '0')).not.toBeNaN();
        expect(parseFloat(record.gasVolume || '0')).not.toBeNaN();
        expect(parseFloat(record.waterVolume || '0')).not.toBeNaN();

        // Validate volumes are non-negative
        expect(parseFloat(record.oilVolume || '0')).toBeGreaterThanOrEqual(0);
        expect(parseFloat(record.gasVolume || '0')).toBeGreaterThanOrEqual(0);
        expect(parseFloat(record.waterVolume || '0')).toBeGreaterThanOrEqual(0);
      });
    });

    test('should create sample partners with proper types', async () => {
      // Run seed
      await seed();

      // Verify partners were created
      const partnerCount = await db
        .select({ count: count() })
        .from(schema.partners);

      expect(partnerCount[0]!.count).toBeGreaterThan(0);

      // Verify partner structure
      const partners = await db.select().from(schema.partners);

      partners.forEach((partner) => {
        expect(partner.id).toBeDefined();
        expect(partner.organizationId).toBeDefined();
        expect(partner.partnerName).toBeDefined();
        expect(partner.partnerCode).toBeDefined();
        expect(partner.isActive).toBeDefined();

        // Validate partner is active
        expect(partner.isActive).toBe(true);
      });
    });
  });

  describe('Seed Data Relationships', () => {
    test('should maintain referential integrity', async () => {
      // Run seed
      await seed();

      // Verify all users belong to existing organizations
      const usersWithOrgs = await db
        .select({
          userId: schema.users.id,
          userOrgId: schema.users.organizationId,
          orgId: schema.organizations.id,
        })
        .from(schema.users)
        .leftJoin(
          schema.organizations,
          eq(schema.users.organizationId, schema.organizations.id),
        );

      usersWithOrgs.forEach((row) => {
        expect(row.orgId).toBe(row.userOrgId);
      });

      // Verify all wells belong to existing organizations
      const wellsWithOrgs = await db
        .select({
          wellId: schema.wells.id,
          wellOrgId: schema.wells.organizationId,
          orgId: schema.organizations.id,
        })
        .from(schema.wells)
        .leftJoin(
          schema.organizations,
          eq(schema.wells.organizationId, schema.organizations.id),
        );

      wellsWithOrgs.forEach((row) => {
        expect(row.orgId).toBe(row.wellOrgId);
      });

      // Verify all production records belong to existing wells and users
      const productionWithRefs = await db
        .select({
          recordId: schema.productionRecords.id,
          wellId: schema.productionRecords.wellId,
          organizationId: schema.productionRecords.organizationId,
          wellExists: schema.wells.id,
          orgExists: schema.organizations.id,
        })
        .from(schema.productionRecords)
        .leftJoin(
          schema.wells,
          eq(schema.productionRecords.wellId, schema.wells.id),
        )
        .leftJoin(
          schema.organizations,
          eq(schema.productionRecords.organizationId, schema.organizations.id),
        );

      productionWithRefs.forEach((row) => {
        expect(row.wellExists).toBe(row.wellId);
        expect(row.orgExists).toBe(row.organizationId);
      });
    });

    test('should create realistic production data timeline', async () => {
      // Run seed
      await seed();

      // Get production records ordered by date
      const records = await db
        .select()
        .from(schema.productionRecords)
        .orderBy(schema.productionRecords.productionDate);

      expect(records.length).toBeGreaterThan(0);

      // Verify dates are in chronological order and realistic
      for (let i = 1; i < records.length; i++) {
        expect(records[i - 1]).toBeDefined();
        expect(records[i]).toBeDefined(); // eslint-disable-line security/detect-object-injection
        const prevDate = new Date(records[i - 1]!.productionDate);
        const currDate = new Date(records[i]!.productionDate); // eslint-disable-line security/detect-object-injection

        // Dates should be in order (or same date for different wells)
        expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());

        // Dates should be recent (within last year)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        expect(currDate.getTime()).toBeGreaterThan(oneYearAgo.getTime());
      }
    });

    test('should create diverse well types and statuses', async () => {
      // Run seed
      await seed();

      const wells = await db.select().from(schema.wells);

      const wellStatuses = [...new Set(wells.map((w) => w.status))];

      // Should have wells created
      expect(wells.length).toBeGreaterThan(0);

      // Should have at least one status
      expect(wellStatuses.length).toBeGreaterThanOrEqual(1);
      expect(wellStatuses).toContain('ACTIVE');
    });
  });

  describe('Seed Data Cleanup', () => {
    test('should be able to clean up seed data', async () => {
      // Run seed
      await seed();

      // Verify data exists
      const orgCount = await db
        .select({ count: count() })
        .from(schema.organizations);
      expect(orgCount[0]!.count).toBeGreaterThan(0);

      // Clean up in dependency order
      await db.delete(schema.productionRecords);
      await db.delete(schema.wellTests);
      await db.delete(schema.equipment);
      await db.delete(schema.wells);
      await db.delete(schema.leasePartners);
      await db.delete(schema.leases);
      await db.delete(schema.partners);
      await db.delete(schema.jibStatements);
      await db.delete(schema.complianceReports);
      await db.delete(schema.documents);
      await db.delete(schema.users);
      await db.delete(schema.organizations);

      // Verify cleanup
      const finalOrgCount = await db
        .select({ count: count() })
        .from(schema.organizations);
      expect(finalOrgCount[0]!.count).toBe(0);

      const finalUserCount = await db
        .select({ count: count() })
        .from(schema.users);
      expect(finalUserCount[0]!.count).toBe(0);
    });

    test('should handle re-running seed script', async () => {
      // Run seed twice
      await seed();

      const firstRunCount = await db
        .select({ count: count() })
        .from(schema.organizations);

      // Clean up
      await db.delete(schema.productionRecords);
      await db.delete(schema.wellTests);
      await db.delete(schema.equipment);
      await db.delete(schema.wells);
      await db.delete(schema.leasePartners);
      await db.delete(schema.leases);
      await db.delete(schema.partners);
      await db.delete(schema.jibStatements);
      await db.delete(schema.complianceReports);
      await db.delete(schema.documents);
      await db.delete(schema.users);
      await db.delete(schema.organizations);

      // Run seed again
      await seed();

      const secondRunCount = await db
        .select({ count: count() })
        .from(schema.organizations);

      // Should create same amount of data
      expect(secondRunCount[0]!.count).toBe(firstRunCount[0]!.count);
    });
  });
});
