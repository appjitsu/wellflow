import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from '../schema';
import { TEST_DB_CONFIG } from './env';
import { eq } from 'drizzle-orm';

// Test database connection
const testDb = new Client({
  host: TEST_DB_CONFIG.host,
  port: TEST_DB_CONFIG.port,
  user: TEST_DB_CONFIG.user,
  password: TEST_DB_CONFIG.password,
  database: TEST_DB_CONFIG.database,
});

const db = drizzle(testDb, { schema });

describe('Database Validation Constraints', () => {
  let testOrgId: string;

  beforeAll(async () => {
    // Create test organization
    const [org] = await db
      .insert(schema.organizations)
      .values({ name: 'Test Validation Org' })
      .returning();
    testOrgId = org!.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db
      .delete(schema.organizations)
      .where(eq(schema.organizations.id, testOrgId));
    await testDb.end();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await db.delete(schema.productionRecords);
    await db.delete(schema.leasePartners);
    await db.delete(schema.wells);
    await db.delete(schema.leases);
    await db.delete(schema.partners);
  });

  describe('Wells API Number Constraints', () => {
    it('should accept valid 14-digit API numbers', async () => {
      const validApiNumbers = [
        '42123456789012',
        '01001000000001',
        '48999123456789',
      ];

      for (const apiNumber of validApiNumbers) {
        const [well] = await db
          .insert(schema.wells)
          .values({
            organizationId: testOrgId,
            apiNumber,
            wellName: `Test Well ${apiNumber}`,
            wellType: 'OIL',
            status: 'active',
          })
          .returning();

        expect(well!.apiNumber).toBe(apiNumber);
      }
    });

    it('should reject API numbers with invalid format', async () => {
      const invalidApiNumbers = [
        'INVALID-API-12', // Contains letters and hyphens
        '123', // Too short
        '421234567890123', // Too long
        '42abc456789012', // Contains letters
      ];

      for (const apiNumber of invalidApiNumbers) {
        await expect(
          db.insert(schema.wells).values({
            organizationId: testOrgId,
            apiNumber,
            wellName: `Test Well ${apiNumber}`,
            wellType: 'OIL',
            status: 'active',
          }),
        ).rejects.toThrow();
      }
    });

    it('should reject negative total depth', async () => {
      await expect(
        db.insert(schema.wells).values({
          organizationId: testOrgId,
          apiNumber: '42123456789012',
          wellName: 'Test Well',
          wellType: 'OIL',
          status: 'active',
          totalDepth: '-1000', // Negative depth
        }),
      ).rejects.toThrow();
    });

    it('should enforce unique API numbers', async () => {
      const apiNumber = '42123456789012';

      // First insert should succeed
      await db.insert(schema.wells).values({
        organizationId: testOrgId,
        apiNumber,
        wellName: 'Test Well 1',
        wellType: 'OIL',
        status: 'active',
      });

      // Second insert with same API number should fail
      await expect(
        db.insert(schema.wells).values({
          organizationId: testOrgId,
          apiNumber,
          wellName: 'Test Well 2',
          wellType: 'GAS',
          status: 'active',
        }),
      ).rejects.toThrow();
    });
  });

  describe('Production Records Volume Constraints', () => {
    let testWellId: string;

    beforeEach(async () => {
      // Create test well
      const [well] = await db
        .insert(schema.wells)
        .values({
          organizationId: testOrgId,
          apiNumber: '42123456789012',
          wellName: 'Test Well',
          wellType: 'OIL',
          status: 'active',
        })
        .returning();
      testWellId = well!.id;
    });

    it('should accept non-negative production volumes', async () => {
      const [record] = await db
        .insert(schema.productionRecords)
        .values({
          organizationId: testOrgId,
          wellId: testWellId,
          productionDate: '2024-01-15',
          oilVolume: '100.5',
          gasVolume: '500.25',
          waterVolume: '25.0',
        })
        .returning();

      expect(record!.oilVolume).toBe('100.5');
      expect(record!.gasVolume).toBe('500.25');
      expect(record!.waterVolume).toBe('25.0');
    });

    it('should accept zero production volumes', async () => {
      const [record] = await db
        .insert(schema.productionRecords)
        .values({
          organizationId: testOrgId,
          wellId: testWellId,
          productionDate: '2024-01-15',
          oilVolume: '0',
          gasVolume: '0',
          waterVolume: '0',
        })
        .returning();

      expect(record!.oilVolume).toBe('0');
    });

    it('should reject negative production volumes', async () => {
      // Test negative oil volume
      await expect(
        db.insert(schema.productionRecords).values({
          organizationId: testOrgId,
          wellId: testWellId,
          productionDate: '2024-01-15',
          oilVolume: '-10.5', // Negative volume
          gasVolume: '500.25',
          waterVolume: '25.0',
        }),
      ).rejects.toThrow();

      // Test negative gas volume
      await expect(
        db.insert(schema.productionRecords).values({
          organizationId: testOrgId,
          wellId: testWellId,
          productionDate: '2024-01-15',
          oilVolume: '100.5',
          gasVolume: '-500.25', // Negative volume
          waterVolume: '25.0',
        }),
      ).rejects.toThrow();

      // Test negative water volume
      await expect(
        db.insert(schema.productionRecords).values({
          organizationId: testOrgId,
          wellId: testWellId,
          productionDate: '2024-01-15',
          oilVolume: '100.5',
          gasVolume: '500.25',
          waterVolume: '-25.0', // Negative volume
        }),
      ).rejects.toThrow();
    });

    it('should reject negative prices', async () => {
      await expect(
        db.insert(schema.productionRecords).values({
          organizationId: testOrgId,
          wellId: testWellId,
          productionDate: '2024-01-15',
          oilVolume: '100.5',
          oilPrice: '-50.0', // Negative price
        }),
      ).rejects.toThrow();
    });

    it('should enforce unique well-date combinations', async () => {
      const productionData = {
        organizationId: testOrgId,
        wellId: testWellId,
        productionDate: '2024-01-15',
        oilVolume: '100.5',
      };

      // First insert should succeed
      await db.insert(schema.productionRecords).values(productionData);

      // Second insert with same well and date should fail
      await expect(
        db.insert(schema.productionRecords).values({
          ...productionData,
          gasVolume: '500.0', // Different volume but same well and date
        }),
      ).rejects.toThrow();
    });
  });

  describe('Lease Constraints', () => {
    it('should accept valid lease data', async () => {
      const [lease] = await db
        .insert(schema.leases)
        .values({
          organizationId: testOrgId,
          name: 'Test Lease',
          lessor: 'John Doe',
          lessee: 'Oil Company Inc.',
          acreage: '160.5',
          royaltyRate: '0.1875',
          effectiveDate: '2024-01-01',
          expirationDate: '2029-01-01',
        })
        .returning();

      expect(lease!.name).toBe('Test Lease');
      expect(lease!.royaltyRate).toBe('0.1875');
    });

    it('should reject invalid royalty rates', async () => {
      // Test royalty rate > 100%
      await expect(
        db.insert(schema.leases).values({
          organizationId: testOrgId,
          name: 'Test Lease',
          lessor: 'John Doe',
          lessee: 'Oil Company Inc.',
          royaltyRate: '1.5', // 150% - invalid
        }),
      ).rejects.toThrow();

      // Test negative royalty rate
      await expect(
        db.insert(schema.leases).values({
          organizationId: testOrgId,
          name: 'Test Lease',
          lessor: 'John Doe',
          lessee: 'Oil Company Inc.',
          royaltyRate: '-0.1', // Negative - invalid
        }),
      ).rejects.toThrow();
    });

    it('should reject negative acreage', async () => {
      await expect(
        db.insert(schema.leases).values({
          organizationId: testOrgId,
          name: 'Test Lease',
          lessor: 'John Doe',
          lessee: 'Oil Company Inc.',
          acreage: '-160.5', // Negative acreage
        }),
      ).rejects.toThrow();
    });

    it('should reject invalid date ranges', async () => {
      await expect(
        db.insert(schema.leases).values({
          organizationId: testOrgId,
          name: 'Test Lease',
          lessor: 'John Doe',
          lessee: 'Oil Company Inc.',
          effectiveDate: '2024-01-01',
          expirationDate: '2023-01-01', // Before effective date
        }),
      ).rejects.toThrow();
    });
  });

  describe('Lease Partner Percentage Constraints', () => {
    let testLeaseId: string;
    let testPartnerId: string;

    beforeEach(async () => {
      // Create test lease
      const [lease] = await db
        .insert(schema.leases)
        .values({
          organizationId: testOrgId,
          name: 'Test Lease',
          lessor: 'John Doe',
          lessee: 'Oil Company Inc.',
        })
        .returning();
      testLeaseId = lease!.id;

      // Create test partner
      const [partner] = await db
        .insert(schema.partners)
        .values({
          organizationId: testOrgId,
          partnerName: 'Test Partner',
          partnerCode: 'TP001',
        })
        .returning();
      testPartnerId = partner!.id;
    });

    it('should accept valid percentage ranges', async () => {
      const [leasePartner] = await db
        .insert(schema.leasePartners)
        .values({
          leaseId: testLeaseId,
          partnerId: testPartnerId,
          workingInterestPercent: '0.5',
          royaltyInterestPercent: '0.125',
          netRevenueInterestPercent: '0.4',
          effectiveDate: '2024-01-01',
        })
        .returning();

      expect(leasePartner!.workingInterestPercent).toBe('0.5');
      expect(leasePartner!.royaltyInterestPercent).toBe('0.125');
      expect(leasePartner!.netRevenueInterestPercent).toBe('0.4');
    });

    it('should reject percentages outside 0-100% range', async () => {
      // Test working interest > 100%
      await expect(
        db.insert(schema.leasePartners).values({
          leaseId: testLeaseId,
          partnerId: testPartnerId,
          workingInterestPercent: '1.5', // 150% - invalid
          royaltyInterestPercent: '0.125',
          netRevenueInterestPercent: '0.4',
          effectiveDate: '2024-01-01',
        }),
      ).rejects.toThrow();

      // Test negative percentage
      await expect(
        db.insert(schema.leasePartners).values({
          leaseId: testLeaseId,
          partnerId: testPartnerId,
          workingInterestPercent: '0.5',
          royaltyInterestPercent: '-0.125', // Negative - invalid
          netRevenueInterestPercent: '0.4',
          effectiveDate: '2024-01-01',
        }),
      ).rejects.toThrow();
    });

    it('should reject invalid date ranges', async () => {
      await expect(
        db.insert(schema.leasePartners).values({
          leaseId: testLeaseId,
          partnerId: testPartnerId,
          workingInterestPercent: '0.5',
          royaltyInterestPercent: '0.125',
          netRevenueInterestPercent: '0.4',
          effectiveDate: '2024-01-01',
          endDate: '2023-01-01', // Before effective date
        }),
      ).rejects.toThrow();
    });
  });
});
