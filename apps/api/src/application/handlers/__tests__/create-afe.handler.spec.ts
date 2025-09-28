import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { CreateAfeHandler } from '../create-afe.handler';
import { CreateAfeCommand } from '../../commands/create-afe.command';
import { IAfeRepository } from '../../../domain/repositories/afe.repository.interface';
import { Afe } from '../../../domain/entities/afe.entity';
import { AfeType } from '../../../domain/enums/afe-status.enum';
import { AfeCreatedEvent } from '../../../domain/events/afe-created.event';

describe('CreateAfeHandler', () => {
  let handler: CreateAfeHandler;
  let afeRepository: jest.Mocked<IAfeRepository>;
  let eventBus: jest.Mocked<EventBus>;

  const mockAfeRepository = {
    save: jest.fn(),
    findById: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAfeHandler,
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

    handler = module.get<CreateAfeHandler>(CreateAfeHandler);
    afeRepository = module.get('AfeRepository');
    eventBus = module.get(EventBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCommand = new CreateAfeCommand(
      'org-123',
      'AFE-2024-0001',
      AfeType.DRILLING,
      'well-123',
      'lease-123',
      1500000,
      'Test drilling AFE',
      'user-123',
    );

    it('should create AFE successfully', async () => {
      // Arrange
      afeRepository.findByAfeNumber.mockResolvedValue(null);
      afeRepository.save.mockImplementation((afe: Afe) => Promise.resolve(afe));

      // Act
      const result = await handler.execute(validCommand);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(afeRepository.findByAfeNumber).toHaveBeenCalledWith(
        'org-123',
        'AFE-2024-0001',
      );
      expect(afeRepository.save).toHaveBeenCalledTimes(1);
      expect(eventBus.publish).toHaveBeenCalledTimes(1);

      const savedAfe = (afeRepository.save.mock as any).calls[0][0];
      expect(savedAfe.getOrganizationId()).toBe('org-123');
      expect(savedAfe.getAfeNumber().getValue()).toBe('AFE-2024-0001');
      expect(savedAfe.getAfeType()).toBe(AfeType.DRILLING);
      expect(savedAfe.getWellId()).toBe('well-123');
      expect(savedAfe.getLeaseId()).toBe('lease-123');
      expect(savedAfe.getTotalEstimatedCost()?.getAmount()).toBe(1500000);
      expect(savedAfe.getDescription()).toBe('Test drilling AFE');
    });

    it('should create AFE with minimal required fields', async () => {
      // Arrange
      const minimalCommand = new CreateAfeCommand(
        'org-123',
        'AFE-2024-0002',
        AfeType.COMPLETION,
      );

      afeRepository.findByAfeNumber.mockResolvedValue(null);
      afeRepository.save.mockImplementation((afe: Afe) => Promise.resolve(afe));

      // Act
      const result = await handler.execute(minimalCommand);

      // Assert
      expect(result).toBeDefined();
      expect(afeRepository.save).toHaveBeenCalledTimes(1);

      const savedAfe = (afeRepository.save.mock as any).calls[0][0];
      expect(savedAfe.getOrganizationId()).toBe('org-123');
      expect(savedAfe.getAfeNumber().getValue()).toBe('AFE-2024-0002');
      expect(savedAfe.getAfeType()).toBe(AfeType.COMPLETION);
      expect(savedAfe.getWellId()).toBeUndefined();
      expect(savedAfe.getLeaseId()).toBeUndefined();
      expect(savedAfe.getTotalEstimatedCost()).toBeUndefined();
      expect(savedAfe.getDescription()).toBeUndefined();
    });

    it('should publish domain events', async () => {
      // Arrange
      afeRepository.findByAfeNumber.mockResolvedValue(null);
      afeRepository.save.mockImplementation((afe: Afe) => Promise.resolve(afe));

      // Act
      await handler.execute(validCommand);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(AfeCreatedEvent),
      );

      const publishedEvent = (eventBus.publish.mock as any)
        .calls[0][0] as AfeCreatedEvent;
      expect(publishedEvent.organizationId).toBe('org-123');
      expect(publishedEvent.afeNumber).toBe('AFE-2024-0001');
      expect(publishedEvent.afeType).toBe(AfeType.DRILLING);
      expect(publishedEvent.estimatedCost).toBe(1500000);
    });

    it('should throw ConflictException if AFE number already exists', async () => {
      // Arrange
      const existingAfe = {} as Afe;
      afeRepository.findByAfeNumber.mockResolvedValue(existingAfe);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        ConflictException,
      );
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'AFE with number AFE-2024-0001 already exists',
      );

      expect(afeRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid AFE number', async () => {
      // Arrange
      const invalidCommand = new CreateAfeCommand(
        'org-123',
        'INVALID-AFE-NUMBER',
        AfeType.DRILLING,
      );

      afeRepository.findByAfeNumber.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(invalidCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(invalidCommand)).rejects.toThrow(
        'Failed to create AFE:',
      );
    });

    it('should throw BadRequestException for invalid estimated cost', async () => {
      // Arrange
      const invalidCommand = new CreateAfeCommand(
        'org-123',
        'AFE-2024-0001',
        AfeType.DRILLING,
        undefined,
        undefined,
        -1000, // Invalid negative cost
      );

      afeRepository.findByAfeNumber.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(invalidCommand)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      afeRepository.findByAfeNumber.mockResolvedValue(null);
      afeRepository.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Failed to create AFE: Database error',
      );
    });

    it('should clear domain events after publishing', async () => {
      // Arrange
      afeRepository.findByAfeNumber.mockResolvedValue(null);
      afeRepository.save.mockImplementation((afe: Afe) => {
        // Verify events exist before clearing
        expect(afe.getDomainEvents()).toHaveLength(1);
        return Promise.resolve(afe);
      });

      // Act
      await handler.execute(validCommand);

      // Assert
      const savedAfe = (afeRepository.save.mock as any).calls[0][0];
      // Events should be cleared after publishing
      expect(savedAfe.getDomainEvents()).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should preserve ConflictException', async () => {
      // Arrange
      const existingAfe = {} as Afe;
      afeRepository.findByAfeNumber.mockResolvedValue(existingAfe);

      // Act & Assert
      await expect(
        handler.execute(
          new CreateAfeCommand('org-123', 'AFE-2024-0001', AfeType.DRILLING),
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should wrap unknown errors in BadRequestException', async () => {
      // Arrange
      afeRepository.findByAfeNumber.mockRejectedValue(
        new Error('Unknown error'),
      );

      // Act & Assert
      await expect(
        handler.execute(
          new CreateAfeCommand('org-123', 'AFE-2024-0001', AfeType.DRILLING),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      afeRepository.findByAfeNumber.mockRejectedValue('String error');

      // Act & Assert
      await expect(
        handler.execute(
          new CreateAfeCommand('org-123', 'AFE-2024-0001', AfeType.DRILLING),
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        handler.execute(
          new CreateAfeCommand('org-123', 'AFE-2024-0001', AfeType.DRILLING),
        ),
      ).rejects.toThrow('Failed to create AFE: Unknown error');
    });
  });
});
