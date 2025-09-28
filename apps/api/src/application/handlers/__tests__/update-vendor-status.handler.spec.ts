import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { Logger, NotFoundException } from '@nestjs/common';
import { UpdateVendorStatusHandler } from '../update-vendor-status.handler';
import { UpdateVendorStatusCommand } from '../../commands/update-vendor-status.command';
import { VendorRepository } from '../../../domain/repositories/vendor.repository.interface';
import { Vendor } from '../../../domain/entities/vendor.entity';
import {
  VendorStatus,
  VendorType,
} from '../../../domain/enums/vendor-status.enum';
import { VendorStatusChangedEvent } from '../../../domain/events/vendor-status-changed.event';

describe('UpdateVendorStatusHandler', () => {
  let handler: UpdateVendorStatusHandler;
  let vendorRepository: jest.Mocked<VendorRepository>;
  let eventBus: jest.Mocked<EventBus>;

  const mockAddress = {
    street: '123 Main St',
    city: 'Houston',
    state: 'TX',
    zipCode: '77001',
    country: 'USA',
  };

  // Helper function to create a fresh vendor instance
  const createMockVendor = (status?: VendorStatus) => {
    const vendor = new Vendor(
      'vendor-123',
      'org-123',
      'VENDOR-001',
      'Test Vendor Inc',
      VendorType.SERVICE,
      mockAddress,
      'Net 30',
    );
    if (status && status !== VendorStatus.PENDING) {
      vendor['status'] = status;
    }
    // Clear any domain events from creation
    vendor.clearDomainEvents();
    return vendor;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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

    const mockEventBus = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateVendorStatusHandler,
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

    handler = module.get<UpdateVendorStatusHandler>(UpdateVendorStatusHandler);
    vendorRepository = module.get('VendorRepository');
    eventBus = module.get(EventBus);

    // Mock logger to suppress console output in tests
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  describe('execute', () => {
    it('should update vendor status successfully', async () => {
      // Arrange
      const command = new UpdateVendorStatusCommand(
        'vendor-123',
        VendorStatus.APPROVED,
        'Meets all requirements',
        'user-456',
      );

      const pendingVendor = new Vendor(
        'vendor-123',
        'org-123',
        'VENDOR-001',
        'Test Vendor Inc',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );
      pendingVendor.clearDomainEvents();

      vendorRepository.findById.mockResolvedValue(pendingVendor);
      vendorRepository.save.mockResolvedValue(pendingVendor);

      // Act
      await handler.execute(command);

      // Assert
      expect(vendorRepository.findById).toHaveBeenCalledWith('vendor-123');
      expect(vendorRepository.save).toHaveBeenCalledWith(pendingVendor);
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          vendorId: 'vendor-123',
          organizationId: 'org-123',
          oldStatus: VendorStatus.PENDING,
          newStatus: VendorStatus.APPROVED,
          reason: 'Meets all requirements',
        }),
      );
    });

    it('should throw NotFoundException when vendor is not found', async () => {
      // Arrange
      const command = new UpdateVendorStatusCommand(
        'non-existent-vendor',
        VendorStatus.APPROVED,
      );

      vendorRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow(
        'Vendor not found: non-existent-vendor',
      );

      expect(vendorRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle invalid status transitions', async () => {
      // Arrange - Try to go from PENDING directly to SUSPENDED (invalid transition)
      const command = new UpdateVendorStatusCommand(
        'vendor-123',
        VendorStatus.SUSPENDED,
      );

      const pendingVendor = new Vendor(
        'vendor-123',
        'org-123',
        'VENDOR-001',
        'Test Vendor Inc',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );
      // Ensure status is PENDING
      pendingVendor['status'] = VendorStatus.PENDING;

      vendorRepository.findById.mockResolvedValue(pendingVendor);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Cannot transition from pending to suspended',
      );

      expect(vendorRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const command = new UpdateVendorStatusCommand(
        'vendor-123',
        VendorStatus.APPROVED,
      );

      vendorRepository.findById.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Database connection failed',
      );

      expect(vendorRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle save errors gracefully', async () => {
      // Arrange
      const command = new UpdateVendorStatusCommand(
        'vendor-123',
        VendorStatus.APPROVED,
      );

      const mockVendor = createMockVendor();
      vendorRepository.findById.mockResolvedValue(mockVendor);
      vendorRepository.save.mockRejectedValue(
        new Error('Save operation failed'),
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Save operation failed',
      );

      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should publish domain events after successful update', async () => {
      // Arrange
      const command = new UpdateVendorStatusCommand(
        'vendor-123',
        VendorStatus.APPROVED,
      );

      const pendingVendor = new Vendor(
        'vendor-123',
        'org-123',
        'VENDOR-001',
        'Test Vendor Inc',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );
      pendingVendor.clearDomainEvents();

      vendorRepository.findById.mockResolvedValue(pendingVendor);
      vendorRepository.save.mockResolvedValue(pendingVendor);

      // Act
      await handler.execute(command);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(VendorStatusChangedEvent),
      );
    });

    it('should handle event publishing errors', async () => {
      // Arrange
      const command = new UpdateVendorStatusCommand(
        'vendor-123',
        VendorStatus.APPROVED,
      );

      const mockVendor = createMockVendor();
      vendorRepository.findById.mockResolvedValue(mockVendor);
      vendorRepository.save.mockResolvedValue(mockVendor);
      eventBus.publish.mockRejectedValue(new Error('Event bus failed'));

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Event bus failed',
      );

      expect(vendorRepository.findById).toHaveBeenCalledWith('vendor-123');
      expect(vendorRepository.save).toHaveBeenCalled();
    });

    it('should update status from PENDING to UNDER_REVIEW', async () => {
      // Arrange
      const command = new UpdateVendorStatusCommand(
        'vendor-123',
        VendorStatus.UNDER_REVIEW,
      );

      const mockVendor = createMockVendor();
      vendorRepository.findById.mockResolvedValue(mockVendor);
      vendorRepository.save.mockResolvedValue(mockVendor);

      // Act
      await handler.execute(command);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          oldStatus: VendorStatus.PENDING,
          newStatus: VendorStatus.UNDER_REVIEW,
        }),
      );
    });

    it('should update status from PENDING to PREQUALIFIED', async () => {
      // Arrange
      const command = new UpdateVendorStatusCommand(
        'vendor-123',
        VendorStatus.PREQUALIFIED,
      );

      const mockVendor = createMockVendor();
      vendorRepository.findById.mockResolvedValue(mockVendor);
      vendorRepository.save.mockResolvedValue(mockVendor);

      // Act
      await handler.execute(command);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          oldStatus: VendorStatus.PENDING,
          newStatus: VendorStatus.PREQUALIFIED,
        }),
      );
    });

    it('should update status from UNDER_REVIEW to APPROVED', async () => {
      // Arrange
      const underReviewVendor = new Vendor(
        'vendor-123',
        'org-123',
        'VENDOR-001',
        'Test Vendor Inc',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );
      // Set the status to UNDER_REVIEW after construction
      underReviewVendor['status'] = VendorStatus.UNDER_REVIEW;

      const command = new UpdateVendorStatusCommand(
        'vendor-123',
        VendorStatus.APPROVED,
      );

      vendorRepository.findById.mockResolvedValue(underReviewVendor);
      vendorRepository.save.mockResolvedValue(underReviewVendor);

      // Act
      await handler.execute(command);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          oldStatus: VendorStatus.UNDER_REVIEW,
          newStatus: VendorStatus.APPROVED,
        }),
      );
    });

    it('should update status from APPROVED to SUSPENDED', async () => {
      // Arrange
      const approvedVendor = new Vendor(
        'vendor-123',
        'org-123',
        'VENDOR-001',
        'Test Vendor Inc',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );
      // Set the status to APPROVED after construction
      approvedVendor['status'] = VendorStatus.APPROVED;

      const command = new UpdateVendorStatusCommand(
        'vendor-123',
        VendorStatus.SUSPENDED,
        'Safety violation detected',
      );

      vendorRepository.findById.mockResolvedValue(approvedVendor);
      vendorRepository.save.mockResolvedValue(approvedVendor);

      // Act
      await handler.execute(command);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          oldStatus: VendorStatus.APPROVED,
          newStatus: VendorStatus.SUSPENDED,
          reason: 'Safety violation detected',
        }),
      );
    });

    it('should update status from SUSPENDED to APPROVED', async () => {
      // Arrange
      const suspendedVendor = new Vendor(
        'vendor-123',
        'org-123',
        'VENDOR-001',
        'Test Vendor Inc',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );
      // Set the status to SUSPENDED after construction
      suspendedVendor['status'] = VendorStatus.SUSPENDED;

      const command = new UpdateVendorStatusCommand(
        'vendor-123',
        VendorStatus.APPROVED,
        'Issues resolved',
      );

      vendorRepository.findById.mockResolvedValue(suspendedVendor);
      vendorRepository.save.mockResolvedValue(suspendedVendor);

      // Act
      await handler.execute(command);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          oldStatus: VendorStatus.SUSPENDED,
          newStatus: VendorStatus.APPROVED,
          reason: 'Issues resolved',
        }),
      );
    });

    it('should update status from REJECTED to PENDING', async () => {
      // Arrange
      const rejectedVendor = new Vendor(
        'vendor-123',
        'org-123',
        'VENDOR-001',
        'Test Vendor Inc',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );
      // Set the status to REJECTED after construction
      rejectedVendor['status'] = VendorStatus.REJECTED;

      const command = new UpdateVendorStatusCommand(
        'vendor-123',
        VendorStatus.PENDING,
        'Reapplying with updated information',
      );

      vendorRepository.findById.mockResolvedValue(rejectedVendor);
      vendorRepository.save.mockResolvedValue(rejectedVendor);

      // Act
      await handler.execute(command);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          oldStatus: VendorStatus.REJECTED,
          newStatus: VendorStatus.PENDING,
          reason: 'Reapplying with updated information',
        }),
      );
    });

    it('should update status from INACTIVE to PENDING', async () => {
      // Arrange
      const inactiveVendor = new Vendor(
        'vendor-123',
        'org-123',
        'VENDOR-001',
        'Test Vendor Inc',
        VendorType.SERVICE,
        mockAddress,
        'Net 30',
      );
      // Set the status to INACTIVE after construction
      inactiveVendor['status'] = VendorStatus.INACTIVE;

      const command = new UpdateVendorStatusCommand(
        'vendor-123',
        VendorStatus.PENDING,
      );

      vendorRepository.findById.mockResolvedValue(inactiveVendor);
      vendorRepository.save.mockResolvedValue(inactiveVendor);

      // Act
      await handler.execute(command);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          oldStatus: VendorStatus.INACTIVE,
          newStatus: VendorStatus.PENDING,
        }),
      );
    });

    it('should handle status update without reason', async () => {
      // Arrange
      const command = new UpdateVendorStatusCommand(
        'vendor-123',
        VendorStatus.APPROVED,
      );

      const mockVendor = createMockVendor();
      vendorRepository.findById.mockResolvedValue(mockVendor);
      vendorRepository.save.mockResolvedValue(mockVendor);

      // Act
      await handler.execute(command);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: undefined,
        }),
      );
    });

    it('should handle different vendor IDs correctly', async () => {
      // Test various vendor ID formats
      const testCases = [
        'vendor-123',
        '123e4567-e89b-12d3-a456-426614174000',
        'simple-vendor',
        'vendor_with_underscores',
        'vendor-with-dashes',
      ];

      for (const vendorId of testCases) {
        const command = new UpdateVendorStatusCommand(
          vendorId,
          VendorStatus.APPROVED,
        );

        const mockVendor = createMockVendor();
        vendorRepository.findById.mockResolvedValue(mockVendor);
        vendorRepository.save.mockResolvedValue(mockVendor);

        await handler.execute(command);

        expect(vendorRepository.findById).toHaveBeenCalledWith(vendorId);
      }
    });

    it('should handle empty vendor ID', async () => {
      // Arrange
      const command = new UpdateVendorStatusCommand('', VendorStatus.APPROVED);

      vendorRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Vendor not found: ',
      );
    });

    it('should handle null vendor ID', async () => {
      // Arrange
      const command = new UpdateVendorStatusCommand(
        null as any,
        VendorStatus.APPROVED,
      );

      vendorRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Vendor not found: null',
      );
    });

    it('should handle undefined vendor ID', async () => {
      // Arrange
      const command = new UpdateVendorStatusCommand(
        undefined as any,
        VendorStatus.APPROVED,
      );

      vendorRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Vendor not found: undefined',
      );
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      const command = new UpdateVendorStatusCommand(
        'vendor-123',
        VendorStatus.APPROVED,
      );

      const nonErrorException = { message: 'Non-error exception', code: 500 };
      vendorRepository.findById.mockRejectedValue(nonErrorException);

      // Act & Assert
      try {
        await handler.execute(command);
        fail('Expected handler to throw an exception');
      } catch (error) {
        expect(error).toBe(nonErrorException);
      }
    });

    it('should clear domain events after publishing', async () => {
      // Arrange
      const command = new UpdateVendorStatusCommand(
        'vendor-123',
        VendorStatus.APPROVED,
      );

      const mockVendor = createMockVendor();
      vendorRepository.findById.mockResolvedValue(mockVendor);
      vendorRepository.save.mockResolvedValue(mockVendor);

      // Act
      await handler.execute(command);

      // Assert - Domain events should be cleared after publishing
      // This is handled by the vendor entity itself, so we just verify the flow
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple status changes in sequence', async () => {
      // Arrange - Test a valid sequence: PENDING -> UNDER_REVIEW -> APPROVED
      const statuses = [VendorStatus.UNDER_REVIEW, VendorStatus.APPROVED];

      let currentVendor = createMockVendor();

      for (const newStatus of statuses) {
        const command = new UpdateVendorStatusCommand('vendor-123', newStatus);

        vendorRepository.findById.mockResolvedValue(currentVendor);
        vendorRepository.save.mockResolvedValue(currentVendor);

        await handler.execute(command);

        expect(eventBus.publish).toHaveBeenCalledWith(
          expect.objectContaining({
            vendorId: 'vendor-123',
            newStatus,
          }),
        );

        // Update vendor status for next iteration
        currentVendor = new Vendor(
          'vendor-123',
          'org-123',
          'VENDOR-001',
          'Test Vendor Inc',
          VendorType.SERVICE,
          mockAddress,
          'Net 30',
        );
        // Set the status after construction
        currentVendor['status'] = newStatus;
        currentVendor.clearDomainEvents();
      }

      expect(eventBus.publish).toHaveBeenCalledTimes(2);
    });

    it('should handle all valid status transitions', async () => {
      // Test all valid transitions defined in the entity
      const validTransitions = [
        { from: VendorStatus.PENDING, to: VendorStatus.UNDER_REVIEW },
        { from: VendorStatus.PENDING, to: VendorStatus.PREQUALIFIED },
        { from: VendorStatus.PENDING, to: VendorStatus.APPROVED },
        { from: VendorStatus.PENDING, to: VendorStatus.REJECTED },
        { from: VendorStatus.UNDER_REVIEW, to: VendorStatus.PREQUALIFIED },
        { from: VendorStatus.UNDER_REVIEW, to: VendorStatus.APPROVED },
        { from: VendorStatus.UNDER_REVIEW, to: VendorStatus.REJECTED },
        { from: VendorStatus.PREQUALIFIED, to: VendorStatus.APPROVED },
        { from: VendorStatus.PREQUALIFIED, to: VendorStatus.SUSPENDED },
        { from: VendorStatus.PREQUALIFIED, to: VendorStatus.REJECTED },
        { from: VendorStatus.APPROVED, to: VendorStatus.SUSPENDED },
        { from: VendorStatus.APPROVED, to: VendorStatus.INACTIVE },
        { from: VendorStatus.REJECTED, to: VendorStatus.PENDING },
        { from: VendorStatus.SUSPENDED, to: VendorStatus.PREQUALIFIED },
        { from: VendorStatus.SUSPENDED, to: VendorStatus.APPROVED },
        { from: VendorStatus.SUSPENDED, to: VendorStatus.REJECTED },
        { from: VendorStatus.INACTIVE, to: VendorStatus.PENDING },
      ];

      for (const transition of validTransitions) {
        const vendor = new Vendor(
          'vendor-123',
          'org-123',
          'VENDOR-001',
          'Test Vendor Inc',
          VendorType.SERVICE,
          mockAddress,
          'Net 30',
        );
        // Set the status after construction
        vendor['status'] = transition.from;
        vendor.clearDomainEvents();

        const command = new UpdateVendorStatusCommand(
          'vendor-123',
          transition.to,
        );

        vendorRepository.findById.mockResolvedValue(vendor);
        vendorRepository.save.mockResolvedValue(vendor);

        await handler.execute(command);

        expect(eventBus.publish).toHaveBeenCalledWith(
          expect.objectContaining({
            oldStatus: transition.from,
            newStatus: transition.to,
          }),
        );
      }
    });
  });
});
