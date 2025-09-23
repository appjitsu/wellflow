import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from '../database.service';
import * as schema from '../schema';
import { eq } from 'drizzle-orm';

describe('Row Level Security Policies', () => {
  let module: TestingModule;
  let databaseService: DatabaseService;
  let db: ReturnType<typeof databaseService.getDb>;

  // Test organization IDs
  const org1Id = '11111111-1111-1111-1111-111111111111';
  const org2Id = '22222222-2222-2222-2222-222222222222';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      providers: [DatabaseService],
    }).compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
    await databaseService.onModuleInit();
    db = databaseService.getDb();
  });

  afterAll(async () => {
    // Clear any organization context before closing
    try {
      await databaseService.clearOrganizationContext();
    } catch (error) {
      // Ignore errors during cleanup
    }

    await databaseService.onModuleDestroy();
    await module.close();
  });

  beforeEach(async () => {
    // Clear any existing organization context first
    try {
      await databaseService.clearOrganizationContext();
    } catch (error) {
      // Ignore errors during cleanup
    }

    // Clean up test data before each test (without RLS context)
    await db.delete(schema.wells);
    await db.delete(schema.users);
    await db.delete(schema.organizations);
  });

  describe('Organization Table RLS', () => {
    it('should only allow access to own organization', async () => {
      // Create test organizations
      await db.insert(schema.organizations).values([
        { id: org1Id, name: 'Oil Company 1' },
        { id: org2Id, name: 'Oil Company 2' },
      ]);

      // Set context for org1
      await databaseService.setOrganizationContext(org1Id);

      // Should only see org1
      const orgs = await db.select().from(schema.organizations);
      expect(orgs).toHaveLength(1);
      expect(orgs[0].id).toBe(org1Id);
      expect(orgs[0].name).toBe('Oil Company 1');

      // Switch to org2 context
      await databaseService.setOrganizationContext(org2Id);

      // Should only see org2
      const orgs2 = await db.select().from(schema.organizations);
      expect(orgs2).toHaveLength(1);
      expect(orgs2[0].id).toBe(org2Id);
      expect(orgs2[0].name).toBe('Oil Company 2');
    });
  });

  describe('Users Table RLS', () => {
    it('should isolate users by organization', async () => {
      // Create test organizations
      await db.insert(schema.organizations).values([
        { id: org1Id, name: 'Oil Company 1' },
        { id: org2Id, name: 'Oil Company 2' },
      ]);

      // Create users for both organizations (without RLS context)
      await databaseService.clearOrganizationContext();
      await db.insert(schema.users).values([
        {
          organizationId: org1Id,
          email: 'user1@org1.com',
          firstName: 'User',
          lastName: 'One',
          role: 'owner',
        },
        {
          organizationId: org2Id,
          email: 'user2@org2.com',
          firstName: 'User',
          lastName: 'Two',
          role: 'manager',
        },
      ]);

      // Set context for org1
      await databaseService.setOrganizationContext(org1Id);
      const org1Users = await db.select().from(schema.users);
      expect(org1Users).toHaveLength(1);
      expect(org1Users[0].email).toBe('user1@org1.com');

      // Set context for org2
      await databaseService.setOrganizationContext(org2Id);
      const org2Users = await db.select().from(schema.users);
      expect(org2Users).toHaveLength(1);
      expect(org2Users[0].email).toBe('user2@org2.com');
    });
  });

  describe('Wells Table RLS', () => {
    it('should isolate wells by organization', async () => {
      // Create test organizations
      await db.insert(schema.organizations).values([
        { id: org1Id, name: 'Oil Company 1' },
        { id: org2Id, name: 'Oil Company 2' },
      ]);

      // Create wells for both organizations (without RLS context)
      await databaseService.clearOrganizationContext();
      await db.insert(schema.wells).values([
        {
          organizationId: org1Id,
          apiNumber: '12345678901234',
          wellName: 'Well 1',
          wellType: 'oil',
          status: 'active',
        },
        {
          organizationId: org2Id,
          apiNumber: '98765432109876',
          wellName: 'Well 2',
          wellType: 'gas',
          status: 'active',
        },
      ]);

      // Set context for org1
      await databaseService.setOrganizationContext(org1Id);
      const org1Wells = await db.select().from(schema.wells);
      expect(org1Wells).toHaveLength(1);
      expect(org1Wells[0].wellName).toBe('Well 1');
      expect(org1Wells[0].apiNumber).toBe('12345678901234');

      // Set context for org2
      await databaseService.setOrganizationContext(org2Id);
      const org2Wells = await db.select().from(schema.wells);
      expect(org2Wells).toHaveLength(1);
      expect(org2Wells[0].wellName).toBe('Well 2');
      expect(org2Wells[0].apiNumber).toBe('98765432109876');
    });

    it('should prevent cross-tenant well updates', async () => {
      // Create test organizations
      await db.insert(schema.organizations).values([
        { id: org1Id, name: 'Oil Company 1' },
        { id: org2Id, name: 'Oil Company 2' },
      ]);

      // Create a well for org1 (without RLS context)
      await databaseService.clearOrganizationContext();
      const [well] = await db
        .insert(schema.wells)
        .values({
          organizationId: org1Id,
          apiNumber: '12345678901234',
          wellName: 'Well 1',
          wellType: 'oil',
          status: 'active',
        })
        .returning();

      // Set context for org2
      await databaseService.setOrganizationContext(org2Id);

      // Try to update the well from org2 context - should not affect any rows
      const updateResult = await db
        .update(schema.wells)
        .set({ wellName: 'Hacked Well' })
        .where(eq(schema.wells.id, well.id));

      // The update should not affect any rows due to RLS
      expect(updateResult.rowCount).toBe(0);

      // Verify the well was not updated by switching to org1 context
      await databaseService.setOrganizationContext(org1Id);
      const [updatedWell] = await db
        .select()
        .from(schema.wells)
        .where(eq(schema.wells.id, well.id));

      expect(updatedWell.wellName).toBe('Well 1'); // Should remain unchanged
    });
  });

  describe('Database Context Management', () => {
    it('should set and get organization context', async () => {
      // Set context for org1
      await databaseService.setOrganizationContext(org1Id);

      // Verify database context is set
      const currentOrgId = await databaseService.getCurrentOrganizationId();
      expect(currentOrgId).toBe(org1Id);
    });

    it('should clear organization context', async () => {
      // Set context first
      await databaseService.setOrganizationContext(org1Id);

      // Clear context
      await databaseService.clearOrganizationContext();

      // Verify context is cleared (PostgreSQL returns null for unset config)
      const currentOrgId = await databaseService.getCurrentOrganizationId();
      expect(currentOrgId).toBeNull();
    });

    it('should execute operations within organization context', async () => {
      // Create test organizations
      await db.insert(schema.organizations).values([
        { id: org1Id, name: 'Oil Company 1' },
        { id: org2Id, name: 'Oil Company 2' },
      ]);

      let org1Count = 0;
      let org2Count = 0;

      // Run operations in different contexts
      await databaseService.withOrganizationContext(org1Id, async () => {
        const orgs = await db.select().from(schema.organizations);
        org1Count = orgs.length;
      });

      await databaseService.withOrganizationContext(org2Id, async () => {
        const orgs = await db.select().from(schema.organizations);
        org2Count = orgs.length;
      });

      // Each context should only see its own organization
      expect(org1Count).toBe(1);
      expect(org2Count).toBe(1);
    });
  });
});
