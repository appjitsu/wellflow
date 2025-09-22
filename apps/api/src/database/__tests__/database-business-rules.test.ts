/**
 * Database Business Rules Tests
 *
 * Tests for oil & gas industry-specific business rules and validations
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, sum } from 'drizzle-orm';
import * as schema from '../schema';

describe('Database Business Rules Tests', () => {
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
    // Clean up test data
    await db.delete(schema.productionRecords);
    await db.delete(schema.leasePartners);
    await db.delete(schema.wells);
    await db.delete(schema.leases);
    await db.delete(schema.partners);
    await db.delete(schema.users);
    await db.delete(schema.organizations);
  });

  describe('API Number Validation', () => {
    let organizationId: string;

    beforeEach(async () => {
      const [org] = await db
        .insert(schema.organizations)
        .values({ name: 'Test Oil Company' })
        .returning();
      organizationId = org.id;
    });

    test('should accept valid API numbers', async () => {
      const validApiNumbers = [
        '42-123-12345-00',
        '48-001-00001-01',
        '05-456-78901-02',
      ];

      for (const apiNumber of validApiNumbers) {
        const [well] = await db
          .insert(schema.wells)
          .values({
            organizationId,
            apiNumber,
            name: `Well ${apiNumber}`,
            status: 'active' as const,
            wellType: 'oil' as const,
          })
          .returning();

        expect(well.apiNumber).toBe(apiNumber);
      }
    });

    test('should enforce API number uniqueness across all organizations', async () => {
      const apiNumber = '42-123-12345-03';

      // Create first well
      await db.insert(schema.wells).values({
        organizationId,
        apiNumber,
        name: 'First Well',
        status: 'active' as const,
        wellType: 'oil' as const,
      });

      // Create second organization
      const [org2] = await db
        .insert(schema.organizations)
        .values({ name: 'Another Oil Company' })
        .returning();

      // Attempt to create well with same API number in different org
      await expect(
        db.insert(schema.wells).values({
          organizationId: org2.id,
          apiNumber, // Same API number
          name: 'Second Well',
          status: 'active' as const,
          wellType: 'gas' as const,
        }),
      ).rejects.toThrow();
    });
  });

  describe('Production Volume Validation', () => {
    let organizationId: string;
    let wellId: string;
    let userId: string;

    beforeEach(async () => {
      const [org] = await db
        .insert(schema.organizations)
        .values({ name: 'Test Oil Company' })
        .returning();
      organizationId = org.id;

      const [well] = await db
        .insert(schema.wells)
        .values({
          organizationId,
          apiNumber: '42-123-12345-04',
          name: 'Production Test Well',
          status: 'active' as const,
          wellType: 'oil' as const,
        })
        .returning();
      wellId = well.id;

      const [user] = await db
        .insert(schema.users)
        .values({
          organizationId,
          email: 'pumper@test.com',
          firstName: 'Test',
          lastName: 'Pumper',
          role: 'pumper' as const,
          passwordHash: '$2b$10$test.hash',
          isActive: true,
        })
        .returning();
      userId = user.id;
    });

    test('should accept valid production volumes', async () => {
      const validProduction = {
        wellId,
        createdByUserId: userId,
        productionDate: '2024-01-15',
        oilVolume: '45.50',
        gasVolume: '325.75',
        waterVolume: '12.25',
        oilPrice: '75.50',
        gasPrice: '3.25',
        isEstimated: false,
      };

      const [created] = await db
        .insert(schema.productionRecords)
        .values(validProduction)
        .returning();

      expect(created.oilVolume).toBe('45.50');
      expect(created.gasVolume).toBe('325.75');
      expect(created.waterVolume).toBe('12.25');
    });

    test('should handle zero production volumes', async () => {
      const zeroProduction = {
        wellId,
        createdByUserId: userId,
        productionDate: '2024-01-15',
        oilVolume: '0.00',
        gasVolume: '0.00',
        waterVolume: '0.00',
        oilPrice: '75.50',
        gasPrice: '3.25',
        isEstimated: false,
      };

      const [created] = await db
        .insert(schema.productionRecords)
        .values(zeroProduction)
        .returning();

      expect(created.oilVolume).toBe('0.00');
      expect(created.gasVolume).toBe('0.00');
      expect(created.waterVolume).toBe('0.00');
    });

    test('should store high precision decimal values', async () => {
      const preciseProduction = {
        wellId,
        createdByUserId: userId,
        productionDate: '2024-01-15',
        oilVolume: '123.456789',
        gasVolume: '987.654321',
        waterVolume: '45.123456',
        oilPrice: '75.123456',
        gasPrice: '3.987654',
        isEstimated: false,
      };

      const [created] = await db
        .insert(schema.productionRecords)
        .values(preciseProduction)
        .returning();

      expect(created.oilVolume).toBe('123.456789');
      expect(created.gasVolume).toBe('987.654321');
      expect(created.waterVolume).toBe('45.123456');
    });
  });

  describe('Partnership Percentage Validation', () => {
    let organizationId: string;
    let leaseId: string;
    let partner1Id: string;
    let partner2Id: string;

    beforeEach(async () => {
      const [org] = await db
        .insert(schema.organizations)
        .values({ name: 'Test Oil Company' })
        .returning();
      organizationId = org.id;

      const [lease] = await db
        .insert(schema.leases)
        .values({
          organizationId,
          name: 'Test Lease',
          county: 'Harris',
          state: 'TX',
          acreage: '160.00',
          leaseType: 'oil_gas' as const,
          effectiveDate: '2024-01-01',
        })
        .returning();
      leaseId = lease.id;

      const [partner1] = await db
        .insert(schema.partners)
        .values({
          organizationId,
          name: 'Partner One LLC',
          partnerType: 'working_interest' as const,
          taxId: '12-3456789',
          isActive: true,
        })
        .returning();
      partner1Id = partner1.id;

      const [partner2] = await db
        .insert(schema.partners)
        .values({
          organizationId,
          name: 'Partner Two Inc',
          partnerType: 'working_interest' as const,
          taxId: '98-7654321',
          isActive: true,
        })
        .returning();
      partner2Id = partner2.id;
    });

    test('should allow valid partnership percentages', async () => {
      const partnerships = [
        {
          leaseId,
          partnerId: partner1Id,
          workingInterestPercent: '60.00',
          royaltyInterestPercent: '12.50',
          effectiveDate: '2024-01-01',
          isActive: true,
        },
        {
          leaseId,
          partnerId: partner2Id,
          workingInterestPercent: '40.00',
          royaltyInterestPercent: '12.50',
          effectiveDate: '2024-01-01',
          isActive: true,
        },
      ];

      const created = await db
        .insert(schema.leasePartners)
        .values(partnerships)
        .returning();

      expect(created).toHaveLength(2);
      expect(created[0].workingInterestPercent).toBe('60.00');
      expect(created[1].workingInterestPercent).toBe('40.00');
    });

    test('should validate partnership percentage totals', async () => {
      // Insert partnerships
      await db.insert(schema.leasePartners).values([
        {
          leaseId,
          partnerId: partner1Id,
          workingInterestPercent: '60.00',
          royaltyInterestPercent: '12.50',
          effectiveDate: '2024-01-01',
          isActive: true,
        },
        {
          leaseId,
          partnerId: partner2Id,
          workingInterestPercent: '40.00',
          royaltyInterestPercent: '12.50',
          effectiveDate: '2024-01-01',
          isActive: true,
        },
      ]);

      // Query to validate totals
      const result = await db
        .select({
          totalWorkingInterest: sum(
            schema.leasePartners.workingInterestPercent,
          ),
        })
        .from(schema.leasePartners)
        .where(eq(schema.leasePartners.leaseId, leaseId));

      // Note: This would require custom validation logic in application layer
      // Database stores as strings, so we'd need to convert and validate
      const total = parseFloat(result[0].totalWorkingInterest || '0');
      expect(total).toBe(100.0);
    });
  });

  describe('Well Status Transitions', () => {
    let organizationId: string;

    beforeEach(async () => {
      const [org] = await db
        .insert(schema.organizations)
        .values({ name: 'Test Oil Company' })
        .returning();
      organizationId = org.id;
    });

    test('should allow valid well status values', async () => {
      const validStatuses = [
        'active',
        'inactive',
        'plugged',
        'drilling',
      ] as const;

      for (const status of validStatuses) {
        const [well] = await db
          .insert(schema.wells)
          .values({
            organizationId,
            apiNumber: `42-123-${Math.random().toString().slice(2, 7)}-00`,
            name: `${status} Well`,
            status,
            wellType: 'oil' as const,
          })
          .returning();

        expect(well.status).toBe(status);
      }
    });

    test('should track well status history through updates', async () => {
      const [well] = await db
        .insert(schema.wells)
        .values({
          organizationId,
          apiNumber: '42-123-12345-05',
          name: 'Status Test Well',
          status: 'drilling' as const,
          wellType: 'oil' as const,
        })
        .returning();

      // Update status to active
      await db
        .update(schema.wells)
        .set({
          status: 'active' as const,
          firstProductionDate: '2024-01-15',
        })
        .where(eq(schema.wells.id, well.id));

      const [updated] = await db
        .select()
        .from(schema.wells)
        .where(eq(schema.wells.id, well.id));

      expect(updated.status).toBe('active');
      expect(updated.firstProductionDate).toBe('2024-01-15');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        updated.createdAt.getTime(),
      );
    });
  });

  describe('User Role-Based Access', () => {
    let organizationId: string;

    beforeEach(async () => {
      const [org] = await db
        .insert(schema.organizations)
        .values({ name: 'Test Oil Company' })
        .returning();
      organizationId = org.id;
    });

    test('should enforce valid user roles', async () => {
      const validRoles = ['owner', 'manager', 'pumper'] as const;

      for (const role of validRoles) {
        const [user] = await db
          .insert(schema.users)
          .values({
            organizationId,
            email: `${role}@test.com`,
            firstName: 'Test',
            lastName: 'User',
            role,
            passwordHash: '$2b$10$test.hash',
            isActive: true,
          })
          .returning();

        expect(user.role).toBe(role);
      }
    });

    test('should enforce unique email addresses', async () => {
      const email = 'duplicate@test.com';

      await db.insert(schema.users).values({
        organizationId,
        email,
        firstName: 'First',
        lastName: 'User',
        role: 'owner' as const,
        passwordHash: '$2b$10$test.hash',
        isActive: true,
      });

      // Attempt duplicate email
      await expect(
        db.insert(schema.users).values({
          organizationId,
          email, // Same email
          firstName: 'Second',
          lastName: 'User',
          role: 'manager' as const,
          passwordHash: '$2b$10$test.hash',
          isActive: true,
        }),
      ).rejects.toThrow();
    });
  });

  describe('Audit Trail Validation', () => {
    let organizationId: string;

    beforeEach(async () => {
      const [org] = await db
        .insert(schema.organizations)
        .values({ name: 'Test Oil Company' })
        .returning();
      organizationId = org.id;
    });

    test('should automatically set created_at and updated_at timestamps', async () => {
      const beforeCreate = new Date();

      const [well] = await db
        .insert(schema.wells)
        .values({
          organizationId,
          apiNumber: '42-123-12345-06',
          name: 'Audit Test Well',
          status: 'active' as const,
          wellType: 'oil' as const,
        })
        .returning();

      const afterCreate = new Date();

      expect(well.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime(),
      );
      expect(well.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime(),
      );
      expect(well.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime(),
      );
      expect(well.updatedAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime(),
      );
    });

    test('should update updated_at timestamp on record changes', async () => {
      const [well] = await db
        .insert(schema.wells)
        .values({
          organizationId,
          apiNumber: '42-123-12345-07',
          name: 'Update Test Well',
          status: 'active' as const,
          wellType: 'oil' as const,
        })
        .returning();

      // Wait a moment to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const beforeUpdate = new Date();

      await db
        .update(schema.wells)
        .set({ name: 'Updated Well Name' })
        .where(eq(schema.wells.id, well.id));

      const [updated] = await db
        .select()
        .from(schema.wells)
        .where(eq(schema.wells.id, well.id));

      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        well.updatedAt.getTime(),
      );
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(updated.createdAt.getTime()).toBe(well.createdAt.getTime()); // Should not change
    });
  });
});
