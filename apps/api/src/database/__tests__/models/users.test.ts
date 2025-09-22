/**
 * Users Model Tests
 * Tests for user schema, business logic, and validation
 */

import * as schema from '../../schema';
import { users, organizations } from '../../schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Use test database connection
const pool = new Pool({
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5433'),
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'password',
  database: process.env.TEST_DB_NAME || 'wellflow_test',
});
const db = drizzle(pool, { schema });

describe('Users Model', () => {
  let testOrgId: string;

  beforeAll(async () => {
    // Create a test organization for user tests
    const org = await db
      .insert(organizations)
      .values({
        name: 'Test Organization',
        taxId: '99-9999999',
      })
      .returning();
    testOrgId = org[0].id;
  });

  afterAll(async () => {
    // Clean up test organization
    await db.delete(organizations).where(eq(organizations.id, testOrgId));
  });

  describe('Schema Coverage', () => {
    it('should have all required fields defined', () => {
      const table = schema.users;
      expect(table.id).toBeDefined();
      expect(table.organizationId).toBeDefined();
      expect(table.email).toBeDefined();
      expect(table.firstName).toBeDefined();
      expect(table.lastName).toBeDefined();
      expect(table.role).toBeDefined();
      expect(table.isActive).toBeDefined();
      expect(table.lastLoginAt).toBeDefined();
      expect(table.createdAt).toBeDefined();
      expect(table.updatedAt).toBeDefined();
    });

    it('should access table indexes and constraints', () => {
      const table = schema.users;
      expect(table).toBeDefined();
      expect(typeof table).toBe('object');

      // Verify primary key
      expect(table.id.primary).toBe(true);

      // Verify required fields
      expect(table.email.notNull).toBe(true);
      expect(table.firstName.notNull).toBe(true);
      expect(table.lastName.notNull).toBe(true);
      expect(table.role.notNull).toBe(true);
    });
  });

  describe('Business Logic', () => {
    beforeEach(async () => {
      // Clean up test data
      await db.delete(users).where(eq(users.organizationId, testOrgId));
    });

    afterEach(async () => {
      // Clean up test data
      await db.delete(users).where(eq(users.organizationId, testOrgId));
    });

    it('should create a new user with valid data', async () => {
      const newUser = {
        organizationId: testOrgId,
        email: 'john.doe@testoil.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'pumper',
      };

      const result = await db.insert(users).values(newUser).returning();

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe(newUser.email);
      expect(result[0].firstName).toBe(newUser.firstName);
      expect(result[0].lastName).toBe(newUser.lastName);
      expect(result[0].role).toBe(newUser.role);
      expect(result[0].isActive).toBe(true); // Default value
      expect(result[0].id).toBeDefined();
      expect(result[0].createdAt).toBeDefined();
      expect(result[0].updatedAt).toBeDefined();
    });

    it('should enforce required fields', async () => {
      const invalidUser = {
        organizationId: testOrgId,
        // Missing required email
        firstName: 'John',
        lastName: 'Doe',
        role: 'pumper',
      };

      await expect(
        db.insert(users).values(invalidUser as any),
      ).rejects.toThrow();
    });

    it('should validate user role enum', async () => {
      const invalidUser = {
        organizationId: testOrgId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'invalid_role', // Invalid enum value
      };

      await expect(
        db.insert(users).values(invalidUser as any),
      ).rejects.toThrow();
    });

    it('should enforce unique email constraint', async () => {
      const email = 'duplicate@testoil.com';

      const user1 = {
        organizationId: testOrgId,
        email,
        firstName: 'John',
        lastName: 'Doe',
        role: 'pumper',
      };

      const user2 = {
        organizationId: testOrgId,
        email, // Same email
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'manager',
      };

      // First insert should succeed
      await db.insert(users).values(user1);

      // Second insert with same email should fail
      await expect(db.insert(users).values(user2)).rejects.toThrow();
    });

    it('should update user data', async () => {
      // First create a user
      const newUser = {
        organizationId: testOrgId,
        email: 'update.test@testoil.com',
        firstName: 'Original',
        lastName: 'Name',
        role: 'pumper',
      };

      const created = await db.insert(users).values(newUser).returning();
      const userId = created[0].id;

      // Update the user
      const updatedData = {
        firstName: 'Updated',
        lastName: 'Name',
        role: 'manager',
        isActive: false,
      };

      const updated = await db
        .update(users)
        .set(updatedData)
        .where(eq(users.id, userId))
        .returning();

      expect(updated).toHaveLength(1);
      expect(updated[0].firstName).toBe(updatedData.firstName);
      expect(updated[0].role).toBe(updatedData.role);
      expect(updated[0].isActive).toBe(updatedData.isActive);
      expect(updated[0].updatedAt).not.toBe(created[0].updatedAt);
    });

    it('should track last login timestamp', async () => {
      const newUser = {
        organizationId: testOrgId,
        email: 'login.test@testoil.com',
        firstName: 'Login',
        lastName: 'Test',
        role: 'pumper',
      };

      const created = await db.insert(users).values(newUser).returning();
      const userId = created[0].id;

      // Simulate login
      const loginTime = new Date();
      await db
        .update(users)
        .set({ lastLoginAt: loginTime })
        .where(eq(users.id, userId));

      const updated = await db.select().from(users).where(eq(users.id, userId));

      expect(updated[0].lastLoginAt).toBeDefined();
      expect(new Date(updated[0].lastLoginAt!).getTime()).toBeCloseTo(
        loginTime.getTime(),
        -3,
      );
    });

    it('should deactivate user instead of deleting', async () => {
      const newUser = {
        organizationId: testOrgId,
        email: 'deactivate.test@testoil.com',
        firstName: 'Deactivate',
        lastName: 'Test',
        role: 'pumper',
      };

      const created = await db.insert(users).values(newUser).returning();
      const userId = created[0].id;

      // Deactivate user
      await db
        .update(users)
        .set({ isActive: false })
        .where(eq(users.id, userId));

      const deactivated = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      expect(deactivated).toHaveLength(1);
      expect(deactivated[0].isActive).toBe(false);
    });
  });

  describe('Query Operations', () => {
    beforeEach(async () => {
      await db.delete(users).where(eq(users.organizationId, testOrgId));

      // Insert test data
      await db.insert(users).values([
        {
          organizationId: testOrgId,
          email: 'owner@testoil.com',
          firstName: 'Owner',
          lastName: 'User',
          role: 'owner',
          isActive: true,
        },
        {
          organizationId: testOrgId,
          email: 'pumper1@testoil.com',
          firstName: 'Pumper',
          lastName: 'One',
          role: 'pumper',
          isActive: true,
        },
        {
          organizationId: testOrgId,
          email: 'pumper2@testoil.com',
          firstName: 'Pumper',
          lastName: 'Two',
          role: 'pumper',
          isActive: false,
        },
      ]);
    });

    afterEach(async () => {
      await db.delete(users).where(eq(users.organizationId, testOrgId));
    });

    it('should find active users only', async () => {
      const activeUsers = await db
        .select()
        .from(users)
        .where(eq(users.isActive, true));

      expect(activeUsers.length).toBeGreaterThanOrEqual(2);
      expect(activeUsers.every((user) => user.isActive === true)).toBe(true);
    });

    it('should find users by role', async () => {
      const pumpers = await db
        .select()
        .from(users)
        .where(eq(users.role, 'pumper'));

      expect(pumpers.length).toBeGreaterThanOrEqual(2);
      expect(pumpers.every((user) => user.role === 'pumper')).toBe(true);
    });

    it('should find users by organization', async () => {
      const orgUsers = await db
        .select()
        .from(users)
        .where(eq(users.organizationId, testOrgId));

      expect(orgUsers.length).toBeGreaterThanOrEqual(3);
      expect(orgUsers.every((user) => user.organizationId === testOrgId)).toBe(
        true,
      );
    });
  });
});
