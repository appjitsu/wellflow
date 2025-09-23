/**
 * AFEs (Authorization for Expenditure) Model Tests
 * Tests for AFE schema, business logic, and validation
 */

import * as schema from '../../schema';
import { afes, organizations, wells, leases, users } from '../../schema';
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

describe('AFEs Model', () => {
  let testOrgId: string;
  let testLeaseId: string;
  let testWellId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test organization
    const org = await db
      .insert(organizations)
      .values({
        name: 'Test AFE Organization',
        taxId: '77-7777777',
      })
      .returning();
    testOrgId = org[0]!.id;

    // Create test user
    const user = await db
      .insert(users)
      .values({
        organizationId: testOrgId,
        email: 'afe.test@testoil.com',
        firstName: 'AFE',
        lastName: 'Tester',
        role: 'owner', // Use valid enum value
      })
      .returning();
    testUserId = user[0]!.id;

    // Create test lease
    const lease = await db
      .insert(leases)
      .values({
        organizationId: testOrgId,
        name: 'Test AFE Lease',
        leaseNumber: 'TAL-AFE-001',
        lessor: 'Test Lessor',
        lessee: 'Test AFE Organization',
        acreage: '320.0000',
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
        wellName: 'Test AFE Well #1',
        apiNumber: '42329123450000',
        wellType: 'OIL',
        status: 'drilling', // Valid enum value for AFE context
      })
      .returning();
    testWellId = well[0]!.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(wells).where(eq(wells.id, testWellId));
    await db.delete(leases).where(eq(leases.id, testLeaseId));
    await db.delete(users).where(eq(users.id, testUserId));
    await db.delete(organizations).where(eq(organizations.id, testOrgId));
  });

  describe('Schema Coverage', () => {
    it('should have all required fields defined', () => {
      const table = schema.afes;
      expect(table.id).toBeDefined();
      expect(table.organizationId).toBeDefined();
      expect(table.wellId).toBeDefined();
      expect(table.leaseId).toBeDefined();
      expect(table.afeNumber).toBeDefined();
      expect(table.afeType).toBeDefined();
      expect(table.description).toBeDefined();
      expect(table.totalEstimatedCost).toBeDefined(); // Correct field name
      expect(table.approvedAmount).toBeDefined();
      expect(table.actualCost).toBeDefined();
      expect(table.status).toBeDefined();
      expect(table.effectiveDate).toBeDefined();
      expect(table.approvalDate).toBeDefined();
      expect(table.createdAt).toBeDefined();
      expect(table.updatedAt).toBeDefined();
    });

    it('should access table indexes and constraints', () => {
      const table = schema.afes;
      expect(table).toBeDefined();
      expect(typeof table).toBe('object');

      // Verify primary key
      expect(table.id.primary).toBe(true);

      // Verify required fields
      expect(table.afeNumber.notNull).toBe(true);
      expect(table.afeType.notNull).toBe(true);
      expect(table.organizationId.notNull).toBe(true);
      expect(table.status.notNull).toBe(true);
      // Note: description is nullable in the schema
    });
  });

  describe('Business Logic', () => {
    beforeEach(async () => {
      // Clean up test data
      await db.delete(afes).where(eq(afes.organizationId, testOrgId));
    });

    afterEach(async () => {
      // Clean up test data
      await db.delete(afes).where(eq(afes.organizationId, testOrgId));
    });

    it('should create a new AFE with valid data', async () => {
      const newAfe = {
        organizationId: testOrgId,
        wellId: testWellId,
        afeNumber: 'AFE-2024-001',
        afeType: 'drilling' as const,
        description: 'Drill new horizontal oil well',
        totalEstimatedCost: '2500000.00', // Correct field name
        status: 'draft' as const,
      };

      const result = await db.insert(afes).values(newAfe).returning();

      expect(result).toHaveLength(1);
      expect(result[0]!.afeNumber).toBe(newAfe.afeNumber);
      expect(result[0]!.afeType).toBe(newAfe.afeType);
      expect(result[0]!.description).toBe(newAfe.description);
      expect(parseFloat(result[0]!.totalEstimatedCost || '0')).toBe(
        parseFloat(newAfe.totalEstimatedCost),
      );
      expect(result[0]!.status).toBe(newAfe.status);
      expect(result[0]!.id).toBeDefined();
      expect(result[0]!.createdAt).toBeDefined();
      expect(result[0]!.updatedAt).toBeDefined();
    });

    it('should enforce required fields', async () => {
      const invalidAfe = {
        organizationId: testOrgId,
        wellId: testWellId,
        // Missing required afeNumber
        afeType: 'drilling' as const,
        description: 'Test AFE',
        totalEstimatedCost: '1000000.00',
        status: 'draft' as const,
      };

      await expect(db.insert(afes).values(invalidAfe as any)).rejects.toThrow();
    });

    it('should accept valid AFE type values', async () => {
      const validTypes = ['drilling', 'completion', 'workover', 'facility'];

      for (const afeType of validTypes) {
        const afe = {
          organizationId: testOrgId,
          wellId: testWellId,
          afeNumber: `AFE-TYPE-${afeType.toUpperCase()}`,
          afeType: afeType as
            | 'drilling'
            | 'completion'
            | 'workover'
            | 'facility',
          description: `Test AFE for ${afeType}`,
          totalEstimatedCost: '1000000.00',
          status: 'draft' as const,
        };

        const result = await db
          .insert(afes)
          .values(afe as any)
          .returning();
        expect(result[0]!.afeType).toBe(afeType);
      }
    });

    it('should accept valid AFE status values', async () => {
      const validStatuses = [
        'draft',
        'submitted',
        'approved',
        'rejected',
        'closed',
      ];

      for (const status of validStatuses) {
        const afe = {
          organizationId: testOrgId,
          wellId: testWellId,
          afeNumber: `AFE-STATUS-${status.toUpperCase()}`,
          afeType: 'drilling' as const,
          description: `Test AFE with ${status} status`,
          totalEstimatedCost: '1000000.00',
          status,
        };

        const result = await db
          .insert(afes)
          .values(afe as any)
          .returning();
        expect(result[0]!.status).toBe(status);
      }
    });

    it('should enforce unique AFE number constraint', async () => {
      const afeNumber = 'AFE-UNIQUE-001';

      const afe1 = {
        organizationId: testOrgId,
        wellId: testWellId,
        afeNumber,
        afeType: 'drilling' as const,
        description: 'First AFE',
        totalEstimatedCost: '1000000.00',
        status: 'draft' as const,
      };

      const afe2 = {
        organizationId: testOrgId,
        wellId: testWellId,
        afeNumber, // Same AFE number
        afeType: 'completion' as const,
        description: 'Second AFE',
        totalEstimatedCost: '500000.00',
        status: 'draft' as const,
      };

      // First insert should succeed
      await db.insert(afes).values(afe1);

      // Second insert with same AFE number should fail
      await expect(db.insert(afes).values(afe2)).rejects.toThrow();
    });

    it('should track AFE approval workflow', async () => {
      // Create draft AFE
      const draftAfe = {
        organizationId: testOrgId,
        wellId: testWellId,
        afeNumber: 'AFE-WORKFLOW-001',
        afeType: 'drilling' as const,
        description: 'Workflow test AFE',
        totalEstimatedCost: '1500000.00',
        status: 'draft' as const,
      };

      const created = await db.insert(afes).values(draftAfe).returning();
      const afeId = created[0]!.id;

      // Submit for approval
      await db
        .update(afes)
        .set({ status: 'submitted' as const })
        .where(eq(afes.id, afeId));

      // Approve AFE
      const approvalDate = new Date('2024-01-15');
      const approved = await db
        .update(afes)
        .set({
          status: 'approved' as const,
          approvalDate: approvalDate.toISOString(),
        })
        .where(eq(afes.id, afeId))
        .returning();

      expect(approved[0]!.status).toBe('approved');
      expect(approved[0]!.approvalDate).toBeDefined();
    });

    it('should track actual costs vs estimated costs', async () => {
      const afe = {
        organizationId: testOrgId,
        wellId: testWellId,
        afeNumber: 'AFE-COST-001',
        afeType: 'drilling' as const,
        description: 'Cost tracking AFE',
        totalEstimatedCost: '2000000.00',
        status: 'approved' as const,
        approvalDate: '2024-01-15',
        effectiveDate: '2024-02-01',
      };

      const created = await db.insert(afes).values(afe).returning();
      const afeId = created[0]!.id;

      // Update with actual costs
      const actualCost = '2150000.00'; // Over budget as string for decimal type

      const updated = await db
        .update(afes)
        .set({
          actualCost: actualCost,
          status: 'closed' as const, // Use valid status from schema
        })
        .where(eq(afes.id, afeId))
        .returning();

      expect(parseFloat(updated[0]!.actualCost || '0')).toBe(
        parseFloat(actualCost),
      );
      expect(updated[0]!.status).toBe('closed');

      // Calculate variance (PostgreSQL returns decimals as strings)
      const actualCostNum = parseFloat(updated[0]!.actualCost || '0');
      const estimatedCostNum = parseFloat(
        updated[0]!.totalEstimatedCost || '0',
      );
      const variance = actualCostNum - estimatedCostNum;
      expect(variance).toBe(150000.0); // 7.5% over budget
    });

    it('should handle AFE cancellation', async () => {
      const afe = {
        organizationId: testOrgId,
        wellId: testWellId,
        afeNumber: 'AFE-CANCEL-001',
        afeType: 'drilling' as const,
        description: 'AFE to be cancelled',
        totalEstimatedCost: '1000000.00',
        status: 'draft' as const,
      };

      const created = await db.insert(afes).values(afe).returning();
      const afeId = created[0]!.id;

      // Cancel AFE (using 'rejected' as closest valid status)
      const cancelled = await db
        .update(afes)
        .set({ status: 'rejected' })
        .where(eq(afes.id, afeId))
        .returning();

      expect(cancelled[0]!.status).toBe('rejected');
    });
  });

  describe('Query Operations', () => {
    beforeEach(async () => {
      await db.delete(afes).where(eq(afes.organizationId, testOrgId));

      // Insert test data
      await db.insert(afes).values([
        {
          organizationId: testOrgId,
          wellId: testWellId,
          afeNumber: 'AFE-QUERY-001',
          afeType: 'drilling' as const,
          description: 'Drilling AFE',
          totalEstimatedCost: '2000000.00',
          status: 'approved' as const,
        },
        {
          organizationId: testOrgId,
          wellId: testWellId,
          afeNumber: 'AFE-QUERY-002',
          afeType: 'completion' as const,
          description: 'Completion AFE',
          totalEstimatedCost: '800000.00',
          status: 'submitted' as const, // Use valid status
        },
        {
          organizationId: testOrgId,
          wellId: testWellId,
          afeNumber: 'AFE-QUERY-003',
          afeType: 'workover' as const,
          description: 'Workover AFE',
          totalEstimatedCost: '300000.00',
          status: 'closed' as const, // Use valid status
          actualCost: '285000.00',
        },
      ]);
    });

    afterEach(async () => {
      await db.delete(afes).where(eq(afes.organizationId, testOrgId));
    });

    it('should find AFEs by status', async () => {
      const approvedAfes = await db
        .select()
        .from(afes)
        .where(eq(afes.status, 'approved'));

      expect(approvedAfes.length).toBeGreaterThanOrEqual(1);
      expect(approvedAfes.every((afe) => afe.status === 'approved')).toBe(true);
    });

    it('should find AFEs by type', async () => {
      const drillingAfes = await db
        .select()
        .from(afes)
        .where(eq(afes.afeType, 'drilling'));

      expect(drillingAfes.length).toBeGreaterThanOrEqual(1);
      expect(drillingAfes.every((afe) => afe.afeType === 'drilling')).toBe(
        true,
      );
    });

    it('should find AFEs by well', async () => {
      const wellAfes = await db
        .select()
        .from(afes)
        .where(eq(afes.wellId, testWellId));

      expect(wellAfes.length).toBeGreaterThanOrEqual(3);
      expect(wellAfes.every((afe) => afe.wellId === testWellId)).toBe(true);
    });

    it('should calculate total estimated costs', async () => {
      const allAfes = await db
        .select()
        .from(afes)
        .where(eq(afes.organizationId, testOrgId));

      const totalEstimated = allAfes.reduce(
        (sum, afe) => sum + parseFloat(afe.totalEstimatedCost || '0'),
        0,
      );
      expect(totalEstimated).toBe(3100000.0); // Sum of all estimated costs
    });
  });
});
