import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { UpdateWellStatusHandler } from './update-well-status.handler';
import { UpdateWellStatusCommand } from '../commands/update-well-status.command';
import { WellRepository } from '../../domain/repositories/well.repository.interface';
import { WellStatus } from '../../domain/enums/well-status.enum';
import { Well } from '../../domain/entities/well.entity';

describe('UpdateWellStatusHandler', () => {
  let handler: UpdateWellStatusHandler;
  let wellRepository: jest.Mocked<WellRepository>;
  let eventBus: jest.Mocked<EventBus>;

  const mockWellRepository = {
    findByApiNumber: jest.fn(),
    save: jest.fn(),
    findById: jest.fn(),
    findByOperator: jest.fn(),
    findNearby: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockEventBus = {
    publish: jest.fn(),
    publishAll: jest.fn(),
  };

  const mockWell = {
    getId: jest.fn().mockReturnValue('well-123'),
    updateStatus: jest.fn().mockImplementation(() => {}), // Mock successful update
    getDomainEvents: jest.fn().mockReturnValue([]),
    clearDomainEvents: jest.fn(),
    getStatus: jest.fn().mockReturnValue(WellStatus.PLANNED),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateWellStatusHandler,
        {
          provide: 'WellRepository',
          useValue: mockWellRepository,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<UpdateWellStatusHandler>(UpdateWellStatusHandler);
    wellRepository = module.get('WellRepository');
    eventBus = module.get(EventBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockWell.updateStatus.mockImplementation(() => {});
    mockWell.getDomainEvents.mockReturnValue([]);
  });

  describe('execute', () => {
    const validCommand = new UpdateWellStatusCommand(
      'well-123',
      WellStatus.DRILLING,
      'user-456',
      'Starting drilling operations',
    );

    it('should update well status successfully', async () => {
      wellRepository.findById.mockResolvedValue(mockWell as any);
      wellRepository.save.mockResolvedValue(undefined);

      await handler.execute(validCommand);

      expect(wellRepository.findById).toHaveBeenCalledWith('well-123');
      expect(mockWell.updateStatus).toHaveBeenCalledWith(
        WellStatus.DRILLING,
        'user-456',
      );
      expect(wellRepository.save).toHaveBeenCalledWith(mockWell);
      expect(mockWell.getDomainEvents).toHaveBeenCalled();
      expect(mockWell.clearDomainEvents).toHaveBeenCalled();
    });

    it('should throw NotFoundException if well does not exist', async () => {
      wellRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(validCommand)).rejects.toThrow(
        NotFoundException,
      );
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Well with ID well-123 not found',
      );
      expect(wellRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle repository findById errors', async () => {
      wellRepository.findById.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(handler.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Failed to update well status: Database connection failed',
      );
    });

    it('should handle repository save errors', async () => {
      wellRepository.findById.mockResolvedValue(mockWell as any);
      wellRepository.save.mockRejectedValue(new Error('Database save failed'));

      await expect(handler.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Failed to update well status: Database save failed',
      );
    });

    it('should handle domain validation errors', async () => {
      wellRepository.findById.mockResolvedValue(mockWell as any);
      mockWell.updateStatus.mockImplementation(() => {
        throw new Error('Invalid status transition');
      });

      await expect(handler.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Failed to update well status: Invalid status transition',
      );
    });

    it('should publish domain events after updating status', async () => {
      const mockEvents = [
        {
          type: 'WellStatusChanged',
          wellId: 'well-123',
          newStatus: WellStatus.DRILLING,
        },
        { type: 'WellUpdated', wellId: 'well-123' },
      ];

      mockWell.getDomainEvents.mockReturnValue(mockEvents);
      wellRepository.findById.mockResolvedValue(mockWell as any);
      wellRepository.save.mockResolvedValue(undefined);

      await handler.execute(validCommand);

      expect(eventBus.publish).toHaveBeenCalledTimes(2);
      expect(eventBus.publish).toHaveBeenCalledWith(mockEvents[0]);
      expect(eventBus.publish).toHaveBeenCalledWith(mockEvents[1]);
      expect(mockWell.clearDomainEvents).toHaveBeenCalled();
    });

    it('should update status without reason', async () => {
      const commandWithoutReason = new UpdateWellStatusCommand(
        'well-123',
        WellStatus.COMPLETED,
        'user-789',
      );

      wellRepository.findById.mockResolvedValue(mockWell as any);
      wellRepository.save.mockResolvedValue(undefined);

      await handler.execute(commandWithoutReason);

      expect(mockWell.updateStatus).toHaveBeenCalledWith(
        WellStatus.COMPLETED,
        'user-789',
      );
      expect(wellRepository.save).toHaveBeenCalledWith(mockWell);
    });

    it('should handle all valid well statuses', async () => {
      const statuses = [
        WellStatus.PLANNED,
        WellStatus.DRILLING,
        WellStatus.COMPLETED,
        WellStatus.PRODUCING,
        WellStatus.SHUT_IN,
        WellStatus.PLUGGED,
      ];

      wellRepository.findById.mockResolvedValue(mockWell as any);
      wellRepository.save.mockResolvedValue(undefined);

      for (const status of statuses) {
        const command = new UpdateWellStatusCommand(
          'well-123',
          status,
          'user-123',
          `Updating to ${status}`,
        );

        await handler.execute(command);

        expect(mockWell.updateStatus).toHaveBeenCalledWith(status, 'user-123');
      }

      expect(wellRepository.save).toHaveBeenCalledTimes(statuses.length);
    });

    it('should handle different well IDs', async () => {
      const wellIds = ['well-001', 'well-002', 'well-003'];

      wellRepository.findById.mockResolvedValue(mockWell as any);
      wellRepository.save.mockResolvedValue(undefined);

      for (const wellId of wellIds) {
        const command = new UpdateWellStatusCommand(
          wellId,
          WellStatus.DRILLING,
          'user-123',
        );

        await handler.execute(command);

        expect(wellRepository.findById).toHaveBeenCalledWith(wellId);
      }

      expect(wellRepository.findById).toHaveBeenCalledTimes(wellIds.length);
    });

    it('should handle different user IDs', async () => {
      const userIds = ['user-001', 'user-002', 'user-003'];

      wellRepository.findById.mockResolvedValue(mockWell as any);
      wellRepository.save.mockResolvedValue(undefined);

      for (const userId of userIds) {
        const command = new UpdateWellStatusCommand(
          'well-123',
          WellStatus.PRODUCING,
          userId,
        );

        await handler.execute(command);

        expect(mockWell.updateStatus).toHaveBeenCalledWith(
          WellStatus.PRODUCING,
          userId,
        );
      }

      expect(mockWell.updateStatus).toHaveBeenCalledTimes(userIds.length);
    });

    it('should handle emergency status changes', async () => {
      const emergencyCommand = new UpdateWellStatusCommand(
        'well-123',
        WellStatus.SHUT_IN,
        'emergency-user',
        'EMERGENCY: Equipment failure detected - immediate shutdown required',
      );

      wellRepository.findById.mockResolvedValue(mockWell as any);
      wellRepository.save.mockResolvedValue(undefined);

      await handler.execute(emergencyCommand);

      expect(mockWell.updateStatus).toHaveBeenCalledWith(
        WellStatus.SHUT_IN,
        'emergency-user',
      );
      expect(wellRepository.save).toHaveBeenCalledWith(mockWell);
    });

    it('should handle regulatory status changes', async () => {
      const regulatoryCommand = new UpdateWellStatusCommand(
        'well-123',
        WellStatus.PLUGGED,
        'regulatory-officer',
        'Regulatory compliance - well abandonment required per state regulations',
      );

      wellRepository.findById.mockResolvedValue(mockWell as any);
      wellRepository.save.mockResolvedValue(undefined);

      await handler.execute(regulatoryCommand);

      expect(mockWell.updateStatus).toHaveBeenCalledWith(
        WellStatus.PLUGGED,
        'regulatory-officer',
      );
      expect(wellRepository.save).toHaveBeenCalledWith(mockWell);
    });

    it('should handle long reason text', async () => {
      const longReasonCommand = new UpdateWellStatusCommand(
        'well-123',
        WellStatus.COMPLETED,
        'user-123',
        'A'.repeat(1000), // Very long reason
      );

      wellRepository.findById.mockResolvedValue(mockWell as any);
      wellRepository.save.mockResolvedValue(undefined);

      await handler.execute(longReasonCommand);

      expect(mockWell.updateStatus).toHaveBeenCalledWith(
        WellStatus.COMPLETED,
        'user-123',
      );
      expect(wellRepository.save).toHaveBeenCalledWith(mockWell);
    });

    it('should handle special characters in reason', async () => {
      const specialCharCommand = new UpdateWellStatusCommand(
        'well-123',
        WellStatus.SHUT_IN,
        'user-123',
        'Status change due to: weather conditions (high winds > 50mph) & equipment issues!',
      );

      wellRepository.findById.mockResolvedValue(mockWell as any);
      wellRepository.save.mockResolvedValue(undefined);

      await handler.execute(specialCharCommand);

      expect(mockWell.updateStatus).toHaveBeenCalledWith(
        WellStatus.SHUT_IN,
        'user-123',
      );
      expect(wellRepository.save).toHaveBeenCalledWith(mockWell);
    });

    it('should not publish events if no domain events exist', async () => {
      mockWell.getDomainEvents.mockReturnValue([]);
      wellRepository.findById.mockResolvedValue(mockWell as any);
      wellRepository.save.mockResolvedValue(undefined);

      await handler.execute(validCommand);

      expect(eventBus.publish).not.toHaveBeenCalled();
      expect(mockWell.clearDomainEvents).toHaveBeenCalled();
    });

    it('should preserve ConflictException from domain layer', async () => {
      wellRepository.findById.mockResolvedValue(mockWell as any);
      mockWell.updateStatus.mockImplementation(() => {
        throw new NotFoundException('Well not found in domain');
      });

      await expect(handler.execute(validCommand)).rejects.toThrow(
        NotFoundException,
      );
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Well not found in domain',
      );
    });
  });
});
