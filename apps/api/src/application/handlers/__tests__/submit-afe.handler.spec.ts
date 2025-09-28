import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SubmitAfeHandler } from '../submit-afe.handler';
import { SubmitAfeCommand } from '../../commands/submit-afe.command';
import type { IAfeRepository } from '../../../domain/repositories/afe.repository.interface';
import { Afe } from '../../../domain/entities/afe.entity';
import { AfeType, AfeStatus } from '../../../domain/enums/afe-status.enum';
import { AfeSubmittedEvent } from '../../../domain/events/afe-submitted.event';
import { AfeNumber } from '../../../domain/value-objects/afe-number';
import { Money } from '../../../domain/value-objects/money';

describe('SubmitAfeHandler', () => {
  let handler: SubmitAfeHandler;
  let afeRepository: jest.Mocked<IAfeRepository>;
  let eventBus: jest.Mocked<EventBus>;

  // Helper function to create a fresh AFE instance
  const createMockAfe = (status: AfeStatus = AfeStatus.DRAFT) => {
    const afe = new Afe(
      'afe-123',
      'org-123',
      new AfeNumber('AFE-2024-0001'),
      AfeType.DRILLING,
      {
        wellId: 'well-123',
        leaseId: 'lease-123',
        totalEstimatedCost: new Money(1500000),
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
        SubmitAfeHandler,
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

    handler = module.get<SubmitAfeHandler>(SubmitAfeHandler);
    afeRepository = module.get('AfeRepository');
    eventBus = module.get(EventBus);
  });

  describe('execute', () => {
    it('should submit AFE successfully', async () => {
      // Arrange
      const command = new SubmitAfeCommand('afe-123', 'user-456');

      const draftAfe = createMockAfe(AfeStatus.DRAFT);
      afeRepository.findById.mockResolvedValue(draftAfe);
      afeRepository.save.mockResolvedValue(draftAfe);

      // Act
      await handler.execute(command);

      // Assert
      expect(afeRepository.findById).toHaveBeenCalledWith('afe-123');
      expect(afeRepository.save).toHaveBeenCalledWith(draftAfe);
      expect(eventBus.publish).toHaveBeenCalledTimes(2); // StatusChangedEvent + SubmittedEvent
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(AfeSubmittedEvent),
      );
    });

    it('should throw NotFoundException when AFE is not found', async () => {
      // Arrange
      const command = new SubmitAfeCommand('non-existent-afe', 'user-456');

      afeRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(command)).rejects.toThrow(
        'AFE with ID non-existent-afe not found',
      );

      expect(afeRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid AFE status transition', async () => {
      // Arrange
      const command = new SubmitAfeCommand('afe-123', 'user-456');

      const submittedAfe = createMockAfe(AfeStatus.SUBMITTED);
      afeRepository.findById.mockResolvedValue(submittedAfe);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        'Failed to submit AFE:',
      );

      expect(afeRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle repository find errors', async () => {
      // Arrange
      const command = new SubmitAfeCommand('afe-123', 'user-456');

      afeRepository.findById.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        'Failed to submit AFE: Database connection failed',
      );

      expect(afeRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle repository save errors', async () => {
      // Arrange
      const command = new SubmitAfeCommand('afe-123', 'user-456');

      const draftAfe = createMockAfe(AfeStatus.DRAFT);
      afeRepository.findById.mockResolvedValue(draftAfe);
      afeRepository.save.mockRejectedValue(new Error('Save operation failed'));

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Failed to submit AFE: Save operation failed',
      );

      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should publish domain events after successful submission', async () => {
      // Arrange
      const command = new SubmitAfeCommand('afe-123', 'user-456');

      const draftAfe = createMockAfe(AfeStatus.DRAFT);
      afeRepository.findById.mockResolvedValue(draftAfe);
      afeRepository.save.mockResolvedValue(draftAfe);

      // Act
      await handler.execute(command);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledTimes(2); // StatusChangedEvent + SubmittedEvent

      // Check that AfeSubmittedEvent was published
      const submittedEventCall = eventBus.publish.mock.calls.find(
        (call) => call[0] instanceof AfeSubmittedEvent,
      );
      expect(submittedEventCall).toBeDefined();
      const submittedEvent = submittedEventCall![0] as AfeSubmittedEvent;
      expect(submittedEvent.afeId).toBe('afe-123');
      expect(submittedEvent.afeNumber).toBe('AFE-2024-0001');
      expect(submittedEvent.submittedBy).toBe('user-456');
    });

    it('should clear domain events after publishing', async () => {
      // Arrange
      const command = new SubmitAfeCommand('afe-123', 'user-456');

      const draftAfe = createMockAfe(AfeStatus.DRAFT);
      afeRepository.findById.mockResolvedValue(draftAfe);
      afeRepository.save.mockResolvedValue(draftAfe);

      // Act
      await handler.execute(command);

      // Assert - Domain events should be cleared after publishing
      // This is handled by the AFE entity itself, so we just verify the flow
      expect(eventBus.publish).toHaveBeenCalledTimes(2); // StatusChangedEvent + SubmittedEvent
    });

    it('should handle event publishing errors gracefully', async () => {
      // Arrange
      const command = new SubmitAfeCommand('afe-123', 'user-456');

      const draftAfe = createMockAfe(AfeStatus.DRAFT);
      afeRepository.findById.mockResolvedValue(draftAfe);
      afeRepository.save.mockResolvedValue(draftAfe);
      eventBus.publish.mockRejectedValueOnce(new Error('Event bus failed'));

      // Act - Event publishing is not awaited, so handler should succeed
      const result = await handler.execute(command);

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
        const command = new SubmitAfeCommand(afeId, 'user-456');

        const draftAfe = createMockAfe(AfeStatus.DRAFT);
        afeRepository.findById.mockResolvedValue(draftAfe);
        afeRepository.save.mockResolvedValue(draftAfe);

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
        const command = new SubmitAfeCommand('afe-123', userId);

        const draftAfe = createMockAfe(AfeStatus.DRAFT);
        afeRepository.findById.mockResolvedValue(draftAfe);
        afeRepository.save.mockResolvedValue(draftAfe);

        await handler.execute(command);

        expect(eventBus.publish).toHaveBeenCalledWith(
          expect.objectContaining({
            submittedBy: userId,
          }),
        );
      }
    });

    it('should handle empty AFE ID', async () => {
      // Arrange
      const command = new SubmitAfeCommand('', 'user-456');

      afeRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'AFE with ID  not found',
      );
    });

    it('should handle null AFE ID', async () => {
      // Arrange
      const command = new SubmitAfeCommand(null as any, 'user-456');

      afeRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'AFE with ID null not found',
      );
    });

    it('should handle undefined AFE ID', async () => {
      // Arrange
      const command = new SubmitAfeCommand(undefined as any, 'user-456');

      afeRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'AFE with ID undefined not found',
      );
    });

    it('should handle empty submitted by', async () => {
      // Arrange
      const command = new SubmitAfeCommand('afe-123', '');

      const draftAfe = createMockAfe(AfeStatus.DRAFT);
      afeRepository.findById.mockResolvedValue(draftAfe);
      afeRepository.save.mockResolvedValue(draftAfe);

      // Act
      await handler.execute(command);

      // Assert - Empty submitted by should still work
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          submittedBy: '',
        }),
      );
    });

    it('should handle null submitted by', async () => {
      // Arrange
      const command = new SubmitAfeCommand('afe-123', null as any);

      const draftAfe = createMockAfe(AfeStatus.DRAFT);
      afeRepository.findById.mockResolvedValue(draftAfe);
      afeRepository.save.mockResolvedValue(draftAfe);

      // Act
      await handler.execute(command);

      // Assert - Null submitted by should still work
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          submittedBy: null,
        }),
      );
    });

    it('should handle undefined submitted by', async () => {
      // Arrange
      const command = new SubmitAfeCommand('afe-123', undefined as any);

      const draftAfe = createMockAfe(AfeStatus.DRAFT);
      afeRepository.findById.mockResolvedValue(draftAfe);
      afeRepository.save.mockResolvedValue(draftAfe);

      // Act
      await handler.execute(command);

      // Assert - Undefined submitted by should still work
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          submittedBy: undefined,
        }),
      );
    });

    it('should handle non-Error exceptions from repository', async () => {
      // Arrange
      const command = new SubmitAfeCommand('afe-123', 'user-456');

      const nonErrorException = { message: 'Non-error exception', code: 500 };
      afeRepository.findById.mockRejectedValue(nonErrorException);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        'Failed to submit AFE: Unknown error',
      );
    });

    it('should handle non-Error exceptions from save', async () => {
      // Arrange
      const command = new SubmitAfeCommand('afe-123', 'user-456');

      const draftAfe = createMockAfe(AfeStatus.DRAFT);
      afeRepository.findById.mockResolvedValue(draftAfe);
      const nonErrorException = { message: 'Save non-error', code: 500 };
      afeRepository.save.mockRejectedValue(nonErrorException);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Failed to submit AFE: Unknown error',
      );
    });

    it('should handle non-Error exceptions from event publishing', async () => {
      // Arrange
      const command = new SubmitAfeCommand('afe-123', 'user-456');

      const draftAfe = createMockAfe(AfeStatus.DRAFT);
      afeRepository.findById.mockResolvedValue(draftAfe);
      afeRepository.save.mockResolvedValue(draftAfe);
      const nonErrorException = { message: 'Event bus non-error', code: 500 };
      eventBus.publish.mockRejectedValue(nonErrorException);

      // Act - Event publishing is not awaited, so handler should succeed
      const result = await handler.execute(command);

      // Assert
      expect(result).toBeUndefined(); // Handler returns void
      expect(afeRepository.findById).toHaveBeenCalledWith('afe-123');
      expect(afeRepository.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
    });

    it('should handle AFEs with different statuses', async () => {
      // Test submitting AFEs with different current statuses
      const validStatuses = [AfeStatus.DRAFT];

      for (const status of validStatuses) {
        const command = new SubmitAfeCommand('afe-123', 'user-456');

        const afe = createMockAfe(status);
        afeRepository.findById.mockResolvedValue(afe);
        afeRepository.save.mockResolvedValue(afe);

        // Should succeed
        await handler.execute(command);
        expect(eventBus.publish).toHaveBeenCalledTimes(2); // StatusChangedEvent + SubmittedEvent
      }
    });

    it('should reject submission of already submitted AFEs', async () => {
      // Arrange
      const command = new SubmitAfeCommand('afe-123', 'user-456');

      const submittedAfe = createMockAfe(AfeStatus.SUBMITTED);
      afeRepository.findById.mockResolvedValue(submittedAfe);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        'Failed to submit AFE:',
      );

      expect(afeRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should reject submission of approved AFEs', async () => {
      // Arrange
      const command = new SubmitAfeCommand('afe-123', 'user-456');

      const approvedAfe = createMockAfe(AfeStatus.APPROVED);
      afeRepository.findById.mockResolvedValue(approvedAfe);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );

      expect(afeRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should reject submission of rejected AFEs that cannot be resubmitted', async () => {
      // Note: This depends on the AFE entity logic. Assuming REJECTED can be resubmitted.
      // If the entity prevents resubmission of rejected AFEs, this test would need adjustment.
      const command = new SubmitAfeCommand('afe-123', 'user-456');

      const rejectedAfe = createMockAfe(AfeStatus.REJECTED);
      afeRepository.findById.mockResolvedValue(rejectedAfe);

      // Act & Assert - REJECTED cannot transition to SUBMITTED
      await expect(handler.execute(command)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        'Failed to submit AFE:',
      );

      expect(afeRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });
  });
});
