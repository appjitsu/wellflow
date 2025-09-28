import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { DistributeLosHandler } from '../distribute-los.handler';
import { DistributeLosCommand } from '../../commands/distribute-los.command';
import type { ILosRepository } from '../../../domain/repositories/lease-operating-statement.repository.interface';

describe('DistributeLosHandler', () => {
  let handler: DistributeLosHandler;
  let losRepository: jest.Mocked<ILosRepository>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockLosRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DistributeLosHandler,
        {
          provide: 'LosRepository',
          useValue: mockLosRepository,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<DistributeLosHandler>(DistributeLosHandler);
    losRepository = module.get('LosRepository');
    eventBus = module.get(EventBus);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    const command = new DistributeLosCommand('los-123', 'user-456', 'email', 5);

    it('should distribute LOS successfully', async () => {
      // Arrange
      const mockLos = {
        distribute: jest.fn(),
        getDomainEvents: jest.fn().mockReturnValue([]),
        clearDomainEvents: jest.fn(),
      } as any;

      losRepository.findById.mockResolvedValue(mockLos);
      losRepository.save.mockResolvedValue(mockLos);

      // Act
      await handler.execute(command);

      // Assert
      expect(losRepository.findById).toHaveBeenCalledWith('los-123');
      expect(mockLos.distribute).toHaveBeenCalledWith('user-456', 'email', 5);
      expect(losRepository.save).toHaveBeenCalledWith(mockLos);
      expect(mockLos.getDomainEvents).toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled(); // No events in this case
      expect(mockLos.clearDomainEvents).toHaveBeenCalled();
    });

    it('should throw NotFoundException if LOS does not exist', async () => {
      // Arrange
      losRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Lease Operating Statement with ID los-123 not found',
      );
    });

    it('should publish domain events if any', async () => {
      // Arrange
      const mockEvent = { eventType: 'LosDistributedEvent' };
      const mockLos = {
        distribute: jest.fn(),
        getDomainEvents: jest.fn().mockReturnValue([mockEvent]),
        clearDomainEvents: jest.fn(),
      } as any;

      losRepository.findById.mockResolvedValue(mockLos);
      losRepository.save.mockResolvedValue(mockLos);

      // Act
      await handler.execute(command);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledWith(mockEvent);
      expect(mockLos.clearDomainEvents).toHaveBeenCalled();
    });
  });
});
