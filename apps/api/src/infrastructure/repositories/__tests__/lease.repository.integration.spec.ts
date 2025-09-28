import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../../database/database.module';
import { DatabaseService } from '../../../database/database.service';
import { LeaseRepository } from '../lease.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { organizations } from '../../../database/schemas/organizations';
import { eq } from 'drizzle-orm';

/**
 * Lease Repository Integration Tests
 *
 * Tests the LeaseRepository implementation with real database operations
 * using transaction isolation for test data cleanup.
 */
describe('LeaseRepository Integration', () => {
  let repository: LeaseRepository;
  let databaseService: DatabaseService;
  let db: any;

  // Test data constants
  const TEST_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';

  beforeAll(async () => {
    // Create test module with real database service
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        DatabaseModule,
      ],
      providers: [
        {
          provide: 'LeaseRepository',
          useFactory: (databaseService: DatabaseService) => {
            return new LeaseRepository(databaseService);
          },
          inject: [DatabaseService],
        },
      ],
    }).compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
    repository = module.get<LeaseRepository>('LeaseRepository');

    // Initialize the database
    await databaseService.onModuleInit();
    db = databaseService.getDb();

    // Clean up any existing test data more thoroughly
    try {
      // First clean up leases that might reference the organization
      await db
        .delete(require('../../../database/schema').leases)
        .where(
          require('drizzle-orm').eq(
            require('../../../database/schema').leases.organizationId,
            TEST_ORG_ID,
          ),
        );
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Cleanup error (ignored):', error);
    }

    try {
      await db.delete(organizations).where(eq(organizations.id, TEST_ORG_ID));
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Cleanup error (ignored):', error);
    }

    // Create test organization with upsert-like behavior
    try {
      await db.insert(organizations).values({
        id: TEST_ORG_ID,
        name: 'Test Organization LLC',
        taxId: '12-3456789',
      });
    } catch (error) {
      // If organization already exists, that's fine - we'll use it
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        !errorMessage.includes('duplicate key') &&
        !errorMessage.includes('unique constraint')
      ) {
        throw error;
      }
      // Organization already exists, continue with the test
    }
  });

  beforeEach(async () => {
    // Clean up test data before each test
    try {
      await db
        .delete(require('../../../database/schema').leases)
        .where(
          require('drizzle-orm').eq(
            require('../../../database/schema').leases.organizationId,
            TEST_ORG_ID,
          ),
        );
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Cleanup error (ignored):', error);
    }
  });

  afterAll(async () => {
    // Clean up any remaining test data
    try {
      await db
        .delete(require('../../../database/schema').leases)
        .where(
          require('drizzle-orm').eq(
            require('../../../database/schema').leases.organizationId,
            TEST_ORG_ID,
          ),
        );
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Cleanup error (ignored):', error);
    }

    // Clean up test organization
    try {
      await db.delete(organizations).where(eq(organizations.id, TEST_ORG_ID));
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Cleanup error (ignored):', error);
    }
  });

  describe('create', () => {
    it('should create a new lease', async () => {
      // Given - Create lease data
      const leaseData = {
        name: 'Test Lease #1',
        leaseNumber: 'TL-001',
        lessor: 'Test Lessor LLC',
        lessee: 'Test Lessee Corp',
        acreage: '640.5',
        royaltyRate: '0.1875',
        effectiveDate: '2024-01-01',
        expirationDate: '2029-01-01',
        legalDescription: 'Section 12, Township 1N, Range 2W',
        organizationId: TEST_ORG_ID,
      };

      // When - Create the lease
      const result = await repository.create(leaseData);

      // Then - Verify lease was created
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Lease #1');
      expect(result.leaseNumber).toBe('TL-001');
      expect(result.organizationId).toBe(TEST_ORG_ID);
      expect(result.status).toBe('active');
    });
  });

  describe('findById', () => {
    it('should find lease by ID', async () => {
      // Given - Create and save a lease
      const leaseData = {
        name: 'Test Lease #2',
        leaseNumber: 'TL-002',
        lessor: 'Test Lessor LLC',
        lessee: 'Test Lessee Corp',
        organizationId: TEST_ORG_ID,
      };

      const created = await repository.create(leaseData);

      // When - Find by ID
      const found = await repository.findById(created.id);

      // Then - Verify lease found
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Test Lease #2');
    });

    it('should return null for non-existent lease', async () => {
      const found = await repository.findById(
        '550e8400-e29b-41d4-a716-446655440999',
      );
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all leases for organization', async () => {
      // Given - Create multiple leases
      await repository.create({
        name: 'Lease A',
        lessor: 'Lessor A',
        lessee: 'Lessee A',
        organizationId: TEST_ORG_ID,
      });

      await repository.create({
        name: 'Lease B',
        lessor: 'Lessor B',
        lessee: 'Lessee B',
        organizationId: TEST_ORG_ID,
      });

      // When - Find all
      const found = await repository.findAll(TEST_ORG_ID);

      // Then - Verify leases found
      expect(found).toHaveLength(2);
      expect(found.map((l) => l.name)).toEqual(
        expect.arrayContaining(['Lease A', 'Lease B']),
      );
    });
  });

  describe('findByStatus', () => {
    it('should find leases by status', async () => {
      // Given - Create leases with different statuses
      await repository.create({
        name: 'Active Lease',
        lessor: 'Lessor A',
        lessee: 'Lessee A',
        organizationId: TEST_ORG_ID,
      });

      await repository.create({
        name: 'Expired Lease',
        lessor: 'Lessor B',
        lessee: 'Lessee B',
        organizationId: TEST_ORG_ID,
      });

      // Update the lease to expired status
      const expiredLease = await repository.findAll(TEST_ORG_ID);
      const leaseToExpire = expiredLease.find(
        (l) => l.name === 'Expired Lease',
      );
      if (leaseToExpire) {
        await repository.update(leaseToExpire.id, { status: 'expired' });
      }

      // When - Find by status
      const activeLeases = await repository.findByStatus(TEST_ORG_ID, 'active');
      const expiredLeases = await repository.findByStatus(
        TEST_ORG_ID,
        'expired',
      );

      // Then - Verify correct leases found
      expect(activeLeases).toHaveLength(1);
      expect(activeLeases[0]?.name).toBe('Active Lease');
      expect(expiredLeases).toHaveLength(1);
      expect(expiredLeases[0]?.name).toBe('Expired Lease');
    });
  });

  describe('findExpiring', () => {
    it('should find expiring leases within days', async () => {
      // Given - Create leases with different expiration dates
      const today = new Date();
      const in30Days = new Date(today);
      in30Days.setDate(today.getDate() + 30);
      const in60Days = new Date(today);
      in60Days.setDate(today.getDate() + 60);

      await repository.create({
        name: 'Expiring Soon',
        lessor: 'Lessor A',
        lessee: 'Lessee A',
        expirationDate: in30Days.toISOString().split('T')[0],
        organizationId: TEST_ORG_ID,
      });

      await repository.create({
        name: 'Not Expiring Soon',
        lessor: 'Lessor B',
        lessee: 'Lessee B',
        expirationDate: in60Days.toISOString().split('T')[0],
        organizationId: TEST_ORG_ID,
      });

      // When - Find expiring within 45 days
      const expiring = await repository.findExpiring(TEST_ORG_ID, 45);

      // Then - Only the soon-to-expire lease should be found
      expect(expiring).toHaveLength(1);
      expect(expiring[0]?.name).toBe('Expiring Soon');
    });
  });

  describe('update', () => {
    it('should update lease', async () => {
      // Given - Create and save a lease
      const created = await repository.create({
        name: 'Original Name',
        lessor: 'Original Lessor',
        lessee: 'Original Lessee',
        organizationId: TEST_ORG_ID,
      });

      // When - Update the lease
      const updated = await repository.update(created.id, {
        name: 'Updated Name',
        royaltyRate: '0.20',
      });

      // Then - Verify lease was updated
      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.royaltyRate).toBe('0.2000'); // Database returns with full decimal precision
      expect(updated?.lessor).toBe('Original Lessor'); // Unchanged field
    });

    it('should return null for non-existent lease', async () => {
      const updated = await repository.update(
        '550e8400-e29b-41d4-a716-446655440999',
        {
          name: 'New Name',
        },
      );
      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete lease', async () => {
      // Given - Create and save a lease
      const created = await repository.create({
        name: 'Lease to Delete',
        lessor: 'Lessor',
        lessee: 'Lessee',
        organizationId: TEST_ORG_ID,
      });

      // Verify exists
      const beforeDelete = await repository.findById(created.id);
      expect(beforeDelete).toBeDefined();

      // When - Delete the lease
      const deleted = await repository.delete(created.id);

      // Then - Verify lease was deleted
      expect(deleted).toBe(true);
      const afterDelete = await repository.findById(created.id);
      expect(afterDelete).toBeNull();
    });

    it('should return false for non-existent lease', async () => {
      const deleted = await repository.delete(
        '550e8400-e29b-41d4-a716-446655440999',
      );
      expect(deleted).toBe(false);
    });
  });
});
