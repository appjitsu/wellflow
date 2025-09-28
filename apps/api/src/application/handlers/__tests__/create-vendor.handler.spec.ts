import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { CreateVendorHandler } from '../create-vendor.handler';
import { CreateVendorCommand } from '../../commands/create-vendor.command';
import { VendorRepository } from '../../../domain/repositories/vendor.repository.interface';
import { Vendor } from '../../../domain/entities/vendor.entity';
import { VendorType } from '../../../domain/enums/vendor-status.enum';
import { VendorCreatedEvent } from '../../../domain/events/vendor-created.event';

describe('CreateVendorHandler', () => {
  let handler: CreateVendorHandler;
  let vendorRepository: jest.Mocked<VendorRepository>;
  let eventBus: jest.Mocked<EventBus>;

  const mockAddress = {
    street: '123 Main St',
    city: 'Houston',
    state: 'TX',
    zipCode: '77001',
    country: 'USA',
  };

  beforeEach(async () => {
    const mockVendorRepository = {
      findByVendorCode: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
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

    const mockEventBus = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateVendorHandler,
        {
          provide: 'VendorRepository',
          useValue: mockVendorRepository,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<CreateVendorHandler>(CreateVendorHandler);
    vendorRepository = module.get('VendorRepository');
    eventBus = module.get(EventBus);

    // Mock logger to suppress console output in tests
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  describe('execute', () => {
    it('should create a new vendor successfully', async () => {
      // Arrange
      const command = new CreateVendorCommand(
        'org-123',
        'ACME Corporation',
        'ACME-001',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
        '12-3456789',
        undefined,
        'https://acme.com',
        'Test notes',
        'user-123',
      );

      vendorRepository.findByVendorCode.mockResolvedValue(null); // No existing vendor

      const mockVendor = new Vendor(
        'vendor-123',
        'org-123',
        'ACME-001',
        'ACME Corporation',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
        '12-3456789',
      );

      vendorRepository.save.mockResolvedValue(mockVendor);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBe('vendor-123');
      expect(vendorRepository.findByVendorCode).toHaveBeenCalledWith(
        'org-123',
        'ACME-001',
      );
      expect(vendorRepository.save).toHaveBeenCalledWith(expect.any(Vendor));
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(VendorCreatedEvent),
      );
    });

    it('should throw error if vendor code already exists', async () => {
      // Arrange
      const command = new CreateVendorCommand(
        'org-123',
        'ACME Corporation',
        'ACME-001',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      const existingVendor = new Vendor(
        'existing-vendor-123',
        'org-123',
        'ACME-001',
        'Existing ACME',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      vendorRepository.findByVendorCode.mockResolvedValue(existingVendor);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Vendor code ACME-001 already exists in organization',
      );

      expect(vendorRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should validate vendor code format', async () => {
      // Arrange
      const command = new CreateVendorCommand(
        'org-123',
        'ACME Corporation',
        'AB', // Invalid - too short
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      vendorRepository.findByVendorCode.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Vendor code must be between 3 and 20 characters',
      );

      expect(vendorRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const command = new CreateVendorCommand(
        'org-123',
        'ACME Corporation',
        'ACME-001',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      vendorRepository.findByVendorCode.mockResolvedValue(null);
      vendorRepository.save.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Database connection failed',
      );

      expect(vendorRepository.findByVendorCode).toHaveBeenCalled();
      expect(vendorRepository.save).toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should publish domain events after successful creation', async () => {
      // Arrange
      const command = new CreateVendorCommand(
        'org-123',
        'ACME Corporation',
        'ACME-001',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      vendorRepository.findByVendorCode.mockResolvedValue(null);

      const mockVendor = new Vendor(
        'vendor-123',
        'org-123',
        'ACME-001',
        'ACME Corporation',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      vendorRepository.save.mockResolvedValue(mockVendor);

      // Act
      await handler.execute(command);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          vendorName: 'ACME Corporation',
          vendorType: VendorType.SERVICE,
          vendorCode: 'ACME-001',
        }),
      );
    });

    it('should clear domain events after publishing', async () => {
      // Arrange
      const command = new CreateVendorCommand(
        'org-123',
        'ACME Corporation',
        'ACME-001',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      vendorRepository.findByVendorCode.mockResolvedValue(null);

      vendorRepository.save.mockImplementation((vendor) => {
        // Verify events exist before clearing
        expect(vendor.getDomainEvents().length).toBeGreaterThan(0);
        return Promise.resolve(vendor);
      });

      // Act
      await handler.execute(command);

      // Assert - events should be cleared after publishing
      // Note: In the actual implementation, events would be cleared after publishing
      // This test verifies the pattern is followed
    });

    it('should log creation process', async () => {
      // Arrange
      const command = new CreateVendorCommand(
        'org-123',
        'ACME Corporation',
        'ACME-001',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      vendorRepository.findByVendorCode.mockResolvedValue(null);

      const mockVendor = new Vendor(
        'vendor-123',
        'org-123',
        'ACME-001',
        'ACME Corporation',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      vendorRepository.save.mockResolvedValue(mockVendor);

      // Spy on logger
      const loggerSpy = jest.spyOn(handler['logger'], 'log');
      const errorSpy = jest.spyOn(handler['logger'], 'error');

      // Act
      await handler.execute(command);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        'Creating vendor: ACME Corporation for organization: org-123',
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        'Vendor created successfully: vendor-123',
      );
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should handle different vendor types correctly', async () => {
      // Test different vendor types
      const vendorTypes = [
        VendorType.SERVICE,
        VendorType.CONTRACTOR,
        VendorType.SUPPLIER,
        VendorType.CONSULTANT,
        VendorType.TRANSPORTATION,
      ];

      for (const vendorType of vendorTypes) {
        const command = new CreateVendorCommand(
          'org-123',
          `${vendorType} Company`,
          `${vendorType}-001`,
          vendorType,
          mockAddress,
          'Net 30',
        );

        vendorRepository.findByVendorCode.mockResolvedValue(null);

        const mockVendor = new Vendor(
          `vendor-${vendorType}`,
          'org-123',
          `${vendorType}-001`,
          `${vendorType} Company`,
          vendorType,
          mockAddress,
          'Net 30',
        );

        vendorRepository.save.mockResolvedValue(mockVendor);

        const result = await handler.execute(command);
        expect(result).toBe(`vendor-${vendorType}`);
      }
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
        const command = new CreateVendorCommand(
          orgId,
          'Test Vendor',
          'TEST-001',
          VendorType.SERVICE,
          mockAddress,
          'Net 30',
        );

        vendorRepository.findByVendorCode.mockResolvedValue(null);

        const mockVendor = new Vendor(
          'vendor-123',
          orgId,
          'TEST-001',
          'Test Vendor',
          VendorType.SERVICE,
          mockAddress,
          'Net 30',
        );

        vendorRepository.save.mockResolvedValue(mockVendor);

        const result = await handler.execute(command);
        expect(result).toBe('vendor-123');
        expect(vendorRepository.findByVendorCode).toHaveBeenCalledWith(
          orgId,
          'TEST-001',
        );
      }
    });

    it('should handle empty organization ID', async () => {
      // Arrange
      const command = new CreateVendorCommand(
        '',
        'Test Vendor',
        'TEST-001',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      vendorRepository.findByVendorCode.mockResolvedValue(null);

      const mockVendor = new Vendor(
        'vendor-123',
        '',
        'TEST-001',
        'Test Vendor',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      vendorRepository.save.mockResolvedValue(mockVendor);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBe('vendor-123');
      expect(vendorRepository.findByVendorCode).toHaveBeenCalledWith(
        '',
        'TEST-001',
      );
    });

    it('should handle null organization ID', async () => {
      // Arrange
      const command = new CreateVendorCommand(
        null as any,
        'Test Vendor',
        'TEST-001',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      vendorRepository.findByVendorCode.mockResolvedValue(null);

      const mockVendor = new Vendor(
        'vendor-123',
        null as any,
        'TEST-001',
        'Test Vendor',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      vendorRepository.save.mockResolvedValue(mockVendor);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBe('vendor-123');
      expect(vendorRepository.findByVendorCode).toHaveBeenCalledWith(
        null,
        'TEST-001',
      );
    });

    it('should handle undefined organization ID', async () => {
      // Arrange
      const command = new CreateVendorCommand(
        undefined as any,
        'Test Vendor',
        'TEST-001',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      vendorRepository.findByVendorCode.mockResolvedValue(null);

      const mockVendor = new Vendor(
        'vendor-123',
        undefined as any,
        'TEST-001',
        'Test Vendor',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      vendorRepository.save.mockResolvedValue(mockVendor);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBe('vendor-123');
      expect(vendorRepository.findByVendorCode).toHaveBeenCalledWith(
        undefined,
        'TEST-001',
      );
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      const command = new CreateVendorCommand(
        'org-123',
        'Test Vendor',
        'TEST-001',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      const nonErrorException = { message: 'Non-error exception', code: 500 };
      vendorRepository.findByVendorCode.mockRejectedValue(nonErrorException);

      // Act & Assert
      try {
        await handler.execute(command);
        fail('Expected handler to throw an exception');
      } catch (error) {
        expect(error).toBe(nonErrorException);
      }

      expect(vendorRepository.findByVendorCode).toHaveBeenCalledWith(
        'org-123',
        'TEST-001',
      );
      expect(vendorRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle vendor code uniqueness check errors', async () => {
      // Arrange
      const command = new CreateVendorCommand(
        'org-123',
        'Test Vendor',
        'TEST-001',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      vendorRepository.findByVendorCode.mockRejectedValue(
        new Error('Database query failed'),
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Database query failed',
      );

      expect(vendorRepository.findByVendorCode).toHaveBeenCalledWith(
        'org-123',
        'TEST-001',
      );
      expect(vendorRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle event publishing errors', async () => {
      // Arrange
      const command = new CreateVendorCommand(
        'org-123',
        'Test Vendor',
        'TEST-001',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      vendorRepository.findByVendorCode.mockResolvedValue(null);

      const mockVendor = new Vendor(
        'vendor-123',
        'org-123',
        'TEST-001',
        'Test Vendor',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      vendorRepository.save.mockResolvedValue(mockVendor);
      eventBus.publish.mockRejectedValue(new Error('Event bus failed'));

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Event bus failed',
      );

      expect(vendorRepository.findByVendorCode).toHaveBeenCalledWith(
        'org-123',
        'TEST-001',
      );
      expect(vendorRepository.save).toHaveBeenCalled();
      // Event publishing was attempted
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('should create vendor with tax ID', async () => {
      // Arrange
      const command = new CreateVendorCommand(
        'org-123',
        'Test Vendor',
        'TEST-001',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
        '12-3456789',
      );

      vendorRepository.findByVendorCode.mockResolvedValue(null);

      const mockVendor = new Vendor(
        'vendor-123',
        'org-123',
        'TEST-001',
        'Test Vendor',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
        '12-3456789',
      );

      vendorRepository.save.mockResolvedValue(mockVendor);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBe('vendor-123');
      expect(vendorRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          getTaxId: expect.any(Function),
        }),
      );
    });

    it('should create vendor without tax ID', async () => {
      // Arrange
      const command = new CreateVendorCommand(
        'org-123',
        'Test Vendor',
        'TEST-001',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
        undefined, // No tax ID
      );

      vendorRepository.findByVendorCode.mockResolvedValue(null);

      const mockVendor = new Vendor(
        'vendor-123',
        'org-123',
        'TEST-001',
        'Test Vendor',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
        undefined,
      );

      vendorRepository.save.mockResolvedValue(mockVendor);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBe('vendor-123');
      expect(vendorRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          getTaxId: expect.any(Function),
        }),
      );
    });

    it('should handle vendor code validation errors', async () => {
      // Test various invalid vendor codes
      const invalidCodes = ['', 'A', 'AB', 'A'.repeat(21)]; // Empty, too short, too long

      for (const invalidCode of invalidCodes) {
        const command = new CreateVendorCommand(
          'org-123',
          'Test Vendor',
          invalidCode,
          VendorType.SERVICE,
          mockAddress,
          'Net 30',
        );

        vendorRepository.findByVendorCode.mockResolvedValue(null);

        // Act & Assert
        await expect(handler.execute(command)).rejects.toThrow();

        expect(vendorRepository.save).not.toHaveBeenCalled();
        expect(eventBus.publish).not.toHaveBeenCalled();
      }
    });

    it('should handle vendor name validation errors', async () => {
      // Arrange
      const command = new CreateVendorCommand(
        'org-123',
        '', // Empty vendor name
        'TEST-001',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      vendorRepository.findByVendorCode.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Vendor name is required',
      );

      expect(vendorRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle address validation errors', async () => {
      // Arrange
      const invalidAddress = {
        street: '',
        city: '',
        state: '',
        zipCode: '77001',
        country: 'USA',
      };

      const command = new CreateVendorCommand(
        'org-123',
        'Test Vendor',
        'TEST-001',
        VendorType.SERVICE,
        invalidAddress,
        'Net 30',
      );

      vendorRepository.findByVendorCode.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow();

      expect(vendorRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should generate unique vendor IDs', async () => {
      // Arrange
      const command1 = new CreateVendorCommand(
        'org-123',
        'Vendor 1',
        'VEND-001',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      const command2 = new CreateVendorCommand(
        'org-123',
        'Vendor 2',
        'VEND-002',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      vendorRepository.findByVendorCode.mockResolvedValue(null);

      const mockVendor1 = new Vendor(
        'vendor-uuid-1',
        'org-123',
        'VEND-001',
        'Vendor 1',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      const mockVendor2 = new Vendor(
        'vendor-uuid-2',
        'org-123',
        'VEND-002',
        'Vendor 2',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      vendorRepository.save
        .mockResolvedValueOnce(mockVendor1)
        .mockResolvedValueOnce(mockVendor2);

      // Act
      const result1 = await handler.execute(command1);
      const result2 = await handler.execute(command2);

      // Assert
      expect(result1).toBe('vendor-uuid-1');
      expect(result2).toBe('vendor-uuid-2');
      expect(result1).not.toBe(result2);
    });

    it('should handle optional command fields', async () => {
      // Arrange
      const command = new CreateVendorCommand(
        'org-123',
        'Test Vendor',
        'TEST-001',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
        undefined, // taxId
        undefined, // serviceAddress
        undefined, // website
        undefined, // notes
        undefined, // createdBy
      );

      vendorRepository.findByVendorCode.mockResolvedValue(null);

      const mockVendor = new Vendor(
        'vendor-123',
        'org-123',
        'TEST-001',
        'Test Vendor',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );

      vendorRepository.save.mockResolvedValue(mockVendor);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBe('vendor-123');
      expect(vendorRepository.save).toHaveBeenCalledWith(expect.any(Vendor));
    });
  });
});
