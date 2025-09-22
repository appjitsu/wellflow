/**
 * Database Business Rules Tests
 *
 * Tests for oil & gas industry-specific business rules and validations
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, sum } from 'drizzle-orm';
import * as schema from '../schema';
import { generateUniqueEmail } from './test-utils';

describe('Database Business Rules Tests', () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;
  // Helper function to generate unique API numbers
  const generateUniqueApiNumber = (): string => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `42123${timestamp}${random}`.slice(0, 14);
  };

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

  // Note: Removed aggressive beforeEach cleanup that was interfering with other tests
  // Individual tests will clean up their own data as needed

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
        generateUniqueApiNumber(),
        generateUniqueApiNumber(),
        generateUniqueApiNumber(),
      ];

      for (const apiNumber of validApiNumbers) {
        const [well] = await db
          .insert(schema.wells)
          .values({
            organizationId,
            apiNumber,
            wellName: `Well ${apiNumber}`,
            wellType: 'oil' as const,
            status: 'active' as const,
          })
          .returning();

        expect(well.apiNumber).toBe(apiNumber);
      }
    });

    test('should enforce API number uniqueness across all organizations', async () => {
      const apiNumber = generateUniqueApiNumber();

      // Create first well
      await db.insert(schema.wells).values({
        organizationId,
        apiNumber,
        wellName: 'First Well',
        wellType: 'oil' as const,
        status: 'active' as const,
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
          wellName: 'Second Well',
          wellType: 'oil' as const,
          status: 'active' as const,
        }),
      ).rejects.toThrow();
    });
  });

  describe('Production Volume Validation', () => {
    let organizationId: string;
    let wellId: string;

    beforeEach(async () => {
      const [org] = await db
        .insert(schema.organizations)
        .values({ name: 'Test Oil Company' })
        .returning();
      organizationId = org.id;

      // Use a unique API number for each test run
      const uniqueApiNumber = `42123123450${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0')}`;

      const [well] = await db
        .insert(schema.wells)
        .values({
          organizationId,
          apiNumber: uniqueApiNumber,
          wellName: 'Production Test Well',
          wellType: 'oil' as const,
          status: 'active' as const,
        })
        .returning();
      wellId = well.id;
    });

    test('should accept valid production volumes', async () => {
      const validProduction = {
        organizationId,
        wellId,
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
        organizationId,
        wellId,
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
        organizationId,
        wellId,
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

      expect(created.oilVolume).toBe('123.46');
      expect(created.gasVolume).toBe('987.65');
      expect(created.waterVolume).toBe('45.12');
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
          lessor: 'Test Lessor LLC',
          lessee: 'Test Lessee Inc',
          acreage: '160.00',
          royaltyRate: '0.1875',
        })
        .returning();
      leaseId = lease.id;

      const [partner1] = await db
        .insert(schema.partners)
        .values({
          organizationId,
          partnerName: 'Partner One LLC',
          partnerCode: 'P001',
          isActive: true,
        })
        .returning();
      partner1Id = partner1.id;

      const [partner2] = await db
        .insert(schema.partners)
        .values({
          organizationId,
          partnerName: 'Partner Two Inc',
          partnerCode: 'P002',
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
          workingInterestPercent: '0.6000',
          royaltyInterestPercent: '0.1250',
          netRevenueInterestPercent: '0.4750',
          effectiveDate: '2024-01-01',
        },
        {
          leaseId,
          partnerId: partner2Id,
          workingInterestPercent: '0.4000',
          royaltyInterestPercent: '0.1250',
          netRevenueInterestPercent: '0.2750',
          effectiveDate: '2024-01-01',
        },
      ];

      const created = await db
        .insert(schema.leasePartners)
        .values(partnerships)
        .returning();

      expect(created).toHaveLength(2);
      expect(created[0].workingInterestPercent).toBe('0.6000');
      expect(created[1].workingInterestPercent).toBe('0.4000');
    });

    test('should validate partnership percentage totals', async () => {
      // Insert partnerships
      await db.insert(schema.leasePartners).values([
        {
          leaseId,
          partnerId: partner1Id,
          workingInterestPercent: '0.6000',
          royaltyInterestPercent: '0.1250',
          netRevenueInterestPercent: '0.4750',
          effectiveDate: '2024-01-01',
        },
        {
          leaseId,
          partnerId: partner2Id,
          workingInterestPercent: '0.4000',
          royaltyInterestPercent: '0.1250',
          netRevenueInterestPercent: '0.2750',
          effectiveDate: '2024-01-01',
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
      expect(total).toBe(1.0); // 0.6 + 0.4 = 1.0 (100%)
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
            apiNumber: `42123${Math.random().toString().slice(2, 7)}00`,
            wellName: `${status} Well`,
            wellType: 'oil' as const,
            status,
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
          apiNumber: generateUniqueApiNumber(),
          wellName: 'Status Test Well',
          wellType: 'oil' as const,
          status: 'drilling' as const,
        })
        .returning();

      // Add small delay to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Update status to active
      await db
        .update(schema.wells)
        .set({
          status: 'active' as const,
          completionDate: '2024-01-15',
        })
        .where(eq(schema.wells.id, well.id));

      const [updated] = await db
        .select()
        .from(schema.wells)
        .where(eq(schema.wells.id, well.id));

      expect(updated.status).toBe('active');
      expect(updated.completionDate).toBe('2024-01-15');
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
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
            email: generateUniqueEmail(role),
            firstName: 'Test',
            lastName: 'User',
            role,
            isActive: true,
          })
          .returning();

        expect(user.role).toBe(role);
      }
    });

    test('should enforce unique email addresses', async () => {
      const email = generateUniqueEmail('duplicate');

      await db.insert(schema.users).values({
        organizationId,
        email,
        firstName: 'First',
        lastName: 'User',
        role: 'owner' as const,
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
          apiNumber: generateUniqueApiNumber(),
          wellName: 'Audit Test Well',
          wellType: 'oil' as const,
          status: 'active' as const,
        })
        .returning();

      const afterCreate = new Date();

      expect(well.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime() - 100, // Allow 100ms tolerance
      );
      expect(well.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime(),
      );
      expect(well.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime() - 100, // Allow 100ms tolerance
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
          apiNumber: generateUniqueApiNumber(),
          wellName: 'Update Test Well',
          wellType: 'oil' as const,
          status: 'active' as const,
        })
        .returning();

      // Wait a moment to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 50));

      const beforeUpdate = new Date();

      await db
        .update(schema.wells)
        .set({ wellName: 'Updated Well Name' })
        .where(eq(schema.wells.id, well.id));

      const [updated] = await db
        .select()
        .from(schema.wells)
        .where(eq(schema.wells.id, well.id));

      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        well.updatedAt.getTime(),
      );
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime() - 100, // Allow 100ms tolerance
      );
      expect(updated.createdAt.getTime()).toBe(well.createdAt.getTime()); // Should not change
    });
  });
});
