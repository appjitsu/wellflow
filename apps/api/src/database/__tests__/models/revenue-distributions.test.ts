/**
 * Revenue Distributions Model Tests
 * Tests for revenue distribution schema, business logic, and validation
 */

import * as schema from '../../schema';
import {
  revenueDistributions,
  organizations,
  wells,
  leases,
  partners,
  divisionOrders,
} from '../../schema';
import { eq, and, gte, lte } from 'drizzle-orm';
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

describe('Revenue Distributions Model', () => {
  let testOrgId: string;
  let testLeaseId: string;
  let testWellId: string;
  let testPartnerId: string;
  let testDivisionOrderId: string;

  beforeAll(async () => {
    // Create test organization
    const org = await db
      .insert(organizations)
      .values({
        name: 'Test Revenue Organization',
        taxId: '55-5555555',
      })
      .returning();
    testOrgId = org[0]!.id;

    // Create test lease
    const lease = await db
      .insert(leases)
      .values({
        organizationId: testOrgId,
        name: 'Test Revenue Lease',
        leaseNumber: 'TRL-REV-001',
        lessor: 'Test Lessor',
        lessee: 'Test Revenue Organization',
        acreage: '480.0000',
        royaltyRate: '0.1875',
        status: 'ACTIVE',
      })
      .returning();
    testLeaseId = lease[0]!.id;

    // Create test well
    const well = await db
      .insert(wells)
      .values({
        organizationId: testOrgId,
        leaseId: testLeaseId,
        wellName: 'Test Revenue Well #1',
        apiNumber: '42255987650000',
        wellType: 'OIL',
        status: 'active',
      })
      .returning();
    testWellId = well[0]!.id;

    // Create test partner
    const partner = await db
      .insert(partners)
      .values({
        organizationId: testOrgId,
        partnerName: 'Test Revenue Partner',
        partnerCode: 'REV001',
        contactEmail: 'partner@revenue.test',
      })
      .returning();
    testPartnerId = partner[0]!.id;

    // Create test division order
    const divisionOrder = await db
      .insert(divisionOrders)
      .values({
        organizationId: testOrgId,
        wellId: testWellId,
        partnerId: testPartnerId,
        decimalInterest: '0.125', // 12.5% working interest
        effectiveDate: '2024-01-01',
        isActive: true,
      })
      .returning();
    testDivisionOrderId = divisionOrder[0]!.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db
      .delete(divisionOrders)
      .where(eq(divisionOrders.id, testDivisionOrderId));
    await db.delete(partners).where(eq(partners.id, testPartnerId));
    await db.delete(wells).where(eq(wells.id, testWellId));
    await db.delete(leases).where(eq(leases.id, testLeaseId));
    await db.delete(organizations).where(eq(organizations.id, testOrgId));
  });

  describe('Schema Coverage', () => {
    it('should have all required fields defined', () => {
      const table = schema.revenueDistributions;
      expect(table.id).toBeDefined();
      expect(table.organizationId).toBeDefined();
      expect(table.wellId).toBeDefined();
      expect(table.partnerId).toBeDefined();
      expect(table.divisionOrderId).toBeDefined();
      expect(table.productionMonth).toBeDefined();
      expect(table.totalRevenue).toBeDefined();
      expect(table.netRevenue).toBeDefined();
      expect(table.severanceTax).toBeDefined();
      expect(table.adValorem).toBeDefined();
      expect(table.transportationCosts).toBeDefined();
      expect(table.processingCosts).toBeDefined();
      expect(table.otherDeductions).toBeDefined();
      expect(table.createdAt).toBeDefined();
      expect(table.updatedAt).toBeDefined();
    });

    it('should access table indexes and constraints', () => {
      const table = schema.revenueDistributions;
      expect(table).toBeDefined();
      expect(typeof table).toBe('object');

      // Verify primary key
      expect(table.id.primary).toBe(true);

      // Verify required fields
      expect(table.productionMonth.notNull).toBe(true);
      expect(table.totalRevenue.notNull).toBe(true);
      expect(table.netRevenue.notNull).toBe(true);
    });
  });

  describe('Business Logic', () => {
    beforeEach(async () => {
      // Clean up test data
      await db
        .delete(revenueDistributions)
        .where(eq(revenueDistributions.organizationId, testOrgId));
    });

    afterEach(async () => {
      // Clean up test data
      await db
        .delete(revenueDistributions)
        .where(eq(revenueDistributions.organizationId, testOrgId));
    });

    it('should create a new revenue distribution with valid data', async () => {
      const newDistribution = {
        organizationId: testOrgId,
        wellId: testWellId,
        partnerId: testPartnerId,
        divisionOrderId: testDivisionOrderId,
        productionMonth: '2024-01-01',
        totalRevenue: '125000.00',
        netRevenue: '110000.00',
        severanceTax: '7500.00',
        adValorem: '2500.00',
        transportationCosts: '3000.00',
        processingCosts: '2000.00',
        otherDeductions: '0.00',
      };

      const result = await db
        .insert(revenueDistributions)
        .values(newDistribution)
        .returning();

      expect(result).toHaveLength(1);
      expect(parseFloat(result[0]!.totalRevenue || '0')).toBe(125000.0);
      expect(parseFloat(result[0]!.netRevenue || '0')).toBe(110000.0);
      expect(parseFloat(result[0]!.severanceTax || '0')).toBe(7500.0);
      expect(parseFloat(result[0]!.adValorem || '0')).toBe(2500.0);
      expect(result[0]!.id).toBeDefined();
      expect(result[0]!.createdAt).toBeDefined();
      expect(result[0]!.updatedAt).toBeDefined();
    });

    it('should enforce required fields', async () => {
      const invalidDistribution = {
        organizationId: testOrgId,
        wellId: testWellId,
        partnerId: testPartnerId,
        divisionOrderId: testDivisionOrderId,
        productionMonth: '2024-01-01',
        // Missing required totalRevenue
        netRevenue: 110000.0,
      };

      await expect(
        db.insert(revenueDistributions).values(invalidDistribution as any),
      ).rejects.toThrow();
    });

    it('should validate revenue calculations', async () => {
      const distribution = {
        organizationId: testOrgId,
        wellId: testWellId,
        partnerId: testPartnerId,
        divisionOrderId: testDivisionOrderId,
        productionMonth: '2024-02-01',
        totalRevenue: '100000.00',
        netRevenue: '85000.00',
        severanceTax: '6000.00',
        adValorem: '2000.00',
        transportationCosts: '4000.00',
        processingCosts: '2500.00',
        otherDeductions: '500.00',
      };

      const result = await db
        .insert(revenueDistributions)
        .values(distribution)
        .returning();

      // Verify deductions add up correctly
      const totalDeductions =
        parseFloat(result[0]!.severanceTax || '0') +
        parseFloat(result[0]!.adValorem || '0') +
        parseFloat(result[0]!.transportationCosts || '0') +
        parseFloat(result[0]!.processingCosts || '0') +
        parseFloat(result[0]!.otherDeductions || '0');

      const calculatedNet =
        parseFloat(result[0]!.totalRevenue || '0') - totalDeductions;
      expect(calculatedNet).toBe(parseFloat(result[0]!.netRevenue || '0'));
    });

    it('should enforce unique partner-well-month constraint', async () => {
      const productionMonth = '2024-03-01';

      const distribution1 = {
        organizationId: testOrgId,
        wellId: testWellId,
        partnerId: testPartnerId,
        divisionOrderId: testDivisionOrderId,
        productionMonth,
        totalRevenue: '100000.00',
        netRevenue: '90000.00',
        severanceTax: '6000.00',
        adValorem: '2000.00',
        transportationCosts: '2000.00',
        processingCosts: '0.00',
        otherDeductions: '0.00',
      };

      const distribution2 = {
        organizationId: testOrgId,
        wellId: testWellId,
        partnerId: testPartnerId,
        divisionOrderId: testDivisionOrderId,
        productionMonth, // Same partner, well, and month
        totalRevenue: '105000.00',
        netRevenue: '95000.00',
        severanceTax: '6300.00',
        adValorem: '2100.00',
        transportationCosts: '1600.00',
        processingCosts: '0.00',
        otherDeductions: '0.00',
      };

      // First insert should succeed
      await db.insert(revenueDistributions).values(distribution1);

      // Second insert with same partner, well, and month should fail
      await expect(
        db.insert(revenueDistributions).values(distribution2),
      ).rejects.toThrow();
    });

    it('should calculate partner revenue share based on decimal interest', async () => {
      const totalWellRevenue = 200000.0;
      const partnerInterest = 0.125; // 12.5%
      const expectedPartnerRevenue = totalWellRevenue * partnerInterest;

      const distribution = {
        organizationId: testOrgId,
        wellId: testWellId,
        partnerId: testPartnerId,
        divisionOrderId: testDivisionOrderId,
        productionMonth: '2024-04-01',
        totalRevenue: expectedPartnerRevenue.toFixed(2), // Partner's share
        netRevenue: (expectedPartnerRevenue * 0.85).toFixed(2), // After deductions
        severanceTax: (expectedPartnerRevenue * 0.06).toFixed(2),
        adValorem: (expectedPartnerRevenue * 0.02).toFixed(2),
        transportationCosts: (expectedPartnerRevenue * 0.05).toFixed(2),
        processingCosts: (expectedPartnerRevenue * 0.02).toFixed(2),
        otherDeductions: '0.00',
      };

      const result = await db
        .insert(revenueDistributions)
        .values(distribution)
        .returning();

      expect(parseFloat(result[0]!.totalRevenue || '0')).toBe(25000.0); // 12.5% of $200,000
      expect(parseFloat(result[0]!.netRevenue || '0')).toBe(21250.0); // 85% of partner's share
    });

    it('should update revenue distribution data', async () => {
      // Create initial distribution
      const initialDistribution = {
        organizationId: testOrgId,
        wellId: testWellId,
        partnerId: testPartnerId,
        divisionOrderId: testDivisionOrderId,
        productionMonth: '2024-05-01',
        totalRevenue: '80000.00',
        netRevenue: '70000.00',
        severanceTax: '4800.00',
        adValorem: '1600.00',
        transportationCosts: '2400.00',
        processingCosts: '1200.00',
        otherDeductions: '0.00',
      };

      const created = await db
        .insert(revenueDistributions)
        .values(initialDistribution)
        .returning();
      const distributionId = created[0]!.id;

      // Update with revised revenue data
      const updatedData = {
        totalRevenue: '85000.00',
        netRevenue: '74500.00',
        severanceTax: '5100.00',
        adValorem: '1700.00',
        transportationCosts: '2550.00',
        processingCosts: '1150.00',
      };

      const updated = await db
        .update(revenueDistributions)
        .set(updatedData)
        .where(eq(revenueDistributions.id, distributionId))
        .returning();

      expect(parseFloat(updated[0]!.totalRevenue || '0')).toBe(85000.0);
      expect(parseFloat(updated[0]!.netRevenue || '0')).toBe(74500.0);
      expect(parseFloat(updated[0]!.severanceTax || '0')).toBe(5100.0);
      expect(updated[0]!.updatedAt).not.toBe(created[0]!.updatedAt);
    });

    it('should handle zero revenue months', async () => {
      const zeroDistribution = {
        organizationId: testOrgId,
        wellId: testWellId,
        partnerId: testPartnerId,
        divisionOrderId: testDivisionOrderId,
        productionMonth: '2024-06-01',
        totalRevenue: '0.00',
        netRevenue: '0.00',
        severanceTax: '0.00',
        adValorem: '0.00',
        transportationCosts: '0.00',
        processingCosts: '0.00',
        otherDeductions: '0.00',
      };

      const result = await db
        .insert(revenueDistributions)
        .values(zeroDistribution)
        .returning();

      expect(parseFloat(result[0]!.totalRevenue || '0')).toBe(0.0);
      expect(parseFloat(result[0]!.netRevenue || '0')).toBe(0.0);
      expect(parseFloat(result[0]!.severanceTax || '0')).toBe(0.0);
    });
  });

  describe('Query Operations', () => {
    beforeEach(async () => {
      await db
        .delete(revenueDistributions)
        .where(eq(revenueDistributions.organizationId, testOrgId));

      // Insert test data for 6 months
      const testData = [
        {
          month: '2024-01-01',
          total: 120000,
          net: 105000,
          tax: 7200,
          adVal: 2400,
        },
        {
          month: '2024-02-01',
          total: 115000,
          net: 101000,
          tax: 6900,
          adVal: 2300,
        },
        {
          month: '2024-03-01',
          total: 110000,
          net: 97000,
          tax: 6600,
          adVal: 2200,
        },
        {
          month: '2024-04-01',
          total: 105000,
          net: 92000,
          tax: 6300,
          adVal: 2100,
        },
        {
          month: '2024-05-01',
          total: 100000,
          net: 88000,
          tax: 6000,
          adVal: 2000,
        },
        {
          month: '2024-06-01',
          total: 95000,
          net: 84000,
          tax: 5700,
          adVal: 1900,
        },
      ];

      await db.insert(revenueDistributions).values(
        testData.map((data) => ({
          organizationId: testOrgId,
          wellId: testWellId,
          partnerId: testPartnerId,
          divisionOrderId: testDivisionOrderId,
          productionMonth: data.month,
          totalRevenue: data.total.toFixed(2),
          netRevenue: data.net.toFixed(2),
          severanceTax: data.tax.toFixed(2),
          adValorem: data.adVal.toFixed(2),
          transportationCosts: '2000.00',
          processingCosts: '1000.00',
          otherDeductions: '0.00',
        })),
      );
    });

    afterEach(async () => {
      await db
        .delete(revenueDistributions)
        .where(eq(revenueDistributions.organizationId, testOrgId));
    });

    it('should find revenue distributions by date range', async () => {
      const startDate = '2024-02-01';
      const endDate = '2024-04-30';

      const distributions = await db
        .select()
        .from(revenueDistributions)
        .where(
          and(
            eq(revenueDistributions.wellId, testWellId),
            gte(revenueDistributions.productionMonth, startDate),
            lte(revenueDistributions.productionMonth, endDate),
          ),
        );

      expect(distributions).toHaveLength(3); // Feb, Mar, Apr
      expect(distributions.every((d) => d.wellId === testWellId)).toBe(true);
    });

    it('should calculate cumulative revenue', async () => {
      const allDistributions = await db
        .select()
        .from(revenueDistributions)
        .where(eq(revenueDistributions.partnerId, testPartnerId));

      const cumulativeTotal = allDistributions.reduce(
        (sum, dist) => sum + parseFloat(dist.totalRevenue || '0'),
        0,
      );
      const cumulativeNet = allDistributions.reduce(
        (sum, dist) => sum + parseFloat(dist.netRevenue || '0'),
        0,
      );
      const cumulativeTax = allDistributions.reduce(
        (sum, dist) => sum + parseFloat(dist.severanceTax || '0'),
        0,
      );

      expect(cumulativeTotal).toBe(645000.0); // Sum of all total revenue
      expect(cumulativeNet).toBe(567000.0); // Sum of all net revenue
      expect(cumulativeTax).toBe(38700.0); // Sum of all severance tax
    });

    it('should find peak revenue month', async () => {
      const allDistributions = await db
        .select()
        .from(revenueDistributions)
        .where(eq(revenueDistributions.partnerId, testPartnerId))
        .orderBy(revenueDistributions.productionMonth);

      const peakRevenueDistribution = allDistributions.reduce(
        (max, dist) =>
          parseFloat(dist.totalRevenue || '0') >
          parseFloat(max?.totalRevenue || '0')
            ? dist
            : max,
        allDistributions[0],
      );

      expect(parseFloat(peakRevenueDistribution!.totalRevenue || '0')).toBe(
        120000.0,
      );
      // Check that this is indeed the highest revenue month
      const allRevenues = allDistributions.map((d) =>
        parseFloat(d.totalRevenue || '0'),
      );
      const maxRevenue = Math.max(...allRevenues);
      expect(parseFloat(peakRevenueDistribution!.totalRevenue || '0')).toBe(
        maxRevenue,
      );
    });

    it('should calculate average deduction rates', async () => {
      const allDistributions = await db
        .select()
        .from(revenueDistributions)
        .where(eq(revenueDistributions.partnerId, testPartnerId));

      const avgSeveranceRate =
        allDistributions.reduce(
          (sum, dist) =>
            sum +
            parseFloat(dist.severanceTax || '0') /
              parseFloat(dist.totalRevenue || '1'),
          0,
        ) / allDistributions.length;

      const avgAdValoremRate =
        allDistributions.reduce(
          (sum, dist) =>
            sum +
            parseFloat(dist.adValorem || '0') /
              parseFloat(dist.totalRevenue || '1'),
          0,
        ) / allDistributions.length;

      expect(avgSeveranceRate).toBeCloseTo(0.06, 3); // 6% average severance tax rate
      expect(avgAdValoremRate).toBeCloseTo(0.02, 3); // 2% average ad valorem rate
    });

    it('should find distributions by partner', async () => {
      const partnerDistributions = await db
        .select()
        .from(revenueDistributions)
        .where(eq(revenueDistributions.partnerId, testPartnerId));

      expect(partnerDistributions.length).toBeGreaterThanOrEqual(6);
      expect(
        partnerDistributions.every((d) => d.partnerId === testPartnerId),
      ).toBe(true);
    });
  });
});
