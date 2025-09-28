import { Test, TestingModule } from '@nestjs/testing';
import { GetVendorStatisticsHandler } from '../get-vendor-statistics.handler';
import { GetVendorStatisticsQuery } from '../../queries/get-vendor-statistics.query';
import {
  VendorRepository,
  VendorStatistics,
} from '../../../domain/repositories/vendor.repository.interface';
import {
  VendorType,
  VendorRating,
} from '../../../domain/enums/vendor-status.enum';

describe('GetVendorStatisticsHandler', () => {
  let handler: GetVendorStatisticsHandler;
  let vendorRepository: jest.Mocked<VendorRepository>;

  const mockVendorStatistics: VendorStatistics = {
    totalVendors: 150,
    activeVendors: 120,
    pendingApproval: 15,
    suspendedVendors: 10,
    vendorsByType: {
      [VendorType.SERVICE]: 45,
      [VendorType.CONTRACTOR]: 35,
      [VendorType.SUPPLIER]: 40,
      [VendorType.TRANSPORTATION]: 15,
      [VendorType.MAINTENANCE]: 10,
      [VendorType.ENVIRONMENTAL]: 5,
      [VendorType.CONSULTANT]: 0,
      [VendorType.LABORATORY]: 0,
    },
    vendorsByRating: {
      [VendorRating.EXCELLENT]: 30,
      [VendorRating.GOOD]: 50,
      [VendorRating.SATISFACTORY]: 40,
      [VendorRating.POOR]: 20,
      [VendorRating.UNACCEPTABLE]: 10,
      [VendorRating.NOT_RATED]: 0,
    },
    expiringInsurance: 8,
    expiringCertifications: 12,
    averagePerformanceRating: 3.2,
    recentlyAdded: 5,
    qualifiedVendors: 110,
  };

  beforeEach(async () => {
    const mockVendorRepository = {
      getVendorStatistics: jest.fn(),
      findById: jest.fn(),
      findByVendorCode: jest.fn(),
      save: jest.fn(),
      findByOrganization: jest.fn(),
      findByStatus: jest.fn(),
      findByType: jest.fn(),
      findWithExpiringInsurance: jest.fn(),
      findWithExpiringCertifications: jest.fn(),
      findByPerformanceRating: jest.fn(),
      search: jest.fn(),
      existsByVendorCode: jest.fn(),
      delete: jest.fn(),
      findRequiringQualificationRenewal: jest.fn(),
      bulkUpdateStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetVendorStatisticsHandler,
        {
          provide: 'VendorRepository',
          useValue: mockVendorRepository,
        },
      ],
    }).compile();

    handler = module.get<GetVendorStatisticsHandler>(
      GetVendorStatisticsHandler,
    );
    vendorRepository = module.get('VendorRepository');
  });

  describe('execute', () => {
    it('should be defined', () => {
      expect(handler).toBeDefined();
    });

    it('should return vendor statistics when repository succeeds', async () => {
      // Arrange
      const query = new GetVendorStatisticsQuery('org-123');
      vendorRepository.getVendorStatistics.mockResolvedValue(
        mockVendorStatistics,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBe(mockVendorStatistics);
      expect(vendorRepository.getVendorStatistics).toHaveBeenCalledWith(
        'org-123',
      );
      expect(vendorRepository.getVendorStatistics).toHaveBeenCalledTimes(1);
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const query = new GetVendorStatisticsQuery('org-123');
      const repositoryError = new Error('Database connection failed');
      vendorRepository.getVendorStatistics.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        'Database connection failed',
      );

      expect(vendorRepository.getVendorStatistics).toHaveBeenCalledWith(
        'org-123',
      );
      expect(vendorRepository.getVendorStatistics).toHaveBeenCalledTimes(1);
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      const query = new GetVendorStatisticsQuery('org-123');
      const nonErrorException = new Error('Non-error exception');
      vendorRepository.getVendorStatistics.mockImplementation(() =>
        Promise.reject(nonErrorException),
      );

      // Act & Assert
      try {
        await handler.execute(query);
        fail('Expected handler to throw an exception');
      } catch (error) {
        expect(error).toBe(nonErrorException);
      }

      expect(vendorRepository.getVendorStatistics).toHaveBeenCalledWith(
        'org-123',
      );
      expect(vendorRepository.getVendorStatistics).toHaveBeenCalledTimes(1);
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
        const query = new GetVendorStatisticsQuery(orgId);
        vendorRepository.getVendorStatistics.mockResolvedValue(
          mockVendorStatistics,
        );

        const result = await handler.execute(query);

        expect(result).toBe(mockVendorStatistics);
        expect(vendorRepository.getVendorStatistics).toHaveBeenCalledWith(
          orgId,
        );
      }
    });

    it('should return the exact statistics object from repository', async () => {
      // Arrange
      const query = new GetVendorStatisticsQuery('org-456');
      const differentStatistics: VendorStatistics = {
        ...mockVendorStatistics,
        totalVendors: 200,
        activeVendors: 180,
        averagePerformanceRating: 4.1,
      };

      vendorRepository.getVendorStatistics.mockResolvedValue(
        differentStatistics,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBe(differentStatistics);
      expect(result).not.toBe(mockVendorStatistics);
      expect(result.totalVendors).toBe(200);
      expect(result.activeVendors).toBe(180);
      expect(result.averagePerformanceRating).toBe(4.1);
    });

    it('should handle empty organization ID', async () => {
      // Arrange
      const query = new GetVendorStatisticsQuery('');
      vendorRepository.getVendorStatistics.mockResolvedValue(
        mockVendorStatistics,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBe(mockVendorStatistics);
      expect(vendorRepository.getVendorStatistics).toHaveBeenCalledWith('');
    });

    it('should handle null organization ID', async () => {
      // Arrange
      const query = new GetVendorStatisticsQuery(null as any);
      vendorRepository.getVendorStatistics.mockResolvedValue(
        mockVendorStatistics,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBe(mockVendorStatistics);
      expect(vendorRepository.getVendorStatistics).toHaveBeenCalledWith(null);
    });

    it('should handle undefined organization ID', async () => {
      // Arrange
      const query = new GetVendorStatisticsQuery(undefined as any);
      vendorRepository.getVendorStatistics.mockResolvedValue(
        mockVendorStatistics,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBe(mockVendorStatistics);
      expect(vendorRepository.getVendorStatistics).toHaveBeenCalledWith(
        undefined,
      );
    });

    it('should return statistics with all expected properties', async () => {
      // Arrange
      const query = new GetVendorStatisticsQuery('org-123');
      vendorRepository.getVendorStatistics.mockResolvedValue(
        mockVendorStatistics,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          totalVendors: expect.any(Number),
          activeVendors: expect.any(Number),
          pendingApproval: expect.any(Number),
          suspendedVendors: expect.any(Number),
          vendorsByType: expect.any(Object),
          vendorsByRating: expect.any(Object),
          expiringInsurance: expect.any(Number),
          expiringCertifications: expect.any(Number),
          averagePerformanceRating: expect.any(Number),
          recentlyAdded: expect.any(Number),
          qualifiedVendors: expect.any(Number),
        }),
      );
    });

    it('should handle statistics with zero values', async () => {
      // Arrange
      const query = new GetVendorStatisticsQuery('org-123');
      const zeroStatistics: VendorStatistics = {
        totalVendors: 0,
        activeVendors: 0,
        pendingApproval: 0,
        suspendedVendors: 0,
        vendorsByType: {
          [VendorType.SERVICE]: 0,
          [VendorType.CONTRACTOR]: 0,
          [VendorType.SUPPLIER]: 0,
          [VendorType.TRANSPORTATION]: 0,
          [VendorType.MAINTENANCE]: 0,
          [VendorType.ENVIRONMENTAL]: 0,
          [VendorType.CONSULTANT]: 0,
          [VendorType.LABORATORY]: 0,
        },
        vendorsByRating: {
          [VendorRating.EXCELLENT]: 0,
          [VendorRating.GOOD]: 0,
          [VendorRating.SATISFACTORY]: 0,
          [VendorRating.POOR]: 0,
          [VendorRating.UNACCEPTABLE]: 0,
          [VendorRating.NOT_RATED]: 0,
        },
        expiringInsurance: 0,
        expiringCertifications: 0,
        averagePerformanceRating: 0,
        recentlyAdded: 0,
        qualifiedVendors: 0,
      };

      vendorRepository.getVendorStatistics.mockResolvedValue(zeroStatistics);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.totalVendors).toBe(0);
      expect(result.activeVendors).toBe(0);
      expect(result.averagePerformanceRating).toBe(0);
    });
  });
});
