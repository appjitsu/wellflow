import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ApproveAfeHandler } from '../approve-afe.handler';
import { ApproveAfeCommand } from '../../commands/approve-afe.command';
import type { IAfeRepository } from '../../../domain/repositories/afe.repository.interface';
import { Afe } from '../../../domain/entities/afe.entity';
import { AfeNumber } from '../../../domain/value-objects/afe-number';
import { Money } from '../../../domain/value-objects/money';
import { AfeStatus, AfeType } from '../../../domain/enums/afe-status.enum';
import { AfeApprovedEvent } from '../../../domain/events/afe-approved.event';

describe('ApproveAfeHandler', () => {
  let handler: ApproveAfeHandler;
  let afeRepository: jest.Mocked<IAfeRepository>;
  let eventBus: jest.Mocked<EventBus>;

  const validCommand = new ApproveAfeCommand(
    'afe-123',
    'user-456',
    50000,
    'Approved for drilling operations',
  );

  // Helper function to create a fresh AFE instance
  const createMockAfe = (status: AfeStatus = AfeStatus.SUBMITTED) => {
    const afe = new Afe(
      'afe-123',
      'org-789',
      new AfeNumber('AFE-2024-0001'),
      AfeType.DRILLING,
      {
        wellId: 'well-123',
        leaseId: 'lease-123',
        totalEstimatedCost: new Money(60000),
        description: 'Test drilling AFE',
        status,
      },
    );
    // Clear any domain events from creation
    afe.clearDomainEvents();
    return afe;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockAfeRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      findByAfeNumber: jest.fn(),
      findByOrganizationId: jest.fn(),
      findByWellId: jest.fn(),
      findByLeaseId: jest.fn(),
      findByStatus: jest.fn(),
      findRequiringApproval: jest.fn(),
      findByDateRange: jest.fn(),
      getNextAfeNumber: jest.fn(),
      existsByAfeNumber: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApproveAfeHandler,
        {
          provide: 'AfeRepository',
          useValue: mockAfeRepository,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<ApproveAfeHandler>(ApproveAfeHandler);
    afeRepository = module.get('AfeRepository');
    eventBus = module.get(EventBus);
  });

  describe('execute', () => {
    it('should approve AFE successfully with approved amount', async () => {
      // Arrange
      const submittedAfe = createMockAfe(AfeStatus.SUBMITTED);
      afeRepository.findById.mockResolvedValue(submittedAfe);
      afeRepository.save.mockResolvedValue(submittedAfe);

      // Act
      await handler.execute(validCommand);

      // Assert
      expect(afeRepository.findById).toHaveBeenCalledWith('afe-123');
      expect(afeRepository.save).toHaveBeenCalledWith(submittedAfe);
      expect(eventBus.publish).toHaveBeenCalledTimes(2); // StatusChangedEvent + ApprovedEvent
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(AfeApprovedEvent),
      );
    });

    it('should approve AFE successfully without approved amount', async () => {
      // Arrange
      const command = new ApproveAfeCommand('afe-123', 'user-456');
      const submittedAfe = createMockAfe(AfeStatus.SUBMITTED);
      afeRepository.findById.mockResolvedValue(submittedAfe);
      afeRepository.save.mockResolvedValue(submittedAfe);

      // Act
      await handler.execute(command);

      // Assert
      expect(afeRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          // The AFE should be approved without a specific approved amount
        }),
      );
      expect(eventBus.publish).toHaveBeenCalledTimes(2);
    });

    it('should approve AFE with approved amount less than estimated', async () => {
      // Arrange
      const command = new ApproveAfeCommand(
        'afe-123',
        'user-456',
        40000, // Less than estimated 60000
        'Partial approval',
      );
      const submittedAfe = createMockAfe(AfeStatus.SUBMITTED);
      afeRepository.findById.mockResolvedValue(submittedAfe);
      afeRepository.save.mockResolvedValue(submittedAfe);

      // Act
      await handler.execute(command);

      // Assert
      expect(afeRepository.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          approvedAmount: 40000,
        }),
      );
    });

    it('should approve AFE with approved amount equal to estimated', async () => {
      // Arrange
      const command = new ApproveAfeCommand(
        'afe-123',
        'user-456',
        60000, // Equal to estimated
        'Full approval',
      );
      const submittedAfe = createMockAfe(AfeStatus.SUBMITTED);
      afeRepository.findById.mockResolvedValue(submittedAfe);
      afeRepository.save.mockResolvedValue(submittedAfe);

      // Act
      await handler.execute(command);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          approvedAmount: 60000,
        }),
      );
    });

    it('should throw NotFoundException when AFE is not found', async () => {
      // Arrange
      afeRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        NotFoundException,
      );
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'AFE with ID afe-123 not found',
      );

      expect(afeRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      // Arrange
      const draftAfe = createMockAfe(AfeStatus.DRAFT);
      afeRepository.findById.mockResolvedValue(draftAfe);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Failed to approve AFE:',
      );

      expect(afeRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle repository find errors', async () => {
      // Arrange
      afeRepository.findById.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Failed to approve AFE: Database connection failed',
      );

      expect(afeRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle repository save errors', async () => {
      // Arrange
      const submittedAfe = createMockAfe(AfeStatus.SUBMITTED);
      // Mock the approve method to not throw
      jest.spyOn(submittedAfe, 'approve').mockImplementation(() => {});
      afeRepository.findById.mockResolvedValue(submittedAfe);
      afeRepository.save.mockRejectedValue(new Error('Save operation failed'));

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Failed to approve AFE: Save operation failed',
      );

      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should publish domain events after successful approval', async () => {
      // Arrange
      const submittedAfe = createMockAfe(AfeStatus.SUBMITTED);
      afeRepository.findById.mockResolvedValue(submittedAfe);
      afeRepository.save.mockResolvedValue(submittedAfe);

      // Act
      await handler.execute(validCommand);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledTimes(2);

      // Check that AfeApprovedEvent was published
      const approvedEventCall = eventBus.publish.mock.calls.find(
        (call) => call[0] instanceof AfeApprovedEvent,
      );
      expect(approvedEventCall).toBeDefined();
      const approvedEvent = approvedEventCall![0] as AfeApprovedEvent;
      expect(approvedEvent.afeId).toBe('afe-123');
      expect(approvedEvent.afeNumber).toBe('AFE-2024-0001');
      expect(approvedEvent.approvedBy).toBe('user-456');
      expect(approvedEvent.approvedAmount).toBe(50000);
    });

    it('should clear domain events after publishing', async () => {
      // Arrange
      const submittedAfe = createMockAfe(AfeStatus.SUBMITTED);
      afeRepository.findById.mockResolvedValue(submittedAfe);
      afeRepository.save.mockResolvedValue(submittedAfe);

      // Act
      await handler.execute(validCommand);

      // Assert - Domain events should be cleared after publishing
      expect(eventBus.publish).toHaveBeenCalledTimes(2);
    });

    it('should handle event publishing errors gracefully', async () => {
      // Arrange
      const submittedAfe = createMockAfe(AfeStatus.SUBMITTED);
      afeRepository.findById.mockResolvedValue(submittedAfe);
      afeRepository.save.mockResolvedValue(submittedAfe);
      eventBus.publish.mockRejectedValue(new Error('Event bus failed'));

      // Act - Event publishing is not awaited, so handler should succeed
      const result = await handler.execute(validCommand);

      // Assert
      expect(result).toBeUndefined(); // Handler returns void
      expect(afeRepository.findById).toHaveBeenCalledWith('afe-123');
      expect(afeRepository.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('should handle different AFE IDs correctly', async () => {
      // Test various AFE ID formats
      const testCases = [
        'afe-123',
        '123e4567-e89b-12d3-a456-426614174000',
        'simple-afe',
        'afe_with_underscores',
        'afe-with-dashes',
      ];

      for (const afeId of testCases) {
        const command = new ApproveAfeCommand(afeId, 'user-456', 50000);
        const submittedAfe = createMockAfe(AfeStatus.SUBMITTED);
        afeRepository.findById.mockResolvedValue(submittedAfe);
        afeRepository.save.mockResolvedValue(submittedAfe);

        await handler.execute(command);

        expect(afeRepository.findById).toHaveBeenCalledWith(afeId);
      }
    });

    it('should handle different user IDs correctly', async () => {
      // Test various user ID formats
      const testCases = [
        'user-456',
        '123e4567-e89b-12d3-a456-426614174000',
        'simple-user',
        'user_with_underscores',
        'user-with-dashes',
      ];

      for (const userId of testCases) {
        const command = new ApproveAfeCommand('afe-123', userId, 50000);
        const submittedAfe = createMockAfe(AfeStatus.SUBMITTED);
        afeRepository.findById.mockResolvedValue(submittedAfe);
        afeRepository.save.mockResolvedValue(submittedAfe);

        await handler.execute(command);

        expect(eventBus.publish).toHaveBeenCalledWith(
          expect.objectContaining({
            approvedBy: userId,
          }),
        );
      }
    });

    it('should handle empty AFE ID', async () => {
      // Arrange
      const command = new ApproveAfeCommand('', 'user-456', 50000);
      afeRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'AFE with ID  not found',
      );
    });

    it('should handle null AFE ID', async () => {
      // Arrange
      const command = new ApproveAfeCommand(null as any, 'user-456', 50000);
      afeRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'AFE with ID null not found',
      );
    });

    it('should handle undefined AFE ID', async () => {
      // Arrange
      const command = new ApproveAfeCommand(
        undefined as any,
        'user-456',
        50000,
      );
      afeRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'AFE with ID undefined not found',
      );
    });

    it('should handle empty approved by', async () => {
      // Arrange
      const command = new ApproveAfeCommand('afe-123', '', 50000);
      const submittedAfe = createMockAfe(AfeStatus.SUBMITTED);
      afeRepository.findById.mockResolvedValue(submittedAfe);
      afeRepository.save.mockResolvedValue(submittedAfe);

      // Act
      await handler.execute(command);

      // Assert - Empty approved by should still work
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          approvedBy: '',
        }),
      );
    });

    it('should handle null approved by', async () => {
      // Arrange
      const command = new ApproveAfeCommand('afe-123', null as any, 50000);
      const submittedAfe = createMockAfe(AfeStatus.SUBMITTED);
      afeRepository.findById.mockResolvedValue(submittedAfe);
      afeRepository.save.mockResolvedValue(submittedAfe);

      // Act
      await handler.execute(command);

      // Assert - Null approved by should still work
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          approvedBy: null,
        }),
      );
    });

    it('should handle undefined approved by', async () => {
      // Arrange
      const command = new ApproveAfeCommand('afe-123', undefined as any, 50000);
      const submittedAfe = createMockAfe(AfeStatus.SUBMITTED);
      afeRepository.findById.mockResolvedValue(submittedAfe);
      afeRepository.save.mockResolvedValue(submittedAfe);

      // Act
      await handler.execute(command);

      // Assert - Undefined approved by should still work
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          approvedBy: undefined,
        }),
      );
    });

    it('should handle non-Error exceptions from repository', async () => {
      // Arrange
      const nonErrorException = { message: 'Non-error exception', code: 500 };
      afeRepository.findById.mockRejectedValue(nonErrorException);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Failed to approve AFE: Unknown error',
      );
    });

    it('should handle non-Error exceptions from save', async () => {
      // Arrange
      const submittedAfe = createMockAfe(AfeStatus.SUBMITTED);
      // Mock the approve method to not throw
      jest.spyOn(submittedAfe, 'approve').mockImplementation(() => {});
      afeRepository.findById.mockResolvedValue(submittedAfe);
      const nonErrorException = { message: 'Save non-error', code: 500 };
      afeRepository.save.mockRejectedValue(nonErrorException);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Failed to approve AFE: Unknown error',
      );
    });

    it('should handle non-Error exceptions from event publishing', async () => {
      // Arrange
      const submittedAfe = createMockAfe(AfeStatus.SUBMITTED);
      afeRepository.findById.mockResolvedValue(submittedAfe);
      afeRepository.save.mockResolvedValue(submittedAfe);
      const nonErrorException = { message: 'Event bus non-error', code: 500 };
      eventBus.publish.mockRejectedValue(nonErrorException);

      // Act - Event publishing is not awaited, so handler should succeed
      const result = await handler.execute(validCommand);

      // Assert
      expect(result).toBeUndefined();
      expect(afeRepository.findById).toHaveBeenCalledWith('afe-123');
      expect(afeRepository.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('should handle AFEs with different statuses', async () => {
      // Test that only SUBMITTED AFEs can be approved
      const invalidStatuses = [
        AfeStatus.DRAFT,
        AfeStatus.APPROVED,
        AfeStatus.REJECTED,
        AfeStatus.CLOSED,
      ];

      for (const status of invalidStatuses) {
        const command = new ApproveAfeCommand('afe-123', 'user-456', 50000);
        const afe = createMockAfe(status);
        afeRepository.findById.mockResolvedValue(afe);

        // Act & Assert - Should fail for invalid status
        await expect(handler.execute(command)).rejects.toThrow(
          BadRequestException,
        );

        expect(afeRepository.save).not.toHaveBeenCalled();
        expect(eventBus.publish).not.toHaveBeenCalled();
      }
    });

    it('should handle zero approved amount', async () => {
      // Arrange
      const command = new ApproveAfeCommand('afe-123', 'user-456', 0);
      const submittedAfe = createMockAfe(AfeStatus.SUBMITTED);
      afeRepository.findById.mockResolvedValue(submittedAfe);
      afeRepository.save.mockResolvedValue(submittedAfe);

      // Act
      await handler.execute(command);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          approvedAmount: 0,
        }),
      );
    });

    it('should handle negative approved amount', async () => {
      // Arrange
      const command = new ApproveAfeCommand('afe-123', 'user-456', -1000);
      const submittedAfe = createMockAfe(AfeStatus.SUBMITTED);
      afeRepository.findById.mockResolvedValue(submittedAfe);
      afeRepository.save.mockResolvedValue(submittedAfe);

      // Act
      await handler.execute(command);

      // Assert - Negative amounts should still be allowed (business decision)
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          approvedAmount: -1000,
        }),
      );
    });

    it('should handle large approved amounts', async () => {
      // Arrange
      const command = new ApproveAfeCommand('afe-123', 'user-456', 999999999);
      const submittedAfe = createMockAfe(AfeStatus.SUBMITTED);
      afeRepository.findById.mockResolvedValue(submittedAfe);
      afeRepository.save.mockResolvedValue(submittedAfe);

      // Act
      await handler.execute(command);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          approvedAmount: 999999999,
        }),
      );
    });

    it('should handle comments correctly', async () => {
      // Arrange
      const commandWithComments = new ApproveAfeCommand(
        'afe-123',
        'user-456',
        50000,
        'Detailed approval comments',
      );
      const submittedAfe = createMockAfe(AfeStatus.SUBMITTED);
      afeRepository.findById.mockResolvedValue(submittedAfe);
      afeRepository.save.mockResolvedValue(submittedAfe);

      // Act
      await handler.execute(commandWithComments);

      // Assert - Comments are passed to the command but may not be in events
      expect(afeRepository.findById).toHaveBeenCalledWith('afe-123');
      expect(afeRepository.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('should handle undefined comments', async () => {
      // Arrange
      const commandNoComments = new ApproveAfeCommand(
        'afe-123',
        'user-456',
        50000,
      );
      const submittedAfe = createMockAfe(AfeStatus.SUBMITTED);
      afeRepository.findById.mockResolvedValue(submittedAfe);
      afeRepository.save.mockResolvedValue(submittedAfe);

      // Act
      await handler.execute(commandNoComments);

      // Assert
      expect(afeRepository.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
    });
  });
});
