import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../../database/database.module';
import { DatabaseService } from '../../../database/database.service';
import { VendorRepositoryImpl } from '../vendor.repository';
import { Vendor } from '../../../domain/entities/vendor.entity';
import {
  VendorStatus,
  VendorType,
} from '../../../domain/enums/vendor-status.enum';
import { vendors } from '../../../database/schemas/vendors';
import { organizations } from '../../../database/schemas/organizations';
import { eq } from 'drizzle-orm';

/**
 * Vendor Repository Integration Tests
 *
 * Tests the VendorRepository implementation with real database operations
 * using transaction isolation for test data cleanup.
 */
describe('VendorRepository Integration', () => {
  let repository: VendorRepositoryImpl;
  let databaseService: DatabaseService;
  let db: any;

  // Test data constants
  const TEST_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';
  const TEST_VENDOR_CODE = 'TEST-VENDOR-001';

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
          provide: 'VendorRepository',
          useClass: VendorRepositoryImpl,
        },
      ],
    }).compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
    repository = module.get<VendorRepositoryImpl>('VendorRepository');

    // Initialize the database
    await databaseService.onModuleInit();
    db = databaseService.getDb();

    // Clean up any existing test data more thoroughly
    try {
      await db.delete(vendors).where(eq(vendors.organizationId, TEST_ORG_ID));
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
      await db.delete(vendors).where(eq(vendors.organizationId, TEST_ORG_ID));
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Cleanup error (ignored):', error);
    }
  });

  afterAll(async () => {
    // Clean up any remaining test data
    try {
      await db.delete(vendors).where(eq(vendors.organizationId, TEST_ORG_ID));
      await db.delete(organizations).where(eq(organizations.id, TEST_ORG_ID));
    } catch (error) {
      // Ignore cleanup errors
      console.warn('Cleanup error (ignored):', error);
    }
  });

  describe('save', () => {
    it('should persist a new vendor to database', async () => {
      // Given - Create a valid vendor entity
      const vendor = createTestVendor({
        id: '550e8400-e29b-41d4-a716-446655440001',
        vendorCode: TEST_VENDOR_CODE,
        organizationId: TEST_ORG_ID,
      });

      // When - Save the vendor
      const savedVendor = await repository.save(vendor);

      // Then - Verify vendor was saved
      expect(savedVendor).toBeDefined();
      expect(savedVendor.getId()).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(savedVendor.getVendorCode()).toBe(TEST_VENDOR_CODE);

      // Verify in database
      const result = await db
        .select()
        .from(vendors)
        .where(eq(vendors.id, '550e8400-e29b-41d4-a716-446655440001'));

      expect(result).toHaveLength(1);
      expect(result[0]?.vendorCode).toBe(TEST_VENDOR_CODE);
      expect(result[0]?.organizationId).toBe(TEST_ORG_ID);
    });

    it('should update existing vendor', async () => {
      // Given - Create and save initial vendor
      const vendor = createTestVendor({
        id: '550e8400-e29b-41d4-a716-446655440002',
        vendorCode: 'UPDATE-TEST-001',
        organizationId: TEST_ORG_ID,
        vendorName: 'Original Name',
      });

      await repository.save(vendor);

      // When - Update the vendor
      vendor.updateStatus(VendorStatus.APPROVED);
      const updatedVendor = await repository.save(vendor);

      // Then - Verify update
      expect(updatedVendor.getStatus()).toBe(VendorStatus.APPROVED);

      // Verify in database
      const result = await db
        .select()
        .from(vendors)
        .where(eq(vendors.id, '550e8400-e29b-41d4-a716-446655440002'));

      expect(result).toHaveLength(1);
      expect(result[0]?.status).toBe('approved');
    });

    it('should handle unique constraint violations', async () => {
      // Given - Create first vendor
      const vendor1 = createTestVendor({
        id: '550e8400-e29b-41d4-a716-446655440003',
        vendorCode: TEST_VENDOR_CODE,
        organizationId: TEST_ORG_ID,
      });

      await repository.save(vendor1);

      // When - Try to create vendor with same code in same org
      const vendor2 = createTestVendor({
        id: '550e8400-e29b-41d4-a716-446655440004',
        vendorCode: TEST_VENDOR_CODE, // Same code
        organizationId: TEST_ORG_ID, // Same org
      });

      // Then - Should throw unique constraint error
      await expect(repository.save(vendor2)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should retrieve vendor by ID', async () => {
      // Given - Create and save vendor
      const vendor = createTestVendor({
        id: '550e8400-e29b-41d4-a716-446655440005',
        vendorCode: 'FIND-TEST-001',
        organizationId: TEST_ORG_ID,
      });

      await repository.save(vendor);

      // When - Find by ID
      const found = await repository.findById(
        '550e8400-e29b-41d4-a716-446655440005',
      );

      // Then - Verify vendor found
      expect(found).toBeDefined();
      expect(found?.getId()).toBe('550e8400-e29b-41d4-a716-446655440005');
      expect(found?.getVendorCode()).toBe('FIND-TEST-001');
    });

    it('should return null for non-existent vendor', async () => {
      const result = await repository.findById(
        '550e8400-e29b-41d4-a716-446655440999',
      );
      expect(result).toBeNull();
    });
  });

  describe('findByVendorCode', () => {
    it('should find vendor by code and organization', async () => {
      // Given - Create vendor
      const vendor = createTestVendor({
        id: '550e8400-e29b-41d4-a716-446655440006',
        vendorCode: 'CODE-TEST-001',
        organizationId: TEST_ORG_ID,
      });

      await repository.save(vendor);

      // When - Find by code
      const found = await repository.findByVendorCode(
        TEST_ORG_ID,
        'CODE-TEST-001',
      );

      // Then - Verify found
      expect(found).toBeDefined();
      expect(found?.getVendorCode()).toBe('CODE-TEST-001');
    });

    it('should return null for wrong organization', async () => {
      // Given - Create vendor in one org
      const vendor = createTestVendor({
        id: '550e8400-e29b-41d4-a716-446655440014',
        vendorCode: 'ORG-TEST-001',
        organizationId: TEST_ORG_ID,
      });

      await repository.save(vendor);

      // When - Search in different org
      const result = await repository.findByVendorCode(
        '550e8400-e29b-41d4-a716-446655440888',
        'ORG-TEST-001',
      );

      // Then - Should not find
      expect(result).toBeNull();
    });
  });

  describe('findByOrganization', () => {
    it('should find vendors for organization with pagination', async () => {
      // Given - Create multiple vendors
      const vendors = [
        createTestVendor({
          id: '550e8400-e29b-41d4-a716-446655440007',
          vendorCode: 'ORG-TEST-001',
          organizationId: TEST_ORG_ID,
        }),
        createTestVendor({
          id: '550e8400-e29b-41d4-a716-446655440008',
          vendorCode: 'ORG-TEST-002',
          organizationId: TEST_ORG_ID,
        }),
        createTestVendor({
          id: '550e8400-e29b-41d4-a716-446655440009',
          vendorCode: 'ORG-TEST-003',
          organizationId: TEST_ORG_ID,
        }),
      ];

      for (const vendor of vendors) {
        await repository.save(vendor);
      }

      // When - Find with pagination
      const result = await repository.findByOrganization(
        TEST_ORG_ID,
        undefined,
        {
          page: 1,
          limit: 2,
        },
      );

      // Then - Verify pagination
      expect(result.vendors).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.totalPages).toBe(2);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrevious).toBe(false);
    });

    it('should filter vendors by status', async () => {
      // Given - Create vendors with different statuses
      const approvedVendor = createTestVendor({
        id: '550e8400-e29b-41d4-a716-446655440010',
        vendorCode: 'STATUS-APPROVED',
        organizationId: TEST_ORG_ID,
      });
      approvedVendor.updateStatus(VendorStatus.APPROVED);

      const pendingVendor = createTestVendor({
        id: '550e8400-e29b-41d4-a716-446655440011',
        vendorCode: 'STATUS-PENDING',
        organizationId: TEST_ORG_ID,
      });

      await repository.save(approvedVendor);
      await repository.save(pendingVendor);

      // When - Filter by approved status
      const result = await repository.findByOrganization(TEST_ORG_ID, {
        status: [VendorStatus.APPROVED],
      });

      // Then - Only approved vendor returned
      expect(result.vendors).toHaveLength(1);
      expect(result.vendors[0]?.getStatus()).toBe(VendorStatus.APPROVED);
    });
  });

  describe('existsByVendorCode', () => {
    it('should return true for existing vendor code', async () => {
      // Given - Create vendor
      const vendor = createTestVendor({
        id: '550e8400-e29b-41d4-a716-446655440012',
        vendorCode: 'EXISTS-TEST-001',
        organizationId: TEST_ORG_ID,
      });

      await repository.save(vendor);

      // When - Check existence
      const exists = await repository.existsByVendorCode(
        TEST_ORG_ID,
        'EXISTS-TEST-001',
      );

      // Then - Should exist
      expect(exists).toBe(true);
    });

    it('should return false for non-existent vendor code', async () => {
      const exists = await repository.existsByVendorCode(
        TEST_ORG_ID,
        'NON-EXISTENT',
      );
      expect(exists).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete vendor from database', async () => {
      // Given - Create and save vendor
      const vendor = createTestVendor({
        id: '550e8400-e29b-41d4-a716-446655440013',
        vendorCode: 'DELETE-TEST-001',
        organizationId: TEST_ORG_ID,
      });

      await repository.save(vendor);

      // Verify exists
      const existsBefore = await repository.existsByVendorCode(
        TEST_ORG_ID,
        'DELETE-TEST-001',
      );
      expect(existsBefore).toBe(true);

      // When - Delete vendor
      await repository.delete('550e8400-e29b-41d4-a716-446655440013');

      // Then - Should not exist
      const existsAfter = await repository.existsByVendorCode(
        TEST_ORG_ID,
        'DELETE-TEST-001',
      );
      expect(existsAfter).toBe(false);
    });
  });
});

/**
 * Helper function to create test vendor entities
 */
function createTestVendor(
  overrides: Partial<{
    id: string;
    organizationId: string;
    vendorCode: string;
    vendorName: string;
    vendorType: VendorType;
  }> = {},
): Vendor {
  const defaults = {
    id: 'test-vendor-id',
    organizationId: 'test-org',
    vendorCode: 'TEST-001',
    vendorName: 'Test Vendor LLC',
    vendorType: VendorType.SERVICE,
  };

  const config = { ...defaults, ...overrides };

  return new Vendor(
    config.id,
    config.organizationId,
    config.vendorCode,
    config.vendorName,
    config.vendorType,
    {
      street: '123 Test Street',
      city: 'Test City',
      state: 'TX',
      zipCode: '12345',
      country: 'USA',
    },
    'Net 30',
  );
}
