import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { AddVendorCertificationHandler } from '../add-vendor-certification.handler';
import { AddVendorCertificationCommand } from '../../commands/add-vendor-certification.command';
import { VendorRepository } from '../../../domain/repositories/vendor.repository.interface';

// Mock randomUUID
jest.mock('crypto', () => ({
  randomUUID: jest.fn(),
}));
const mockRandomUUID = require('crypto').randomUUID;

describe('AddVendorCertificationHandler', () => {
  let handler: AddVendorCertificationHandler;
  let vendorRepository: jest.Mocked<VendorRepository>;
  let eventBus: jest.Mocked<EventBus>;

  const mockVendor = {
    addCertification: jest.fn(),
    getDomainEvents: jest.fn(),
    clearDomainEvents: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset mock vendor methods
    mockVendor.addCertification.mockReset();
    mockVendor.getDomainEvents.mockReset();
    mockVendor.clearDomainEvents.mockReset();

    mockRandomUUID.mockReturnValue('cert-123');

    const mockVendorRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      findByVendorCode: jest.fn(),
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
        AddVendorCertificationHandler,
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

    handler = module.get<AddVendorCertificationHandler>(
      AddVendorCertificationHandler,
    );
    vendorRepository = module.get('VendorRepository');
    eventBus = module.get(EventBus);
  });

  describe('execute', () => {
    const validCommand = new AddVendorCertificationCommand(
      'vendor-123',
      'OSHA Safety Certification',
      'OSHA',
      'CERT-2023-001',
      new Date('2023-01-01'),
      new Date('2026-01-01'),
      '/documents/cert.pdf',
      'user-456',
    );

    it('should successfully add certification to vendor', async () => {
      // Arrange
      const mockEvents = [{ type: 'CertificationAddedEvent' }];
      vendorRepository.findById.mockResolvedValue(mockVendor as any);
      mockVendor.getDomainEvents.mockReturnValue(mockEvents);

      // Act
      await handler.execute(validCommand);

      // Assert
      expect(vendorRepository.findById).toHaveBeenCalledWith('vendor-123');
      expect(mockVendor.addCertification).toHaveBeenCalledWith({
        id: 'cert-123',
        name: 'OSHA Safety Certification',
        issuingBody: 'OSHA',
        certificationNumber: 'CERT-2023-001',
        issueDate: new Date('2023-01-01'),
        expirationDate: new Date('2026-01-01'),
        isActive: true,
      });
      expect(vendorRepository.save).toHaveBeenCalledWith(mockVendor);
      expect(eventBus.publish).toHaveBeenCalledWith(mockEvents[0]);
      expect(mockVendor.clearDomainEvents).toHaveBeenCalled();
    });

    it('should throw NotFoundException when vendor not found', async () => {
      // Arrange
      vendorRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        NotFoundException,
      );
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Vendor with ID vendor-123 not found',
      );

      expect(vendorRepository.findById).toHaveBeenCalledWith('vendor-123');
      expect(mockVendor.addCertification).not.toHaveBeenCalled();
      expect(vendorRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle repository findById errors', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      vendorRepository.findById.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Database connection failed',
      );

      expect(vendorRepository.findById).toHaveBeenCalledWith('vendor-123');
      expect(mockVendor.addCertification).not.toHaveBeenCalled();
      expect(vendorRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle repository save errors', async () => {
      // Arrange
      vendorRepository.findById.mockResolvedValue(mockVendor as any);
      mockVendor.getDomainEvents.mockReturnValue([]);
      const saveError = new Error('Save failed');
      vendorRepository.save.mockRejectedValue(saveError);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Save failed',
      );

      expect(vendorRepository.findById).toHaveBeenCalledWith('vendor-123');
      expect(mockVendor.addCertification).toHaveBeenCalled();
      expect(vendorRepository.save).toHaveBeenCalledWith(mockVendor);
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should publish all domain events', async () => {
      // Arrange
      const mockEvents = [
        { type: 'CertificationAddedEvent', certificationId: 'cert-123' },
        { type: 'VendorUpdatedEvent', vendorId: 'vendor-123' },
      ];
      vendorRepository.findById.mockResolvedValue(mockVendor as any);
      mockVendor.getDomainEvents.mockReturnValue(mockEvents);

      // Act
      await handler.execute(validCommand);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledTimes(2);
      expect(eventBus.publish).toHaveBeenCalledWith(mockEvents[0]);
      expect(eventBus.publish).toHaveBeenCalledWith(mockEvents[1]);
      expect(mockVendor.clearDomainEvents).toHaveBeenCalled();
    });

    it('should handle vendor with no domain events', async () => {
      // Arrange
      vendorRepository.findById.mockResolvedValue(mockVendor as any);
      mockVendor.getDomainEvents.mockReturnValue([]);

      // Act
      await handler.execute(validCommand);

      // Assert
      expect(eventBus.publish).not.toHaveBeenCalled();
      expect(mockVendor.clearDomainEvents).toHaveBeenCalled();
    });

    it('should handle event publishing errors', async () => {
      // Arrange
      const mockEvents = [{ type: 'CertificationAddedEvent' }];
      vendorRepository.findById.mockResolvedValue(mockVendor as any);
      mockVendor.getDomainEvents.mockReturnValue(mockEvents);
      const eventError = new Error('Event bus failed');
      eventBus.publish.mockRejectedValue(eventError);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Event bus failed',
      );

      expect(vendorRepository.findById).toHaveBeenCalledWith('vendor-123');
      expect(mockVendor.addCertification).toHaveBeenCalled();
      expect(vendorRepository.save).toHaveBeenCalledWith(mockVendor);
      expect(eventBus.publish).toHaveBeenCalledWith(mockEvents[0]);
    });

    it('should create certification with minimal required fields', async () => {
      // Arrange
      const minimalCommand = new AddVendorCertificationCommand(
        'vendor-123',
        'Basic Certification',
        'Issuing Body',
        'CERT-001',
        new Date('2023-01-01'),
        new Date('2024-01-01'),
      );

      vendorRepository.findById.mockResolvedValue(mockVendor as any);
      mockVendor.getDomainEvents.mockReturnValue([]);

      // Act
      await handler.execute(minimalCommand);

      // Assert
      expect(mockVendor.addCertification).toHaveBeenCalledWith({
        id: 'cert-123',
        name: 'Basic Certification',
        issuingBody: 'Issuing Body',
        certificationNumber: 'CERT-001',
        issueDate: new Date('2023-01-01'),
        expirationDate: new Date('2024-01-01'),
        isActive: true,
      });
    });

    it('should create certification with all optional fields', async () => {
      // Arrange
      const fullCommand = new AddVendorCertificationCommand(
        'vendor-123',
        'Complete Certification',
        'Professional Body',
        'CERT-2023-002',
        new Date('2023-06-01'),
        new Date('2025-06-01'),
        '/path/to/document.pdf',
        'admin-user',
      );

      vendorRepository.findById.mockResolvedValue(mockVendor as any);
      mockVendor.getDomainEvents.mockReturnValue([]);

      // Act
      await handler.execute(fullCommand);

      // Assert
      expect(mockVendor.addCertification).toHaveBeenCalledWith({
        id: 'cert-123',
        name: 'Complete Certification',
        issuingBody: 'Professional Body',
        certificationNumber: 'CERT-2023-002',
        issueDate: new Date('2023-06-01'),
        expirationDate: new Date('2025-06-01'),
        isActive: true,
      });
    });

    it('should generate unique certification IDs', async () => {
      // Arrange
      const command1 = new AddVendorCertificationCommand(
        'vendor-123',
        'Cert 1',
        'Body 1',
        'CERT-001',
        new Date('2023-01-01'),
        new Date('2024-01-01'),
      );

      const command2 = new AddVendorCertificationCommand(
        'vendor-456',
        'Cert 2',
        'Body 2',
        'CERT-002',
        new Date('2023-02-01'),
        new Date('2024-02-01'),
      );

      const mockVendor2 = {
        addCertification: jest.fn(),
        getDomainEvents: jest.fn().mockReturnValue([]),
        clearDomainEvents: jest.fn(),
      };

      mockVendor.getDomainEvents.mockReturnValue([]);

      vendorRepository.findById
        .mockResolvedValueOnce(mockVendor as any)
        .mockResolvedValueOnce(mockVendor2 as any);

      mockRandomUUID
        .mockReturnValueOnce('cert-123')
        .mockReturnValueOnce('cert-456');

      // Act
      await handler.execute(command1);
      await handler.execute(command2);

      // Assert
      expect(mockVendor.addCertification).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'cert-123' }),
      );
      expect(mockVendor2.addCertification).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'cert-456' }),
      );
    });

    it('should handle different vendor IDs', async () => {
      // Arrange
      const testCases = [
        'vendor-123',
        '123e4567-e89b-12d3-a456-426614174000',
        'simple-vendor',
        'vendor_with_underscores',
        'vendor-with-dashes',
      ];

      for (const vendorId of testCases) {
        const command = new AddVendorCertificationCommand(
          vendorId,
          'Test Certification',
          'Test Body',
          'CERT-TEST',
          new Date('2023-01-01'),
          new Date('2024-01-01'),
        );

        vendorRepository.findById.mockResolvedValue(mockVendor as any);
        mockVendor.getDomainEvents.mockReturnValue([]);

        await handler.execute(command);

        expect(vendorRepository.findById).toHaveBeenCalledWith(vendorId);
      }
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      vendorRepository.findById.mockResolvedValue(mockVendor as any);
      mockVendor.getDomainEvents.mockReturnValue([]);
      const nonErrorException = { message: 'Non-error exception', code: 500 };
      vendorRepository.save.mockRejectedValue(nonErrorException);

      // Act & Assert
      try {
        await handler.execute(validCommand);
        fail('Expected handler to throw an exception');
      } catch (error) {
        expect(error).toBe(nonErrorException);
      }

      expect(vendorRepository.findById).toHaveBeenCalledWith('vendor-123');
      expect(mockVendor.addCertification).toHaveBeenCalled();
      expect(vendorRepository.save).toHaveBeenCalledWith(mockVendor);
    });

    it('should handle vendor addCertification errors', async () => {
      // Arrange
      vendorRepository.findById.mockResolvedValue(mockVendor as any);
      const certError = new Error('Invalid certification data');
      mockVendor.addCertification.mockImplementation(() => {
        throw certError;
      });

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Invalid certification data',
      );

      expect(vendorRepository.findById).toHaveBeenCalledWith('vendor-123');
      expect(mockVendor.addCertification).toHaveBeenCalled();
      expect(vendorRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should create certification with past expiration date', async () => {
      // Arrange
      const expiredCommand = new AddVendorCertificationCommand(
        'vendor-123',
        'Expired Certification',
        'Body',
        'CERT-EXPIRED',
        new Date('2020-01-01'),
        new Date('2021-01-01'), // Past date
      );

      vendorRepository.findById.mockResolvedValue(mockVendor as any);
      mockVendor.getDomainEvents.mockReturnValue([]);

      // Act
      await handler.execute(expiredCommand);

      // Assert
      expect(mockVendor.addCertification).toHaveBeenCalledWith(
        expect.objectContaining({
          expirationDate: new Date('2021-01-01'),
          isActive: true, // Still active, just expired
        }),
      );
    });

    it('should create certification with future dates', async () => {
      // Arrange
      const futureCommand = new AddVendorCertificationCommand(
        'vendor-123',
        'Future Certification',
        'Body',
        'CERT-FUTURE',
        new Date('2025-01-01'), // Future issue
        new Date('2028-01-01'), // Future expiration
      );

      vendorRepository.findById.mockResolvedValue(mockVendor as any);
      mockVendor.getDomainEvents.mockReturnValue([]);

      // Act
      await handler.execute(futureCommand);

      // Assert
      expect(mockVendor.addCertification).toHaveBeenCalledWith(
        expect.objectContaining({
          issueDate: new Date('2025-01-01'),
          expirationDate: new Date('2028-01-01'),
          isActive: true,
        }),
      );
    });
  });
});
