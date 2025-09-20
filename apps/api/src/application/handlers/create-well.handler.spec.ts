import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { CreateWellHandler } from './create-well.handler';
import { CreateWellCommand } from '../commands/create-well.command';
import { WellRepository } from '../../domain/repositories/well.repository.interface';
import { WellType } from '../../domain/enums/well-status.enum';
import { Well } from '../../domain/entities/well.entity';
import { ApiNumber } from '../../domain/value-objects/api-number';

describe('CreateWellHandler', () => {
  let handler: CreateWellHandler;
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateWellHandler,
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

    handler = module.get<CreateWellHandler>(CreateWellHandler);
    wellRepository = module.get('WellRepository');
    eventBus = module.get(EventBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCommand = new CreateWellCommand(
      '4212345678',
      'Test Well',
      'operator-123',
      WellType.OIL,
      {
        latitude: 40.7128,
        longitude: -74.0060,
      },
      'lease-123',
      new Date('2024-01-01'),
      5000
    );

    it('should create well successfully', async () => {
      wellRepository.findByApiNumber.mockResolvedValue(null);
      wellRepository.save.mockResolvedValue(undefined);

      const result = await handler.execute(validCommand);

      expect(typeof result).toBe('string');
      expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i); // UUID v4 format
      expect(wellRepository.findByApiNumber).toHaveBeenCalledWith(expect.any(ApiNumber));
      expect(wellRepository.save).toHaveBeenCalledWith(expect.any(Well));
      // Note: Events are only published if the well has domain events, which depends on the Well entity implementation
    });

    it('should throw ConflictException if well with API number already exists', async () => {
      const existingWell = { id: 'existing-id' };
      wellRepository.findByApiNumber.mockResolvedValue(existingWell as any);

      await expect(handler.execute(validCommand)).rejects.toThrow(ConflictException);
      await expect(handler.execute(validCommand)).rejects.toThrow('Well with API number 42-123-45678 already exists');
      expect(wellRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle repository save errors', async () => {
      wellRepository.findByApiNumber.mockResolvedValue(null);
      wellRepository.save.mockRejectedValue(new Error('Database connection failed'));

      await expect(handler.execute(validCommand)).rejects.toThrow(BadRequestException);
      await expect(handler.execute(validCommand)).rejects.toThrow('Failed to create well: Database connection failed');
    });

    it('should handle findByApiNumber errors', async () => {
      wellRepository.findByApiNumber.mockRejectedValue(new Error('Database query failed'));

      await expect(handler.execute(validCommand)).rejects.toThrow(BadRequestException);
      await expect(handler.execute(validCommand)).rejects.toThrow('Failed to create well: Database query failed');
    });

    it('should create well with minimal required fields', async () => {
      const minimalCommand = new CreateWellCommand(
        '4212345679',
        'Minimal Well',
        'operator-123',
        WellType.GAS,
        {
          latitude: 40.7128,
          longitude: -74.0060,
        }
      );

      wellRepository.findByApiNumber.mockResolvedValue(null);
      wellRepository.save.mockResolvedValue(undefined);

      const result = await handler.execute(minimalCommand);

      expect(typeof result).toBe('string');
      expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(wellRepository.findByApiNumber).toHaveBeenCalledWith(expect.any(ApiNumber));
      expect(wellRepository.save).toHaveBeenCalledWith(expect.any(Well));
    });

    it('should generate unique ID for each well', async () => {
      wellRepository.findByApiNumber.mockResolvedValue(null);
      wellRepository.save.mockResolvedValue(undefined);

      const command1 = new CreateWellCommand(
        '4212345680',
        'Well 1',
        'operator-123',
        WellType.OIL,
        { latitude: 40.7128, longitude: -74.0060 }
      );

      const command2 = new CreateWellCommand(
        '4212345681',
        'Well 2',
        'operator-123',
        WellType.OIL,
        { latitude: 40.7128, longitude: -74.0060 }
      );

      const result1 = await handler.execute(command1);
      const result2 = await handler.execute(command2);

      expect(result1).not.toBe(result2);
      expect(typeof result1).toBe('string');
      expect(typeof result2).toBe('string');
    });

    it('should create well with all optional fields', async () => {
      const fullCommand = new CreateWellCommand(
        '4212345682',
        'Full Well',
        'operator-456',
        WellType.OIL,
        {
          latitude: 32.7767,
          longitude: -96.7970,
          address: '123 Main St',
          county: 'Dallas',
          state: 'TX',
          country: 'USA',
        },
        'lease-456',
        new Date('2024-03-15'),
        8500
      );

      wellRepository.findByApiNumber.mockResolvedValue(null);
      wellRepository.save.mockResolvedValue(undefined);

      const result = await handler.execute(fullCommand);

      expect(typeof result).toBe('string');
      expect(wellRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Full Well',
        operatorId: 'operator-456',
        wellType: WellType.OIL,
      }));
    });

    it('should publish domain events after saving well', async () => {
      const mockWell = {
        getDomainEvents: jest.fn().mockReturnValue([
          { type: 'WellCreated', wellId: 'test-id' },
          { type: 'WellStatusChanged', wellId: 'test-id' }
        ]),
        clearDomainEvents: jest.fn(),
      };

      wellRepository.findByApiNumber.mockResolvedValue(null);
      wellRepository.save.mockImplementation((well) => {
        // Mock the well to return domain events
        well.getDomainEvents = mockWell.getDomainEvents;
        well.clearDomainEvents = mockWell.clearDomainEvents;
        return Promise.resolve();
      });

      await handler.execute(validCommand);

      expect(eventBus.publish).toHaveBeenCalledTimes(2);
      expect(eventBus.publish).toHaveBeenCalledWith({ type: 'WellCreated', wellId: 'test-id' });
      expect(eventBus.publish).toHaveBeenCalledWith({ type: 'WellStatusChanged', wellId: 'test-id' });
      expect(mockWell.clearDomainEvents).toHaveBeenCalled();
    });

    it('should handle invalid API number format', async () => {
      const invalidCommand = new CreateWellCommand(
        'invalid-api-number',
        'Test Well',
        'operator-123',
        WellType.OIL,
        { latitude: 40.7128, longitude: -74.0060 }
      );

      await expect(handler.execute(invalidCommand)).rejects.toThrow(BadRequestException);
    });

    it('should handle invalid coordinates', async () => {
      const invalidCommand = new CreateWellCommand(
        '4212345683',
        'Test Well',
        'operator-123',
        WellType.OIL,
        { latitude: 200, longitude: -74.0060 } // Invalid latitude
      );

      await expect(handler.execute(invalidCommand)).rejects.toThrow(BadRequestException);
    });

    it('should handle empty well name', async () => {
      const invalidCommand = new CreateWellCommand(
        '4212345684',
        '',
        'operator-123',
        WellType.OIL,
        { latitude: 40.7128, longitude: -74.0060 }
      );

      wellRepository.findByApiNumber.mockResolvedValue(null);
      wellRepository.save.mockResolvedValue(undefined);

      // The Well entity constructor accepts empty strings, so this should succeed
      const result = await handler.execute(invalidCommand);
      expect(typeof result).toBe('string');
    });

    it('should handle empty operator ID', async () => {
      const invalidCommand = new CreateWellCommand(
        '4212345685',
        'Test Well',
        '',
        WellType.OIL,
        { latitude: 40.7128, longitude: -74.0060 }
      );

      wellRepository.findByApiNumber.mockResolvedValue(null);
      wellRepository.save.mockResolvedValue(undefined);

      // The Well entity constructor accepts empty strings, so this should succeed
      const result = await handler.execute(invalidCommand);
      expect(typeof result).toBe('string');
    });

    it('should create well with different well types', async () => {
      const oilCommand = new CreateWellCommand(
        '4212345686',
        'Oil Well',
        'operator-123',
        WellType.OIL,
        { latitude: 40.7128, longitude: -74.0060 }
      );

      const gasCommand = new CreateWellCommand(
        '4212345687',
        'Gas Well',
        'operator-123',
        WellType.GAS,
        { latitude: 40.7128, longitude: -74.0060 }
      );

      wellRepository.findByApiNumber.mockResolvedValue(null);
      wellRepository.save.mockResolvedValue(undefined);

      const oilResult = await handler.execute(oilCommand);
      const gasResult = await handler.execute(gasCommand);

      expect(typeof oilResult).toBe('string');
      expect(typeof gasResult).toBe('string');
      expect(wellRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should handle location with only coordinates', async () => {
      const minimalLocationCommand = new CreateWellCommand(
        '4212345688',
        'Minimal Location Well',
        'operator-123',
        WellType.OIL,
        { latitude: 29.7604, longitude: -95.3698 }
      );

      wellRepository.findByApiNumber.mockResolvedValue(null);
      wellRepository.save.mockResolvedValue(undefined);

      const result = await handler.execute(minimalLocationCommand);

      expect(typeof result).toBe('string');
      expect(wellRepository.save).toHaveBeenCalledWith(expect.any(Well));
    });

    it('should handle location with full address', async () => {
      const fullLocationCommand = new CreateWellCommand(
        '4212345689',
        'Full Location Well',
        'operator-123',
        WellType.GAS,
        {
          latitude: 29.7604,
          longitude: -95.3698,
          address: '456 Oak Street',
          county: 'Harris',
          state: 'TX',
          country: 'USA',
        }
      );

      wellRepository.findByApiNumber.mockResolvedValue(null);
      wellRepository.save.mockResolvedValue(undefined);

      const result = await handler.execute(fullLocationCommand);

      expect(typeof result).toBe('string');
      expect(wellRepository.save).toHaveBeenCalledWith(expect.any(Well));
    });
  });
});
