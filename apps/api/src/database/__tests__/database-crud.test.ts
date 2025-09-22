/**
 * Database CRUD Operations Tests
 *
 * Tests for Create, Read, Update, Delete operations on all database models
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from '../schema';
import { generateUniqueEmail, generateUniqueApiNumber } from './test-utils';

describe('Database CRUD Operations Tests', () => {
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

  // Helper function to generate unique email addresses
  const generateUniqueEmail = (): string => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `pumper${timestamp}${random}@test.com`;
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

  describe('Organizations CRUD', () => {
    test('should create and read organization', async () => {
      const orgData = {
        name: 'Test Oil Company',
        taxId: '12-3456789',
        address: {
          street: '123 Oil St',
          city: 'Houston',
          state: 'TX',
          zip: '77001',
        },
        phone: '555-0123',
        settings: { timezone: 'America/Chicago' },
      };

      const [created] = await db
        .insert(schema.organizations)
        .values(orgData)
        .returning();

      expect(created).toMatchObject({
        name: orgData.name,
        taxId: orgData.taxId,
        phone: orgData.phone,
      });
      expect(created.id).toBeDefined();
      expect(created.createdAt).toBeInstanceOf(Date);

      // Test read
      const found = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, created.id));

      expect(found).toHaveLength(1);
      expect(found[0]).toMatchObject(orgData);
    });

    test('should update organization', async () => {
      const [org] = await db
        .insert(schema.organizations)
        .values({ name: 'Original Name' })
        .returning();

      const updatedData = {
        name: 'Updated Oil Company',
        phone: '555-9999',
      };

      await db
        .update(schema.organizations)
        .set(updatedData)
        .where(eq(schema.organizations.id, org.id));

      const [updated] = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, org.id));

      expect(updated.name).toBe(updatedData.name);
      expect(updated.phone).toBe(updatedData.phone);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        updated.createdAt.getTime(),
      );
    });

    test('should delete organization', async () => {
      const [org] = await db
        .insert(schema.organizations)
        .values({ name: 'To Delete' })
        .returning();

      await db
        .delete(schema.organizations)
        .where(eq(schema.organizations.id, org.id));

      const found = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, org.id));

      expect(found).toHaveLength(0);
    });
  });

  describe('Users CRUD', () => {
    let organizationId: string;

    beforeEach(async () => {
      const [org] = await db
        .insert(schema.organizations)
        .values({ name: 'Test Org' })
        .returning();
      organizationId = org.id;
    });

    test('should create user with proper role validation', async () => {
      const userData = {
        organizationId,
        email: generateUniqueEmail('test'),
        firstName: 'John',
        lastName: 'Doe',
        role: 'owner' as const,
        passwordHash: '$2b$10$test.hash',
        isActive: true,
      };

      const [created] = await db
        .insert(schema.users)
        .values(userData)
        .returning();

      expect(created).toMatchObject({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        isActive: userData.isActive,
      });
      expect(created.organizationId).toBe(organizationId);
    });

    test('should enforce unique email constraint', async () => {
      const email = generateUniqueEmail('duplicate');
      const userData = {
        organizationId,
        email,
        firstName: 'John',
        lastName: 'Doe',
        role: 'manager' as const,
        passwordHash: '$2b$10$test.hash',
        isActive: true,
      };

      await db.insert(schema.users).values(userData);

      // Attempt to insert duplicate email
      await expect(
        db.insert(schema.users).values({
          ...userData,
          firstName: 'Jane',
        }),
      ).rejects.toThrow();
    });
  });

  describe('Wells CRUD', () => {
    let organizationId: string;

    beforeEach(async () => {
      const [org] = await db
        .insert(schema.organizations)
        .values({ name: 'Test Org' })
        .returning();
      organizationId = org.id;
    });

    test('should create well with API number validation', async () => {
      const wellData = {
        organizationId,
        apiNumber: generateUniqueApiNumber(),
        wellName: 'Test Well #1',
        wellType: 'oil' as const,
        status: 'active' as const,
        totalDepth: '8500',
        spudDate: '2024-01-15',
      };

      const [created] = await db
        .insert(schema.wells)
        .values(wellData)
        .returning();

      expect(created).toMatchObject({
        apiNumber: wellData.apiNumber,
        wellName: wellData.wellName,
        status: wellData.status,
        totalDepth: '8500.00', // Database returns decimal as string
      });
    });

    test('should enforce unique API number constraint', async () => {
      const apiNumber = generateUniqueApiNumber();

      await db.insert(schema.wells).values({
        organizationId,
        apiNumber,
        wellName: 'First Well',
        wellType: 'oil',
        status: 'active' as const,
      });

      // Attempt to insert duplicate API number
      await expect(
        db.insert(schema.wells).values({
          organizationId,
          apiNumber, // Same API number
          wellName: 'Second Well',
          wellType: 'oil',
          status: 'active' as const,
        }),
      ).rejects.toThrow();
    });
  });

  describe('Production Records CRUD', () => {
    let organizationId: string;
    let wellId: string;
    let userId: string;

    beforeEach(async () => {
      const [org] = await db
        .insert(schema.organizations)
        .values({ name: 'Test Org' })
        .returning();
      organizationId = org.id;

      const [well] = await db
        .insert(schema.wells)
        .values({
          organizationId,
          apiNumber: generateUniqueApiNumber(),
          wellName: 'Production Test Well',
          wellType: 'oil',
          status: 'active' as const,
        })
        .returning();
      wellId = well.id;

      const [user] = await db
        .insert(schema.users)
        .values({
          organizationId,
          email: generateUniqueEmail(),
          firstName: 'Test',
          lastName: 'Pumper',
          role: 'pumper' as const,
          isActive: true,
        })
        .returning();
      userId = user.id;
    });

    test('should create production record with volume validation', async () => {
      const productionData = {
        organizationId,
        wellId,
        productionDate: '2024-01-15',
        oilVolume: '45.50',
        gasVolume: '325.75',
        waterVolume: '12.25',
        oilPrice: '75.50',
        gasPrice: '3.25',
      };

      const [created] = await db
        .insert(schema.productionRecords)
        .values(productionData)
        .returning();

      expect(created).toMatchObject({
        wellId,
        productionDate: productionData.productionDate,
        oilVolume: '45.50',
        gasVolume: '325.75',
        waterVolume: '12.25',
      });
    });

    test('should query production records by date range', async () => {
      // Insert multiple production records
      const records = [
        {
          organizationId,
          wellId,
          productionDate: '2024-01-15',
          oilVolume: '45.50',
          gasVolume: '325.75',
          waterVolume: '12.25',
          oilPrice: '75.50',
          gasPrice: '3.25',
        },
        {
          organizationId,
          wellId,
          productionDate: '2024-01-16',
          oilVolume: '48.25',
          gasVolume: '340.50',
          waterVolume: '15.75',
          oilPrice: '76.00',
          gasPrice: '3.30',
        },
      ];

      await db.insert(schema.productionRecords).values(records);

      const found = await db
        .select()
        .from(schema.productionRecords)
        .where(eq(schema.productionRecords.wellId, wellId))
        .orderBy(schema.productionRecords.productionDate);

      expect(found).toHaveLength(2);
      expect(found[0].productionDate).toBe('2024-01-15');
      expect(found[1].productionDate).toBe('2024-01-16');
    });
  });

  describe('Multi-tenant Data Isolation', () => {
    test('should isolate data by organization', async () => {
      // Create two organizations
      const [org1] = await db
        .insert(schema.organizations)
        .values({ name: 'Oil Company 1' })
        .returning();

      const [org2] = await db
        .insert(schema.organizations)
        .values({ name: 'Oil Company 2' })
        .returning();

      // Create wells for each organization
      await db.insert(schema.wells).values([
        {
          organizationId: org1.id,
          apiNumber: generateUniqueApiNumber(),
          wellName: 'Org1 Well',
          wellType: 'oil',
          status: 'active' as const,
        },
        {
          organizationId: org2.id,
          apiNumber: generateUniqueApiNumber(),
          wellName: 'Org2 Well',
          wellType: 'oil',
          status: 'active' as const,
        },
      ]);

      // Query wells for org1 only
      const org1Wells = await db
        .select()
        .from(schema.wells)
        .where(eq(schema.wells.organizationId, org1.id));

      expect(org1Wells).toHaveLength(1);
      expect(org1Wells[0].wellName).toBe('Org1 Well');

      // Query wells for org2 only
      const org2Wells = await db
        .select()
        .from(schema.wells)
        .where(eq(schema.wells.organizationId, org2.id));

      expect(org2Wells).toHaveLength(1);
      expect(org2Wells[0].wellName).toBe('Org2 Well');
    });
  });
});
