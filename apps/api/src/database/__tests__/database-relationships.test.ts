/**
 * Database Relationships Tests
 *
 * Tests for foreign key relationships, joins, and data integrity
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, desc } from 'drizzle-orm';
import * as schema from '../schema';

describe('Database Relationships Tests', () => {
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
    // Clean up test data in dependency order
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

  describe('Organization Relationships', () => {
    test('should establish one-to-many relationship with users', async () => {
      const [org] = await db
        .insert(schema.organizations)
        .values({ name: 'Test Oil Company' })
        .returning();

      const users = [
        {
          organizationId: org.id,
          email: 'owner@test.com',
          firstName: 'John',
          lastName: 'Owner',
          role: 'owner' as const,
          passwordHash: '$2b$10$test.hash',
          isActive: true,
        },
        {
          organizationId: org.id,
          email: 'manager@test.com',
          firstName: 'Jane',
          lastName: 'Manager',
          role: 'manager' as const,
          passwordHash: '$2b$10$test.hash',
          isActive: true,
        },
      ];

      await db.insert(schema.users).values(users);

      // Query with relationship
      const orgWithUsers = await db.query.organizations.findFirst({
        where: eq(schema.organizations.id, org.id),
        with: {
          users: true,
        },
      });

      expect(orgWithUsers).toBeDefined();
      expect(orgWithUsers!.users).toHaveLength(2);
      expect(orgWithUsers!.users[0].role).toBe('owner');
      expect(orgWithUsers!.users[1].role).toBe('manager');
    });

    test('should establish one-to-many relationship with wells', async () => {
      const [org] = await db
        .insert(schema.organizations)
        .values({ name: 'Test Oil Company' })
        .returning();

      const wells = [
        {
          organizationId: org.id,
          apiNumber: '42-123-11111-00',
          name: 'Well #1',
          status: 'active' as const,
          wellType: 'oil' as const,
        },
        {
          organizationId: org.id,
          apiNumber: '42-123-22222-00',
          name: 'Well #2',
          status: 'active' as const,
          wellType: 'gas' as const,
        },
      ];

      await db.insert(schema.wells).values(wells);

      // Query with relationship
      const orgWithWells = await db.query.organizations.findFirst({
        where: eq(schema.organizations.id, org.id),
        with: {
          wells: true,
        },
      });

      expect(orgWithWells).toBeDefined();
      expect(orgWithWells!.wells).toHaveLength(2);
      expect(orgWithWells!.wells[0].wellType).toBe('oil');
      expect(orgWithWells!.wells[1].wellType).toBe('gas');
    });
  });

  describe('Well Relationships', () => {
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
          apiNumber: '42-123-33333-00',
          name: 'Relationship Test Well',
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

    test('should establish one-to-many relationship with production records', async () => {
      const productionRecords = [
        {
          wellId,
          createdByUserId: userId,
          productionDate: '2024-01-15',
          oilVolume: '45.50',
          gasVolume: '325.75',
          waterVolume: '12.25',
          oilPrice: '75.50',
          gasPrice: '3.25',
          isEstimated: false,
        },
        {
          wellId,
          createdByUserId: userId,
          productionDate: '2024-01-16',
          oilVolume: '48.25',
          gasVolume: '340.50',
          waterVolume: '15.75',
          oilPrice: '76.00',
          gasPrice: '3.30',
          isEstimated: false,
        },
      ];

      await db.insert(schema.productionRecords).values(productionRecords);

      // Query with relationship
      const wellWithProduction = await db.query.wells.findFirst({
        where: eq(schema.wells.id, wellId),
        with: {
          productionRecords: {
            orderBy: desc(schema.productionRecords.productionDate),
          },
        },
      });

      expect(wellWithProduction).toBeDefined();
      expect(wellWithProduction!.productionRecords).toHaveLength(2);
      expect(wellWithProduction!.productionRecords[0].productionDate).toBe(
        '2024-01-16',
      );
      expect(wellWithProduction!.productionRecords[1].productionDate).toBe(
        '2024-01-15',
      );
    });

    test('should establish one-to-many relationship with equipment', async () => {
      const equipment = [
        {
          wellId,
          equipmentType: 'pump' as const,
          manufacturer: 'Weatherford',
          model: 'Model-123',
          serialNumber: 'SN-001',
          installDate: '2024-01-01',
          isActive: true,
        },
        {
          wellId,
          equipmentType: 'separator' as const,
          manufacturer: 'Cameron',
          model: 'Sep-456',
          serialNumber: 'SN-002',
          installDate: '2024-01-01',
          isActive: true,
        },
      ];

      await db.insert(schema.equipment).values(equipment);

      // Query with relationship
      const wellWithEquipment = await db.query.wells.findFirst({
        where: eq(schema.wells.id, wellId),
        with: {
          equipment: true,
        },
      });

      expect(wellWithEquipment).toBeDefined();
      expect(wellWithEquipment!.equipment).toHaveLength(2);
      expect(wellWithEquipment!.equipment[0].equipmentType).toBe('pump');
      expect(wellWithEquipment!.equipment[1].equipmentType).toBe('separator');
    });

    test('should establish one-to-many relationship with well tests', async () => {
      const wellTests = [
        {
          wellId,
          testDate: '2024-01-15',
          testType: 'production' as const,
          oilRate: '45.5',
          gasRate: '325.75',
          waterRate: '12.25',
          testDuration: 24,
          chokeSize: '12/64',
          casingPressure: 250,
          tubingPressure: 180,
          notes: 'Standard production test',
        },
        {
          wellId,
          testDate: '2024-02-15',
          testType: 'pressure' as const,
          casingPressure: 275,
          tubingPressure: 195,
          testDuration: 4,
          notes: 'Pressure buildup test',
        },
      ];

      await db.insert(schema.wellTests).values(wellTests);

      // Query with relationship
      const wellWithTests = await db.query.wells.findFirst({
        where: eq(schema.wells.id, wellId),
        with: {
          wellTests: {
            orderBy: desc(schema.wellTests.testDate),
          },
        },
      });

      expect(wellWithTests).toBeDefined();
      expect(wellWithTests!.wellTests).toHaveLength(2);
      expect(wellWithTests!.wellTests[0].testType).toBe('pressure');
      expect(wellWithTests!.wellTests[1].testType).toBe('production');
    });
  });

  describe('Lease-Partner Relationships', () => {
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

      const partners = [
        {
          organizationId,
          name: 'Partner One LLC',
          partnerType: 'working_interest' as const,
          taxId: '12-3456789',
          isActive: true,
        },
        {
          organizationId,
          name: 'Partner Two Inc',
          partnerType: 'royalty_owner' as const,
          taxId: '98-7654321',
          isActive: true,
        },
      ];

      const createdPartners = await db
        .insert(schema.partners)
        .values(partners)
        .returning();

      partner1Id = createdPartners[0].id;
      partner2Id = createdPartners[1].id;
    });

    test('should establish many-to-many relationship through lease_partners', async () => {
      const leasePartners = [
        {
          leaseId,
          partnerId: partner1Id,
          workingInterestPercent: '75.00',
          royaltyInterestPercent: '12.50',
          effectiveDate: '2024-01-01',
          isActive: true,
        },
        {
          leaseId,
          partnerId: partner2Id,
          workingInterestPercent: '25.00',
          royaltyInterestPercent: '12.50',
          effectiveDate: '2024-01-01',
          isActive: true,
        },
      ];

      await db.insert(schema.leasePartners).values(leasePartners);

      // Query lease with partners
      const leaseWithPartners = await db.query.leases.findFirst({
        where: eq(schema.leases.id, leaseId),
        with: {
          leasePartners: {
            with: {
              partner: true,
            },
          },
        },
      });

      expect(leaseWithPartners).toBeDefined();
      expect(leaseWithPartners!.leasePartners).toHaveLength(2);
      expect(leaseWithPartners!.leasePartners[0].partner.name).toBe(
        'Partner One LLC',
      );
      expect(leaseWithPartners!.leasePartners[1].partner.name).toBe(
        'Partner Two Inc',
      );
      expect(leaseWithPartners!.leasePartners[0].workingInterestPercent).toBe(
        '75.00',
      );
      expect(leaseWithPartners!.leasePartners[1].workingInterestPercent).toBe(
        '25.00',
      );
    });

    test('should query partners with their leases', async () => {
      await db.insert(schema.leasePartners).values({
        leaseId,
        partnerId: partner1Id,
        workingInterestPercent: '100.00',
        royaltyInterestPercent: '12.50',
        effectiveDate: '2024-01-01',
        isActive: true,
      });

      // Query partner with leases
      const partnerWithLeases = await db.query.partners.findFirst({
        where: eq(schema.partners.id, partner1Id),
        with: {
          leasePartners: {
            with: {
              lease: true,
            },
          },
        },
      });

      expect(partnerWithLeases).toBeDefined();
      expect(partnerWithLeases!.leasePartners).toHaveLength(1);
      expect(partnerWithLeases!.leasePartners[0].lease.name).toBe('Test Lease');
      expect(partnerWithLeases!.leasePartners[0].workingInterestPercent).toBe(
        '100.00',
      );
    });
  });

  describe('Complex Multi-Table Relationships', () => {
    test('should query organization with all related data', async () => {
      // Create organization
      const [org] = await db
        .insert(schema.organizations)
        .values({ name: 'Complex Test Company' })
        .returning();

      // Create user
      const [user] = await db
        .insert(schema.users)
        .values({
          organizationId: org.id,
          email: 'admin@complex.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'owner' as const,
          passwordHash: '$2b$10$test.hash',
          isActive: true,
        })
        .returning();

      // Create lease
      const [lease] = await db
        .insert(schema.leases)
        .values({
          organizationId: org.id,
          name: 'Complex Lease',
          county: 'Harris',
          state: 'TX',
          acreage: '320.00',
          leaseType: 'oil_gas' as const,
          effectiveDate: '2024-01-01',
        })
        .returning();

      // Create well
      const [well] = await db
        .insert(schema.wells)
        .values({
          organizationId: org.id,
          leaseId: lease.id,
          apiNumber: '42-123-99999-00',
          name: 'Complex Well',
          status: 'active' as const,
          wellType: 'oil' as const,
        })
        .returning();

      // Create production record
      await db.insert(schema.productionRecords).values({
        wellId: well.id,
        createdByUserId: user.id,
        productionDate: '2024-01-15',
        oilVolume: '100.00',
        gasVolume: '500.00',
        waterVolume: '25.00',
        oilPrice: '80.00',
        gasPrice: '4.00',
        isEstimated: false,
      });

      // Query with deep relationships
      const complexQuery = await db.query.organizations.findFirst({
        where: eq(schema.organizations.id, org.id),
        with: {
          users: true,
          leases: {
            with: {
              wells: {
                with: {
                  productionRecords: {
                    with: {
                      createdByUser: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      expect(complexQuery).toBeDefined();
      expect(complexQuery!.users).toHaveLength(1);
      expect(complexQuery!.leases).toHaveLength(1);
      expect(complexQuery!.leases[0].wells).toHaveLength(1);
      expect(complexQuery!.leases[0].wells[0].productionRecords).toHaveLength(
        1,
      );
      expect(
        complexQuery!.leases[0].wells[0].productionRecords[0].createdByUser
          .email,
      ).toBe('admin@complex.com');
    });
  });

  describe('Foreign Key Constraint Enforcement', () => {
    test('should prevent deletion of referenced organization', async () => {
      const [org] = await db
        .insert(schema.organizations)
        .values({ name: 'Referenced Org' })
        .returning();

      await db.insert(schema.users).values({
        organizationId: org.id,
        email: 'user@referenced.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'owner' as const,
        passwordHash: '$2b$10$test.hash',
        isActive: true,
      });

      // Attempt to delete organization with dependent users
      await expect(
        db
          .delete(schema.organizations)
          .where(eq(schema.organizations.id, org.id)),
      ).rejects.toThrow();
    });

    test('should prevent insertion with invalid foreign key', async () => {
      const fakeOrgId = '00000000-0000-0000-0000-000000000000';

      // Attempt to create user with non-existent organization
      await expect(
        db.insert(schema.users).values({
          organizationId: fakeOrgId,
          email: 'orphan@test.com',
          firstName: 'Orphan',
          lastName: 'User',
          role: 'owner' as const,
          passwordHash: '$2b$10$test.hash',
          isActive: true,
        }),
      ).rejects.toThrow();
    });
  });
});
