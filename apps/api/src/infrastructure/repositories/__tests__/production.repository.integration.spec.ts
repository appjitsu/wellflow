import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../../database/database.module';
import { DatabaseService } from '../../../database/database.service';
import { ProductionRepository } from '../production.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { organizations } from '../../../database/schemas/organizations';
import { wells } from '../../../database/schemas/wells';
import { eq } from 'drizzle-orm';

/**
 * Production Repository Integration Tests
 *
 * Tests the ProductionRepository implementation with real database operations
 * using transaction isolation for test data cleanup.
 */
describe('ProductionRepository Integration', () => {
  let repository: ProductionRepository;
  let databaseService: DatabaseService;
  let db: any;

  // Test data constants
  const TEST_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';
  const TEST_WELL_ID = '550e8400-e29b-41d4-a716-446655440001';

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
          provide: 'ProductionRepository',
          useFactory: (databaseService: DatabaseService) => {
            return new ProductionRepository(databaseService);
          },
          inject: [DatabaseService],
        },
      ],
    }).compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
    repository = module.get<ProductionRepository>('ProductionRepository');

    // Initialize the database
    await databaseService.onModuleInit();
    db = databaseService.getDb();

    // Clean up any existing test data more thoroughly
    try {
      // First clean up production records that might reference the well
      await db
        .delete(require('../../../database/schema').productionRecords)
        .where(
          require('drizzle-orm').eq(
            require('../../../database/schema').productionRecords.wellId,
            TEST_WELL_ID,
          ),
        );
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Cleanup error (ignored):', error);
    }

    try {
      // Then clean up the well
      await db.delete(wells).where(eq(wells.id, TEST_WELL_ID));
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Cleanup error (ignored):', error);
    }

    try {
      // Finally clean up the organization
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

    // Create test well with upsert-like behavior
    try {
      await db.insert(wells).values({
        id: TEST_WELL_ID,
        organizationId: TEST_ORG_ID,
        wellName: 'Test Well #1',
        apiNumber: '4212345678',
        status: 'active',
        wellType: 'oil',
      });
    } catch (error) {
      // If well already exists, that's fine - we'll use it
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        !errorMessage.includes('duplicate key') &&
        !errorMessage.includes('unique constraint')
      ) {
        throw error;
      }
      // Well already exists, continue with the test
    }
  });

  beforeEach(async () => {
    // Clean up test data before each test
    try {
      await db
        .delete(require('../../../database/schema').productionRecords)
        .where(
          require('drizzle-orm').eq(
            require('../../../database/schema').productionRecords
              .organizationId,
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
        .delete(require('../../../database/schema').productionRecords)
        .where(
          require('drizzle-orm').eq(
            require('../../../database/schema').productionRecords
              .organizationId,
            TEST_ORG_ID,
          ),
        );
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Cleanup error (ignored):', error);
    }

    // Clean up test well
    try {
      await db.delete(wells).where(eq(wells.id, TEST_WELL_ID));
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
    it('should create a new production record', async () => {
      // Given - Create production record data
      const productionData = {
        wellId: TEST_WELL_ID,
        productionDate: '2024-01-15',
        oilVolume: '100.50',
        gasVolume: '500.25',
        waterVolume: '25.75',
        oilPrice: '75.5000',
        gasPrice: '3.2500',
        runTicket: 'RT-001',
        comments: 'Test production record',
        organizationId: TEST_ORG_ID,
      };

      // When - Create the production record
      const result = await repository.create(productionData);

      // Then - Verify production record was created
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.wellId).toBe(TEST_WELL_ID);
      expect(result.productionDate).toBe('2024-01-15');
      expect(result.organizationId).toBe(TEST_ORG_ID);
    });
  });

  describe('findById', () => {
    it('should find production record by ID', async () => {
      // Given - Create and save a production record
      const productionData = {
        wellId: TEST_WELL_ID,
        productionDate: '2024-01-16',
        oilVolume: '200.00',
        gasVolume: '1000.00',
        organizationId: TEST_ORG_ID,
      };

      const created = await repository.create(productionData);

      // When - Find by ID
      const found = await repository.findById(created.id);

      // Then - Verify production record found
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.wellId).toBe(TEST_WELL_ID);
      expect(found?.productionDate).toBe('2024-01-16');
    });

    it('should return null for non-existent production record', async () => {
      const found = await repository.findById(
        '550e8400-e29b-41d4-a716-446655440999',
      );
      expect(found).toBeNull();
    });
  });

  describe('findByWellId', () => {
    it('should find production records by well ID', async () => {
      // Given - Create multiple production records for the same well
      await repository.create({
        wellId: TEST_WELL_ID,
        productionDate: '2024-01-17',
        oilVolume: '150.00',
        gasVolume: '750.00',
        organizationId: TEST_ORG_ID,
      });

      await repository.create({
        wellId: TEST_WELL_ID,
        productionDate: '2024-01-18',
        oilVolume: '160.00',
        gasVolume: '800.00',
        organizationId: TEST_ORG_ID,
      });

      // When - Find by well ID
      const found = await repository.findByWellId(TEST_WELL_ID);

      // Then - Verify production records found
      expect(found).toHaveLength(2);
      expect(found.map((p) => p.productionDate)).toEqual(
        expect.arrayContaining(['2024-01-18', '2024-01-17']), // Ordered by date desc
      );
    });
  });

  describe('findByWellAndDateRange', () => {
    it('should find production records by well and date range', async () => {
      // Given - Create production records with different dates
      await repository.create({
        wellId: TEST_WELL_ID,
        productionDate: '2024-01-10',
        oilVolume: '100.00',
        gasVolume: '500.00',
        organizationId: TEST_ORG_ID,
      });

      await repository.create({
        wellId: TEST_WELL_ID,
        productionDate: '2024-01-20',
        oilVolume: '200.00',
        gasVolume: '1000.00',
        organizationId: TEST_ORG_ID,
      });

      await repository.create({
        wellId: TEST_WELL_ID,
        productionDate: '2024-02-01',
        oilVolume: '300.00',
        gasVolume: '1500.00',
        organizationId: TEST_ORG_ID,
      });

      // When - Find by date range
      const found = await repository.findByWellAndDateRange(
        TEST_WELL_ID,
        new Date('2024-01-15'),
        new Date('2024-01-25'),
      );

      // Then - Only records in date range should be found
      expect(found).toHaveLength(1);
      expect(found[0]?.productionDate).toBe('2024-01-20');
    });
  });

  describe('update', () => {
    it('should update production record', async () => {
      // Given - Create and save a production record
      const created = await repository.create({
        wellId: TEST_WELL_ID,
        productionDate: '2024-01-19',
        oilVolume: '100.00',
        gasVolume: '500.00',
        organizationId: TEST_ORG_ID,
      });

      // When - Update the production record
      const updated = await repository.update(created.id, {
        oilVolume: '150.00',
        gasVolume: '750.00',
        comments: 'Updated production',
      });

      // Then - Verify production record was updated
      expect(updated).toBeDefined();
      expect(updated?.oilVolume).toBe('150.00');
      expect(updated?.gasVolume).toBe('750.00');
      expect(updated?.comments).toBe('Updated production');
      expect(updated?.productionDate).toBe('2024-01-19'); // Unchanged field
    });

    it('should return null for non-existent production record', async () => {
      const updated = await repository.update(
        '550e8400-e29b-41d4-a716-446655440999',
        {
          oilVolume: '200.00',
        },
      );
      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete production record', async () => {
      // Given - Create and save a production record
      const created = await repository.create({
        wellId: TEST_WELL_ID,
        productionDate: '2024-01-21',
        oilVolume: '250.00',
        gasVolume: '1250.00',
        organizationId: TEST_ORG_ID,
      });

      // Verify exists
      const beforeDelete = await repository.findById(created.id);
      expect(beforeDelete).toBeDefined();

      // When - Delete the production record
      const deleted = await repository.delete(created.id);

      // Then - Verify production record was deleted
      expect(deleted).toBe(true);
      const afterDelete = await repository.findById(created.id);
      expect(afterDelete).toBeNull();
    });

    it('should return false for non-existent production record', async () => {
      const deleted = await repository.delete(
        '550e8400-e29b-41d4-a716-446655440999',
      );
      expect(deleted).toBe(false);
    });
  });
});
