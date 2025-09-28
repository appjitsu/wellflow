import { Test, TestingModule } from '@nestjs/testing';
import { GetVendorsByOrganizationHandler } from '../get-vendors-by-organization.handler';
import {
  GetVendorsByOrganizationQuery,
  VendorFilters,
  PaginationOptions,
} from '../../queries/get-vendors-by-organization.query';
import {
  VendorRepository,
  VendorSearchResult,
} from '../../../domain/repositories/vendor.repository.interface';
import { Vendor } from '../../../domain/entities/vendor.entity';
import {
  VendorType,
  VendorStatus,
  VendorRating,
} from '../../../domain/enums/vendor-status.enum';

describe('GetVendorsByOrganizationHandler', () => {
  let handler: GetVendorsByOrganizationHandler;
  let vendorRepository: jest.Mocked<VendorRepository>;

  const mockAddress = {
    street: '123 Main St',
    city: 'Houston',
    state: 'TX',
    zipCode: '77001',
    country: 'USA',
  };

  const mockVendor1 = new Vendor(
    'vendor-1',
    'org-123',
    'VENDOR-001',
    'Test Vendor 1',
    VendorType.SERVICE,
    mockAddress,
    'Net 30',
  );

  const mockVendor2 = new Vendor(
    'vendor-2',
    'org-123',
    'VENDOR-002',
    'Test Vendor 2',
    VendorType.CONTRACTOR,
    mockAddress,
    'Net 15',
  );

  const mockVendorSearchResult: VendorSearchResult = {
    vendors: [mockVendor1, mockVendor2],
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  };

  beforeEach(async () => {
    const mockVendorRepository = {
      findByOrganization: jest.fn(),
      findById: jest.fn(),
      findByVendorCode: jest.fn(),
      save: jest.fn(),
      findByStatus: jest.fn(),
      findByType: jest.fn(),
      findWithExpiringInsurance: jest.fn(),
      findWithExpiringCertifications: jest.fn(),
      findByPerformanceRating: jest.fn(),
      search: jest.fn(),
      existsByVendorCode: jest.fn(),
      delete: jest.fn(),
      getVendorStatistics: jest.fn(),
      findRequiringQualificationRenewal: jest.fn(),
      bulkUpdateStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetVendorsByOrganizationHandler,
        {
          provide: 'VendorRepository',
          useValue: mockVendorRepository,
        },
      ],
    }).compile();

    handler = module.get<GetVendorsByOrganizationHandler>(
      GetVendorsByOrganizationHandler,
    );
    vendorRepository = module.get('VendorRepository');
  });

  describe('execute', () => {
    it('should be defined', () => {
      expect(handler).toBeDefined();
    });

    it('should return vendors when repository succeeds without filters or pagination', async () => {
      // Arrange
      const query = new GetVendorsByOrganizationQuery('org-123');
      vendorRepository.findByOrganization.mockResolvedValue(
        mockVendorSearchResult,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBe(mockVendorSearchResult);
      expect(vendorRepository.findByOrganization).toHaveBeenCalledWith(
        'org-123',
        undefined,
        undefined,
      );
      expect(vendorRepository.findByOrganization).toHaveBeenCalledTimes(1);
    });

    it('should return vendors with filters', async () => {
      // Arrange
      const filters: VendorFilters = {
        status: [VendorStatus.APPROVED],
        vendorType: [VendorType.SERVICE],
        isPrequalified: true,
      };
      const query = new GetVendorsByOrganizationQuery('org-123', filters);
      vendorRepository.findByOrganization.mockResolvedValue(
        mockVendorSearchResult,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBe(mockVendorSearchResult);
      expect(vendorRepository.findByOrganization).toHaveBeenCalledWith(
        'org-123',
        filters,
        undefined,
      );
    });

    it('should return vendors with pagination', async () => {
      // Arrange
      const pagination: PaginationOptions = {
        page: 2,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'ASC',
      };
      const query = new GetVendorsByOrganizationQuery(
        'org-123',
        undefined,
        pagination,
      );
      vendorRepository.findByOrganization.mockResolvedValue(
        mockVendorSearchResult,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBe(mockVendorSearchResult);
      expect(vendorRepository.findByOrganization).toHaveBeenCalledWith(
        'org-123',
        undefined,
        pagination,
      );
    });

    it('should return vendors with both filters and pagination', async () => {
      // Arrange
      const filters: VendorFilters = {
        status: [VendorStatus.APPROVED],
        searchTerm: 'test',
      };
      const pagination: PaginationOptions = {
        page: 1,
        limit: 10,
      };
      const query = new GetVendorsByOrganizationQuery(
        'org-123',
        filters,
        pagination,
      );
      vendorRepository.findByOrganization.mockResolvedValue(
        mockVendorSearchResult,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBe(mockVendorSearchResult);
      expect(vendorRepository.findByOrganization).toHaveBeenCalledWith(
        'org-123',
        filters,
        pagination,
      );
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const query = new GetVendorsByOrganizationQuery('org-123');
      const repositoryError = new Error('Database connection failed');
      vendorRepository.findByOrganization.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        'Database connection failed',
      );

      expect(vendorRepository.findByOrganization).toHaveBeenCalledWith(
        'org-123',
        undefined,
        undefined,
      );
      expect(vendorRepository.findByOrganization).toHaveBeenCalledTimes(1);
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      const query = new GetVendorsByOrganizationQuery('org-123');
      const nonErrorException = new Error('Non-error exception');
      vendorRepository.findByOrganization.mockImplementation(() =>
        Promise.reject(nonErrorException),
      );

      // Act & Assert
      try {
        await handler.execute(query);
        fail('Expected handler to throw an exception');
      } catch (error) {
        expect(error).toBe(nonErrorException);
      }

      expect(vendorRepository.findByOrganization).toHaveBeenCalledWith(
        'org-123',
        undefined,
        undefined,
      );
      expect(vendorRepository.findByOrganization).toHaveBeenCalledTimes(1);
    });

    it('should handle different organization IDs correctly', async () => {
      // Test various organization ID formats
      const testCases = [
        'org-123',
        '123e4567-e89b-12d3-a456-426614174000',
        'simple-org',
        'org_with_underscores',
        'org-with-dashes',
      ];

      for (const orgId of testCases) {
        const query = new GetVendorsByOrganizationQuery(orgId);
        vendorRepository.findByOrganization.mockResolvedValue(
          mockVendorSearchResult,
        );

        const result = await handler.execute(query);

        expect(result).toBe(mockVendorSearchResult);
        expect(vendorRepository.findByOrganization).toHaveBeenCalledWith(
          orgId,
          undefined,
          undefined,
        );
      }
    });

    it('should return the exact search result object from repository', async () => {
      // Arrange
      const query = new GetVendorsByOrganizationQuery('org-456');
      const differentResult: VendorSearchResult = {
        vendors: [mockVendor1],
        total: 1,
        page: 1,
        limit: 5,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      };

      vendorRepository.findByOrganization.mockResolvedValue(differentResult);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBe(differentResult);
      expect(result).not.toBe(mockVendorSearchResult);
      expect(result.total).toBe(1);
      expect(result.vendors.length).toBe(1);
      expect(result.limit).toBe(5);
    });

    it('should handle empty organization ID', async () => {
      // Arrange
      const query = new GetVendorsByOrganizationQuery('');
      vendorRepository.findByOrganization.mockResolvedValue(
        mockVendorSearchResult,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBe(mockVendorSearchResult);
      expect(vendorRepository.findByOrganization).toHaveBeenCalledWith(
        '',
        undefined,
        undefined,
      );
    });

    it('should handle null organization ID', async () => {
      // Arrange
      const query = new GetVendorsByOrganizationQuery(null as any);
      vendorRepository.findByOrganization.mockResolvedValue(
        mockVendorSearchResult,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBe(mockVendorSearchResult);
      expect(vendorRepository.findByOrganization).toHaveBeenCalledWith(
        null,
        undefined,
        undefined,
      );
    });

    it('should handle undefined organization ID', async () => {
      // Arrange
      const query = new GetVendorsByOrganizationQuery(undefined as any);
      vendorRepository.findByOrganization.mockResolvedValue(
        mockVendorSearchResult,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBe(mockVendorSearchResult);
      expect(vendorRepository.findByOrganization).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
      );
    });

    it('should return search result with all expected properties', async () => {
      // Arrange
      const query = new GetVendorsByOrganizationQuery('org-123');
      vendorRepository.findByOrganization.mockResolvedValue(
        mockVendorSearchResult,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          vendors: expect.any(Array),
          total: expect.any(Number),
          page: expect.any(Number),
          limit: expect.any(Number),
          totalPages: expect.any(Number),
          hasNext: expect.any(Boolean),
          hasPrevious: expect.any(Boolean),
        }),
      );
    });

    it('should handle empty vendor results', async () => {
      // Arrange
      const query = new GetVendorsByOrganizationQuery('org-123');
      const emptyResult: VendorSearchResult = {
        vendors: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      };

      vendorRepository.findByOrganization.mockResolvedValue(emptyResult);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.vendors).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrevious).toBe(false);
    });

    it('should handle complex filter combinations', async () => {
      // Arrange
      const complexFilters: VendorFilters = {
        status: [VendorStatus.APPROVED, VendorStatus.PREQUALIFIED],
        vendorType: [VendorType.SERVICE, VendorType.CONTRACTOR],
        isPrequalified: true,
        hasValidInsurance: true,
        performanceRating: [VendorRating.EXCELLENT, VendorRating.GOOD],
        searchTerm: 'drilling',
      };
      const query = new GetVendorsByOrganizationQuery(
        'org-123',
        complexFilters,
      );
      vendorRepository.findByOrganization.mockResolvedValue(
        mockVendorSearchResult,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBe(mockVendorSearchResult);
      expect(vendorRepository.findByOrganization).toHaveBeenCalledWith(
        'org-123',
        complexFilters,
        undefined,
      );
    });

    it('should handle pagination edge cases', async () => {
      // Arrange
      const edgePagination: PaginationOptions = {
        page: 0,
        limit: 0,
        sortBy: '',
        sortOrder: 'DESC',
      };
      const query = new GetVendorsByOrganizationQuery(
        'org-123',
        undefined,
        edgePagination,
      );
      vendorRepository.findByOrganization.mockResolvedValue(
        mockVendorSearchResult,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBe(mockVendorSearchResult);
      expect(vendorRepository.findByOrganization).toHaveBeenCalledWith(
        'org-123',
        undefined,
        edgePagination,
      );
    });
  });
});
