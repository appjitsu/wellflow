import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../../database/database.module';
import { DatabaseService } from '../../../database/database.service';
import { WellRepositoryImpl } from '../well.repository';
import { Well } from '../../../domain/entities/well.entity';
import { ApiNumber } from '../../../domain/value-objects/api-number';
import { Location } from '../../../domain/value-objects/location';
import { Coordinates } from '../../../domain/value-objects/coordinates';
import { WellStatus, WellType } from '../../../domain/enums/well-status.enum';
import { wells } from '../../../database/schemas/wells';
import { leases } from '../../../database/schemas/leases';
import { organizations } from '../../../database/schemas/organizations';
import { eq } from 'drizzle-orm';

/**
 * Well Repository Integration Tests
 *
 * Tests the WellRepository implementation with real database operations
 * using transaction isolation for test data cleanup.
 */
describe('WellRepository Integration', () => {
  let repository: WellRepositoryImpl;
  let databaseService: DatabaseService;
  let db: any;

  // Test data constants
  const TEST_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';
  const TEST_API_NUMBER = '4212345678'; // Valid API number for Texas (42)

  // Helper function to create test wells
  function createTestWell(
    overrides: Partial<{
      id: string;
      organizationId: string;
      apiNumber: string;
      name: string;
      operatorId: string;
      leaseId?: string;
      wellType: WellType;
      status: WellStatus;
    }> = {},
  ): Well {
    const defaults = {
      id: 'test-well-id',
      organizationId: TEST_ORG_ID,
      apiNumber: TEST_API_NUMBER,
      name: 'Test Well #1',
      operatorId: TEST_ORG_ID, // Use org ID as operator ID for simplicity
      wellType: WellType.OIL,
      status: WellStatus.ACTIVE,
    };

    const config = { ...defaults, ...overrides };

    const apiNumber = new ApiNumber(config.apiNumber);
    const location = new Location(new Coordinates(35.1234567, -97.1234567), {
      address: '123 Test Road',
      county: 'Test County',
      state: 'TX',
      country: 'USA',
    });

    return new Well(
      config.id,
      apiNumber,
      config.name,
      config.operatorId,
      config.wellType,
      location,
      {
        leaseId: config.leaseId,
        status: config.status,
      },
    );
  }

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
          provide: 'WellRepository',
          useFactory: (databaseService: DatabaseService) => {
            return new WellRepositoryImpl(databaseService);
          },
          inject: [DatabaseService],
        },
      ],
    }).compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
    repository = module.get<WellRepositoryImpl>('WellRepository');

    // Initialize the database
    await databaseService.onModuleInit();
    db = databaseService.getDb();

    // Create test organization
    await db.insert(organizations).values({
      id: TEST_ORG_ID,
      name: 'Test Organization LLC',
      taxId: '12-3456789',
    });
  });

  beforeEach(async () => {
    // Clean up test data before each test
    try {
      await db.delete(wells).where(eq(wells.organizationId, TEST_ORG_ID));
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Cleanup error (ignored):', error);
    }
  });

  afterAll(async () => {
    // Clean up any remaining test data
    try {
      await db.delete(wells).where(eq(wells.organizationId, TEST_ORG_ID));
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Cleanup error (ignored):', error);
    }
  });

  describe('save', () => {
    it('should persist a new well to database', async () => {
      // Given - Create a valid well entity
      const well = createTestWell({
        id: '550e8400-e29b-41d4-a716-446655440001',
        apiNumber: TEST_API_NUMBER,
        organizationId: TEST_ORG_ID,
      });

      // When - Save the well
      await repository.save(well);

      // Then - Verify well was saved
      const result = await db
        .select()
        .from(wells)
        .where(eq(wells.id, '550e8400-e29b-41d4-a716-446655440001'));

      expect(result).toHaveLength(1);
      expect(result[0]?.apiNumber).toBe('4212345678');
      expect(result[0]?.organizationId).toBe(TEST_ORG_ID);
    });

    it('should handle unique constraint violations for API number', async () => {
      // Given - Create first well
      const well1 = createTestWell({
        id: '550e8400-e29b-41d4-a716-446655440002',
        apiNumber: TEST_API_NUMBER,
        organizationId: TEST_ORG_ID,
      });

      await repository.save(well1);

      // When - Try to create well with same API number
      const well2 = createTestWell({
        id: '550e8400-e29b-41d4-a716-446655440003',
        apiNumber: TEST_API_NUMBER, // Same API number
        organizationId: TEST_ORG_ID,
      });

      // Then - Should throw unique constraint error
      await expect(repository.save(well2)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should retrieve well by ID', async () => {
      // Given - Create and save well
      const well = createTestWell({
        id: '550e8400-e29b-41d4-a716-446655440004',
        apiNumber: '4212345679',
        organizationId: TEST_ORG_ID,
      });

      await repository.save(well);

      // When - Find by ID
      const found = await repository.findById(
        '550e8400-e29b-41d4-a716-446655440004',
      );

      // Then - Verify well found
      expect(found).toBeDefined();
      expect(found?.getId().getValue()).toBe(
        '550e8400-e29b-41d4-a716-446655440004',
      );
      expect(found?.getApiNumber().toString()).toBe('42-123-45679');
    });

    it('should return null for non-existent well', async () => {
      const result = await repository.findById(
        '550e8400-e29b-41d4-a716-446655440999',
      );
      expect(result).toBeNull();
    });
  });

  describe('findByApiNumber', () => {
    it('should find well by API number', async () => {
      // Given - Create well
      const well = createTestWell({
        id: '550e8400-e29b-41d4-a716-446655440005',
        apiNumber: '4212345680',
        organizationId: TEST_ORG_ID,
      });

      await repository.save(well);

      // When - Find by API number
      const apiNumber = new ApiNumber('4212345680');
      const found = await repository.findByApiNumber(apiNumber);

      // Then - Verify found
      expect(found).toBeDefined();
      expect(found?.getApiNumber().toString()).toBe('42-123-45680');
    });

    it('should return null for non-existent API number', async () => {
      const apiNumber = new ApiNumber('4299999999');
      const result = await repository.findByApiNumber(apiNumber);
      expect(result).toBeNull();
    });
  });

  describe('findByOperatorId', () => {
    it('should find wells by operator ID', async () => {
      // Given - Create wells with same operator
      const operatorId = TEST_ORG_ID;
      const well1 = createTestWell({
        id: '550e8400-e29b-41d4-a716-446655440006',
        apiNumber: '4212345681',
        organizationId: TEST_ORG_ID,
        operatorId,
      });
      const well2 = createTestWell({
        id: '550e8400-e29b-41d4-a716-446655440007',
        apiNumber: '4212345682',
        organizationId: TEST_ORG_ID,
        operatorId,
      });

      await repository.save(well1);
      await repository.save(well2);

      // When - Find by operator ID
      const found = await repository.findByOperatorId(operatorId);

      // Then - Verify both wells found
      expect(found).toHaveLength(2);
      expect(found.map((w) => w.getId().getValue())).toEqual(
        expect.arrayContaining([
          '550e8400-e29b-41d4-a716-446655440006',
          '550e8400-e29b-41d4-a716-446655440007',
        ]),
      );
    });
  });

  describe('findByLeaseId', () => {
    it('should find wells by lease ID', async () => {
      // Given - Create lease first
      const leaseId = '550e8400-e29b-41d4-a716-446655440777';
      await db.insert(leases).values({
        id: leaseId,
        organizationId: TEST_ORG_ID,
        name: 'Test Lease',
        leaseNumber: 'TEST-001',
        lessor: 'Test Lessor',
        lessee: 'Test Lessee',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create wells with same lease
      const well1 = createTestWell({
        id: '550e8400-e29b-41d4-a716-446655440008',
        apiNumber: '4212345683',
        organizationId: TEST_ORG_ID,
        leaseId,
      });
      const well2 = createTestWell({
        id: '550e8400-e29b-41d4-a716-446655440009',
        apiNumber: '4212345684',
        organizationId: TEST_ORG_ID,
        leaseId,
      });

      await repository.save(well1);
      await repository.save(well2);

      // When - Find by lease ID
      const found = await repository.findByLeaseId(leaseId);

      // Then - Verify both wells found
      expect(found).toHaveLength(2);
      expect(found.map((w) => w.getId().getValue())).toEqual(
        expect.arrayContaining([
          '550e8400-e29b-41d4-a716-446655440008',
          '550e8400-e29b-41d4-a716-446655440009',
        ]),
      );
    });
  });

  describe('findWithPagination', () => {
    it('should find wells with pagination', async () => {
      // Given - Create multiple wells
      const wells = [
        createTestWell({
          id: '550e8400-e29b-41d4-a716-446655440010',
          apiNumber: '4212345685',
          organizationId: TEST_ORG_ID,
        }),
        createTestWell({
          id: '550e8400-e29b-41d4-a716-446655440011',
          apiNumber: '4212345686',
          organizationId: TEST_ORG_ID,
        }),
        createTestWell({
          id: '550e8400-e29b-41d4-a716-446655440012',
          apiNumber: '4212345687',
          organizationId: TEST_ORG_ID,
        }),
      ];

      for (const well of wells) {
        await repository.save(well);
      }

      // When - Find with pagination
      const result = await repository.findWithPagination(0, 2);

      // Then - Verify pagination
      expect(result.wells).toHaveLength(2);
      expect(result.total).toBe(3);
    });

    it('should filter wells by status', async () => {
      // Given - Create wells with different statuses
      const activeWell = createTestWell({
        id: '550e8400-e29b-41d4-a716-446655440013',
        apiNumber: '4212345688',
        organizationId: TEST_ORG_ID,
        status: WellStatus.ACTIVE,
      });

      const inactiveWell = createTestWell({
        id: '550e8400-e29b-41d4-a716-446655440014',
        apiNumber: '4212345689',
        organizationId: TEST_ORG_ID,
        status: WellStatus.INACTIVE,
      });

      await repository.save(activeWell);
      await repository.save(inactiveWell);

      // When - Filter by active status
      const result = await repository.findWithPagination(0, 10, {
        status: 'active',
      });

      // Then - Only active well returned
      expect(result.wells).toHaveLength(1);
      expect(result.wells[0]!.getStatus()).toBe(WellStatus.ACTIVE);
    });
  });

  describe('existsByApiNumber', () => {
    it('should return true for existing API number', async () => {
      // Given - Create well
      const well = createTestWell({
        id: '550e8400-e29b-41d4-a716-446655440015',
        apiNumber: '4212345690',
        organizationId: TEST_ORG_ID,
      });

      await repository.save(well);

      // When - Check existence
      const apiNumber = new ApiNumber('4212345690');
      const exists = await repository.existsByApiNumber(apiNumber);

      // Then - Should exist
      expect(exists).toBe(true);
    });

    it('should return false for non-existent API number', async () => {
      const apiNumber = new ApiNumber('4299999999');
      const exists = await repository.existsByApiNumber(apiNumber);
      expect(exists).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete well from database', async () => {
      // Given - Create and save well
      const well = createTestWell({
        id: '550e8400-e29b-41d4-a716-446655440016',
        apiNumber: '4212345691',
        organizationId: TEST_ORG_ID,
      });

      await repository.save(well);

      // Verify exists
      const apiNumber = new ApiNumber('4212345691');
      const existsBefore = await repository.existsByApiNumber(apiNumber);
      expect(existsBefore).toBe(true);

      // When - Delete well
      await repository.delete('550e8400-e29b-41d4-a716-446655440016');

      // Then - Should not exist
      const existsAfter = await repository.existsByApiNumber(apiNumber);
      expect(existsAfter).toBe(false);
    });
  });

  afterAll(async () => {
    // Clean up test organization
    try {
      await db.delete(organizations).where(eq(organizations.id, TEST_ORG_ID));
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Cleanup error (ignored):', error);
    }
  });
});
