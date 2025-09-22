/**
 * Database Seed Tests
 *
 * Tests for validating seed data functionality and integrity
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { count, eq } from 'drizzle-orm';
import * as schema from '../schema';

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
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    // Clean up all test data
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
  });

  describe('Seed Data Execution', () => {
    test('should run seed script without errors', async () => {
      // Import and run the seed script
      const seedModule = await import('../seed');

      // The seed script should execute without throwing errors
      await expect(seedModule.default).resolves.not.toThrow();
    });

    test('should create sample organizations', async () => {
      // Run seed
      const seedModule = await import('../seed');
      await seedModule.default;

      // Verify organizations were created
      const orgCount = await db
        .select({ count: count() })
        .from(schema.organizations);

      expect(orgCount[0].count).toBeGreaterThan(0);

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
      const seedModule = await import('../seed');
      await seedModule.default;

      // Verify users were created
      const userCount = await db.select({ count: count() }).from(schema.users);

      expect(userCount[0].count).toBeGreaterThan(0);

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
        expect(user.passwordHash).toBeDefined();
        expect(user.isActive).toBeDefined();
      });
    });

    test('should create sample leases with proper structure', async () => {
      // Run seed
      const seedModule = await import('../seed');
      await seedModule.default;

      // Verify leases were created
      const leaseCount = await db
        .select({ count: count() })
        .from(schema.leases);

      expect(leaseCount[0].count).toBeGreaterThan(0);

      // Verify lease structure
      const leases = await db.select().from(schema.leases);

      leases.forEach((lease) => {
        expect(lease.id).toBeDefined();
        expect(lease.organizationId).toBeDefined();
        expect(lease.name).toBeDefined();
        expect(lease.county).toBeDefined();
        expect(lease.state).toBeDefined();
        expect(lease.acreage).toBeDefined();
        expect(lease.leaseType).toBeDefined();
        expect(lease.effectiveDate).toBeDefined();
        expect(['oil', 'gas', 'oil_gas']).toContain(lease.leaseType);
      });
    });

    test('should create sample wells with valid API numbers', async () => {
      // Run seed
      const seedModule = await import('../seed');
      await seedModule.default;

      // Verify wells were created
      const wellCount = await db.select({ count: count() }).from(schema.wells);

      expect(wellCount[0].count).toBeGreaterThan(0);

      // Verify well structure and API numbers
      const wells = await db.select().from(schema.wells);

      wells.forEach((well) => {
        expect(well.id).toBeDefined();
        expect(well.organizationId).toBeDefined();
        expect(well.apiNumber).toBeDefined();
        expect(well.name).toBeDefined();
        expect(well.status).toBeDefined();
        expect(well.wellType).toBeDefined();

        // Validate API number format (should be 14 characters with dashes)
        expect(well.apiNumber).toMatch(/^\d{2}-\d{3}-\d{5}-\d{2}$/);

        // Validate enum values
        expect(['active', 'inactive', 'plugged', 'drilling']).toContain(
          well.status,
        );
        expect(['oil', 'gas', 'oil_gas', 'water', 'injection']).toContain(
          well.wellType,
        );
      });
    });

    test('should create sample production records with valid data', async () => {
      // Run seed
      const seedModule = await import('../seed');
      await seedModule.default;

      // Verify production records were created
      const productionCount = await db
        .select({ count: count() })
        .from(schema.productionRecords);

      expect(productionCount[0].count).toBeGreaterThan(0);

      // Verify production record structure
      const records = await db.select().from(schema.productionRecords);

      records.forEach((record) => {
        expect(record.id).toBeDefined();
        expect(record.wellId).toBeDefined();
        expect(record.createdByUserId).toBeDefined();
        expect(record.productionDate).toBeDefined();
        expect(record.oilVolume).toBeDefined();
        expect(record.gasVolume).toBeDefined();
        expect(record.waterVolume).toBeDefined();
        expect(record.isEstimated).toBeDefined();

        // Validate volume values are numeric strings
        expect(parseFloat(record.oilVolume)).not.toBeNaN();
        expect(parseFloat(record.gasVolume)).not.toBeNaN();
        expect(parseFloat(record.waterVolume)).not.toBeNaN();

        // Validate volumes are non-negative
        expect(parseFloat(record.oilVolume)).toBeGreaterThanOrEqual(0);
        expect(parseFloat(record.gasVolume)).toBeGreaterThanOrEqual(0);
        expect(parseFloat(record.waterVolume)).toBeGreaterThanOrEqual(0);
      });
    });

    test('should create sample partners with proper types', async () => {
      // Run seed
      const seedModule = await import('../seed');
      await seedModule.default;

      // Verify partners were created
      const partnerCount = await db
        .select({ count: count() })
        .from(schema.partners);

      expect(partnerCount[0].count).toBeGreaterThan(0);

      // Verify partner structure
      const partners = await db.select().from(schema.partners);

      partners.forEach((partner) => {
        expect(partner.id).toBeDefined();
        expect(partner.organizationId).toBeDefined();
        expect(partner.name).toBeDefined();
        expect(partner.partnerType).toBeDefined();
        expect(partner.isActive).toBeDefined();

        // Validate partner types
        expect([
          'working_interest',
          'royalty_owner',
          'overriding_royalty',
        ]).toContain(partner.partnerType);
      });
    });
  });

  describe('Seed Data Relationships', () => {
    test('should maintain referential integrity', async () => {
      // Run seed
      const seedModule = await import('../seed');
      await seedModule.default;

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
          userId: schema.productionRecords.createdByUserId,
          wellExists: schema.wells.id,
          userExists: schema.users.id,
        })
        .from(schema.productionRecords)
        .leftJoin(
          schema.wells,
          eq(schema.productionRecords.wellId, schema.wells.id),
        )
        .leftJoin(
          schema.users,
          eq(schema.productionRecords.createdByUserId, schema.users.id),
        );

      productionWithRefs.forEach((row) => {
        expect(row.wellExists).toBe(row.wellId);
        expect(row.userExists).toBe(row.userId);
      });
    });

    test('should create realistic production data timeline', async () => {
      // Run seed
      const seedModule = await import('../seed');
      await seedModule.default;

      // Get production records ordered by date
      const records = await db
        .select()
        .from(schema.productionRecords)
        .orderBy(schema.productionRecords.productionDate);

      expect(records.length).toBeGreaterThan(0);

      // Verify dates are in chronological order and realistic
      for (let i = 1; i < records.length; i++) {
        const prevDate = new Date(records[i - 1].productionDate);
        const currDate = new Date(records[i].productionDate);

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
      const seedModule = await import('../seed');
      await seedModule.default;

      const wells = await db.select().from(schema.wells);

      const wellTypes = [...new Set(wells.map((w) => w.wellType))];
      const wellStatuses = [...new Set(wells.map((w) => w.status))];

      // Should have multiple well types
      expect(wellTypes.length).toBeGreaterThan(1);
      expect(wellTypes).toContain('oil');

      // Should have multiple statuses
      expect(wellStatuses.length).toBeGreaterThan(1);
      expect(wellStatuses).toContain('active');
    });
  });

  describe('Seed Data Cleanup', () => {
    test('should be able to clean up seed data', async () => {
      // Run seed
      const seedModule = await import('../seed');
      await seedModule.default;

      // Verify data exists
      const orgCount = await db
        .select({ count: count() })
        .from(schema.organizations);
      expect(orgCount[0].count).toBeGreaterThan(0);

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
      expect(finalOrgCount[0].count).toBe(0);

      const finalUserCount = await db
        .select({ count: count() })
        .from(schema.users);
      expect(finalUserCount[0].count).toBe(0);
    });

    test('should handle re-running seed script', async () => {
      // Run seed twice
      const seedModule = await import('../seed');
      await seedModule.default;

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
      await seedModule.default;

      const secondRunCount = await db
        .select({ count: count() })
        .from(schema.organizations);

      // Should create same amount of data
      expect(secondRunCount[0].count).toBe(firstRunCount[0].count);
    });
  });
});
