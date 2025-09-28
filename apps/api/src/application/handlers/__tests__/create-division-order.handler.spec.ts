import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { CreateDivisionOrderHandler } from '../create-division-order.handler';
import { CreateDivisionOrderCommand } from '../../commands/create-division-order.command';
import type { IDivisionOrderRepository } from '../../../domain/repositories/division-order.repository.interface';
import { DivisionOrder } from '../../../domain/entities/division-order.entity';
import { DecimalInterest } from '../../../domain/value-objects/decimal-interest';

// Mock randomUUID
jest.mock('crypto', () => ({
  randomUUID: jest.fn(),
}));
const mockRandomUUID = require('crypto').randomUUID;

// Mock DivisionOrder
jest.mock('../../../domain/entities/division-order.entity');
const MockDivisionOrder = DivisionOrder as jest.MockedClass<
  typeof DivisionOrder
>;
(MockDivisionOrder.create as jest.MockedFunction<typeof DivisionOrder.create>) =
  jest.fn();

// Mock DecimalInterest
jest.mock('../../../domain/value-objects/decimal-interest');
const MockDecimalInterest = DecimalInterest as jest.MockedClass<
  typeof DecimalInterest
>;

describe('CreateDivisionOrderHandler', () => {
  let handler: CreateDivisionOrderHandler;
  let divisionOrderRepository: jest.Mocked<IDivisionOrderRepository>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockRandomUUID.mockReturnValue('division-order-123');

    const mockDivisionOrderRepository = {
      findOverlapping: jest.fn(),
      validateDecimalInterestTotals: jest.fn(),
      save: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateDivisionOrderHandler,
        {
          provide: 'DivisionOrderRepository',
          useValue: mockDivisionOrderRepository,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<CreateDivisionOrderHandler>(
      CreateDivisionOrderHandler,
    );
    divisionOrderRepository = module.get('DivisionOrderRepository');
    eventBus = module.get(EventBus);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    const command = new CreateDivisionOrderCommand(
      'org-123',
      'well-456',
      'partner-789',
      0.5,
      new Date('2023-01-01'),
      new Date('2023-12-31'),
    );

    it('should create division order successfully', async () => {
      // Arrange
      const mockDecimalInterest = { getValue: jest.fn().mockReturnValue(0.5) };
      const mockDivisionOrder = {
        getId: jest.fn().mockReturnValue('division-order-123'),
        getDomainEvents: jest.fn().mockReturnValue([]),
        clearDomainEvents: jest.fn(),
      };

      MockDecimalInterest.mockImplementation(() => mockDecimalInterest as any);
      divisionOrderRepository.findOverlapping.mockResolvedValue([]);
      divisionOrderRepository.validateDecimalInterestTotals.mockResolvedValue({
        isValid: true,
        totalInterest: {
          add: jest
            .fn()
            .mockReturnValue({ getValue: jest.fn().mockReturnValue(0.5) }),
        } as any,
        divisionOrders: [],
      });
      (MockDivisionOrder.create as jest.Mock).mockReturnValue(
        mockDivisionOrder as any,
      );
      divisionOrderRepository.save.mockResolvedValue(mockDivisionOrder as any);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBe('division-order-123');
      expect(MockDecimalInterest).toHaveBeenCalledWith(0.5);
      expect(divisionOrderRepository.findOverlapping).toHaveBeenCalledWith(
        'well-456',
        'partner-789',
        new Date('2023-01-01'),
        new Date('2023-12-31'),
      );
      expect(
        divisionOrderRepository.validateDecimalInterestTotals,
      ).toHaveBeenCalledWith('well-456', new Date('2023-01-01'));
      expect(MockDivisionOrder.create).toHaveBeenCalledWith(
        'org-123',
        'well-456',
        'partner-789',
        mockDecimalInterest,
        new Date('2023-01-01'),
        { endDate: new Date('2023-12-31') },
      );
      expect(divisionOrderRepository.save).toHaveBeenCalledWith(
        mockDivisionOrder,
      );
      expect(eventBus.publish).not.toHaveBeenCalled(); // No events in this case
      expect(mockDivisionOrder.clearDomainEvents).toHaveBeenCalled();
    });

    it('should throw ConflictException if overlapping division orders exist', async () => {
      // Arrange
      const mockDecimalInterest = { getValue: jest.fn().mockReturnValue(0.5) };
      const overlappingOrder = { id: 'overlapping-123' } as any;

      MockDecimalInterest.mockImplementation(() => mockDecimalInterest as any);
      divisionOrderRepository.findOverlapping.mockResolvedValue([
        overlappingOrder,
      ]);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Division order overlaps with existing order for partner partner-789 in well well-456',
      );
    });

    it('should throw BadRequestException if decimal interest exceeds 100%', async () => {
      // Arrange
      const mockDecimalInterest = {
        getValue: jest.fn().mockReturnValue(0.5),
        getFormattedPercentage: jest.fn().mockReturnValue('50.00%'),
      };
      const totalInterest = {
        add: jest.fn().mockReturnValue({
          getValue: jest.fn().mockReturnValue(1.1), // Exceeds 1.0
        }),
        getFormattedPercentage: jest.fn().mockReturnValue('60.00%'),
      };

      MockDecimalInterest.mockImplementation(() => mockDecimalInterest as any);
      divisionOrderRepository.findOverlapping.mockResolvedValue([]);
      divisionOrderRepository.validateDecimalInterestTotals.mockResolvedValue({
        isValid: true,
        totalInterest: totalInterest as any,
        divisionOrders: [],
      });

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Adding this decimal interest (50.00%) would exceed 100%. Current total: 60.00%',
      );
    });
  });
});
