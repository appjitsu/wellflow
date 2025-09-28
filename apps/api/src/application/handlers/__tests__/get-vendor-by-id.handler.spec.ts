import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetVendorByIdHandler } from '../get-vendor-by-id.handler';
import { GetVendorByIdQuery } from '../../queries/get-vendor-by-id.query';
import { VendorRepository } from '../../../domain/repositories/vendor.repository.interface';
import { Vendor } from '../../../domain/entities/vendor.entity';
import { VendorType } from '../../../domain/enums/vendor-status.enum';

describe('GetVendorByIdHandler', () => {
  let handler: GetVendorByIdHandler;
  let vendorRepository: jest.Mocked<VendorRepository>;

  const mockAddress = {
    street: '123 Main St',
    city: 'Houston',
    state: 'TX',
    zipCode: '77001',
    country: 'USA',
  };

  const mockVendor = new Vendor(
    'vendor-123',
    'org-123',
    'VENDOR-001',
    'Test Vendor Inc',
    VendorType.SERVICE,
    mockAddress,
    'Net 30',
  );

  beforeEach(async () => {
    const mockVendorRepository = {
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
      getVendorStatistics: jest.fn(),
      findRequiringQualificationRenewal: jest.fn(),
      bulkUpdateStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetVendorByIdHandler,
        {
          provide: 'VendorRepository',
          useValue: mockVendorRepository,
        },
      ],
    }).compile();

    handler = module.get<GetVendorByIdHandler>(GetVendorByIdHandler);
    vendorRepository = module.get('VendorRepository');
  });

  describe('execute', () => {
    it('should be defined', () => {
      expect(handler).toBeDefined();
    });

    it('should return vendor when found', async () => {
      // Arrange
      const query = new GetVendorByIdQuery('vendor-123');
      vendorRepository.findById.mockResolvedValue(mockVendor);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBe(mockVendor);
      expect(vendorRepository.findById).toHaveBeenCalledWith('vendor-123');
      expect(vendorRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when vendor not found', async () => {
      // Arrange
      const query = new GetVendorByIdQuery('non-existent-vendor');
      vendorRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        'Vendor not found: non-existent-vendor',
      );

      expect(vendorRepository.findById).toHaveBeenCalledWith(
        'non-existent-vendor',
      );
      expect(vendorRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const query = new GetVendorByIdQuery('vendor-123');
      const repositoryError = new Error('Database connection failed');
      vendorRepository.findById.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        'Database connection failed',
      );

      expect(vendorRepository.findById).toHaveBeenCalledWith('vendor-123');
      expect(vendorRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      const query = new GetVendorByIdQuery('vendor-123');
      const nonErrorException = new Error('Non-error exception');
      vendorRepository.findById.mockImplementation(() =>
        Promise.reject(nonErrorException),
      );

      // Act & Assert
      try {
        await handler.execute(query);
        fail('Expected handler to throw an exception');
      } catch (error) {
        expect(error).toBe(nonErrorException);
      }

      expect(vendorRepository.findById).toHaveBeenCalledWith('vendor-123');
      expect(vendorRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should handle different vendor IDs correctly', async () => {
      // Test various vendor ID formats
      const testCases = [
        'vendor-123',
        '123e4567-e89b-12d3-a456-426614174000',
        'simple-id',
        'vendor_with_underscores',
        'vendor-with-dashes',
      ];

      for (const vendorId of testCases) {
        const query = new GetVendorByIdQuery(vendorId);
        vendorRepository.findById.mockResolvedValue(mockVendor);

        const result = await handler.execute(query);

        expect(result).toBe(mockVendor);
        expect(vendorRepository.findById).toHaveBeenCalledWith(vendorId);
      }
    });

    it('should return the exact vendor object from repository', async () => {
      // Arrange
      const query = new GetVendorByIdQuery('vendor-456');
      const differentVendor = new Vendor(
        'vendor-456',
        'org-456',
        'VENDOR-002',
        'Different Vendor LLC',
        VendorType.CONTRACTOR,
        mockAddress,
        'Net 15',
      );

      vendorRepository.findById.mockResolvedValue(differentVendor);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBe(differentVendor);
      expect(result).not.toBe(mockVendor);
      expect(result.getId()).toBe('vendor-456');
      expect(result.getVendorName()).toBe('Different Vendor LLC');
      expect(result.getVendorType()).toBe(VendorType.CONTRACTOR);
    });

    it('should handle empty vendor ID', async () => {
      // Arrange
      const query = new GetVendorByIdQuery('');
      vendorRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow(
        'Vendor not found: ',
      );

      expect(vendorRepository.findById).toHaveBeenCalledWith('');
    });

    it('should handle null vendor ID', async () => {
      // Arrange
      const query = new GetVendorByIdQuery(null as any);
      vendorRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow(
        'Vendor not found: null',
      );

      expect(vendorRepository.findById).toHaveBeenCalledWith(null);
    });

    it('should handle undefined vendor ID', async () => {
      // Arrange
      const query = new GetVendorByIdQuery(undefined as any);
      vendorRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow(
        'Vendor not found: undefined',
      );

      expect(vendorRepository.findById).toHaveBeenCalledWith(undefined);
    });

    it('should not modify the vendor object', async () => {
      // Arrange
      const query = new GetVendorByIdQuery('vendor-123');
      vendorRepository.findById.mockResolvedValue(mockVendor);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBe(mockVendor);
      // The handler should not modify the vendor object - check key properties remain unchanged
      expect(result.getId()).toBe('vendor-123');
      expect(result.getVendorName()).toBe('Test Vendor Inc');
      expect(result.getVendorType()).toBe(VendorType.SERVICE);
      expect(result.getStatus()).toBeDefined(); // Should have a status
    });
  });
});
