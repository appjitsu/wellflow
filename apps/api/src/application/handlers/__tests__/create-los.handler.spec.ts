import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { CreateLosHandler } from '../create-los.handler';
import { CreateLosCommand } from '../../commands/create-los.command';
import { ILosRepository } from '../../../domain/repositories/lease-operating-statement.repository.interface';
import { LeaseOperatingStatement } from '../../../domain/entities/lease-operating-statement.entity';
import { StatementMonth } from '../../../domain/value-objects/statement-month';
import { LosCreatedEvent } from '../../../domain/events/los-created.event';

describe('CreateLosHandler', () => {
  let handler: CreateLosHandler;
  let mockLosRepository: jest.Mocked<ILosRepository>;
  let mockEventBus: jest.Mocked<EventBus>;

  const mockCommand = new CreateLosCommand(
    'org-123',
    'lease-456',
    2024,
    3,
    'Test notes',
    'user-789',
  );

  beforeEach(async () => {
    const mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByOrganizationId: jest.fn(),
      findByLeaseId: jest.fn(),
      findByLeaseIdAndMonth: jest.fn(),
      findByStatus: jest.fn(),
      findByDateRange: jest.fn(),
      findDraftStatements: jest.fn(),
      findReadyForDistribution: jest.fn(),
      existsByLeaseIdAndMonth: jest.fn(),
      getExpenseSummaryByLease: jest.fn(),
      getExpenseTrends: jest.fn(),
      delete: jest.fn(),
      countByStatus: jest.fn(),
    };

    const mockEvent = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateLosHandler,
        {
          provide: 'LosRepository',
          useValue: mockRepository,
        },
        {
          provide: EventBus,
          useValue: mockEvent,
        },
      ],
    }).compile();

    handler = module.get<CreateLosHandler>(CreateLosHandler);
    mockLosRepository = module.get('LosRepository');
    mockEventBus = module.get(EventBus);
  });

  describe('execute', () => {
    it('should create LOS successfully when no existing LOS found', async () => {
      // Arrange
      mockLosRepository.findByLeaseIdAndMonth.mockResolvedValue(null);
      mockLosRepository.save.mockResolvedValue({} as LeaseOperatingStatement);

      // Act
      const result = await handler.execute(mockCommand);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(mockLosRepository.findByLeaseIdAndMonth).toHaveBeenCalledWith(
        'lease-456',
        expect.any(StatementMonth),
      );
      expect(mockLosRepository.save).toHaveBeenCalledWith(
        expect.any(LeaseOperatingStatement),
      );
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.any(LosCreatedEvent),
      );
    });

    it('should throw ConflictException when LOS already exists', async () => {
      // Arrange
      const existingLos = new LeaseOperatingStatement(
        'existing-id',
        'org-123',
        'lease-456',
        new StatementMonth(2024, 3),
      );
      mockLosRepository.findByLeaseIdAndMonth.mockResolvedValue(existingLos);

      // Act & Assert
      await expect(handler.execute(mockCommand)).rejects.toThrow(
        ConflictException,
      );
      expect(mockLosRepository.save).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when repository save fails', async () => {
      // Arrange
      mockLosRepository.findByLeaseIdAndMonth.mockResolvedValue(null);
      mockLosRepository.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(handler.execute(mockCommand)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create LOS with correct parameters', async () => {
      // Arrange
      mockLosRepository.findByLeaseIdAndMonth.mockResolvedValue(null);
      mockLosRepository.save.mockImplementation(async (los) => {
        // Verify the LOS was created with correct parameters
        expect(los.getOrganizationId()).toBe('org-123');
        expect(los.getLeaseId()).toBe('lease-456');
        expect(los.getStatementMonth().getYear()).toBe(2024);
        expect(los.getStatementMonth().getMonth()).toBe(3);
        expect(los.getNotes()).toBe('Test notes');
        return los;
      });

      // Act
      await handler.execute(mockCommand);

      // Assert
      expect(mockLosRepository.save).toHaveBeenCalled();
    });

    it('should publish domain events after saving', async () => {
      // Arrange
      mockLosRepository.findByLeaseIdAndMonth.mockResolvedValue(null);
      mockLosRepository.save.mockResolvedValue({} as LeaseOperatingStatement);

      // Act
      await handler.execute(mockCommand);

      // Assert
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        expect.any(LosCreatedEvent),
      );
    });

    it('should handle command without notes', async () => {
      // Arrange
      const commandWithoutNotes = new CreateLosCommand(
        'org-123',
        'lease-456',
        2024,
        3,
        undefined,
        'user-789',
      );
      mockLosRepository.findByLeaseIdAndMonth.mockResolvedValue(null);
      mockLosRepository.save.mockImplementation(async (los) => {
        expect(los.getNotes()).toBeUndefined();
        return los;
      });

      // Act
      await handler.execute(commandWithoutNotes);

      // Assert
      expect(mockLosRepository.save).toHaveBeenCalled();
    });

    it('should validate statement month creation', async () => {
      // Arrange
      const invalidCommand = new CreateLosCommand(
        'org-123',
        'lease-456',
        2024,
        13, // Invalid month
        'Test notes',
        'user-789',
      );

      // Act & Assert
      await expect(handler.execute(invalidCommand)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should clear domain events after publishing', async () => {
      // Arrange
      mockLosRepository.findByLeaseIdAndMonth.mockResolvedValue(null);
      let savedLos: LeaseOperatingStatement;
      mockLosRepository.save.mockImplementation(async (los) => {
        savedLos = los;
        return los;
      });

      // Act
      await handler.execute(mockCommand);

      // Assert
      expect(savedLos!.getDomainEvents()).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should preserve ConflictException from business logic', async () => {
      // Arrange
      const existingLos = new LeaseOperatingStatement(
        'existing-id',
        'org-123',
        'lease-456',
        new StatementMonth(2024, 3),
      );
      mockLosRepository.findByLeaseIdAndMonth.mockResolvedValue(existingLos);

      // Act & Assert
      await expect(handler.execute(mockCommand)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should wrap unexpected errors in BadRequestException', async () => {
      // Arrange
      mockLosRepository.findByLeaseIdAndMonth.mockRejectedValue(
        new Error('Unexpected error'),
      );

      // Act & Assert
      await expect(handler.execute(mockCommand)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should include error message in BadRequestException', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      mockLosRepository.findByLeaseIdAndMonth.mockRejectedValue(
        new Error(errorMessage),
      );

      // Act & Assert
      await expect(handler.execute(mockCommand)).rejects.toThrow(
        `Failed to create Lease Operating Statement: ${errorMessage}`,
      );
    });
  });
});
