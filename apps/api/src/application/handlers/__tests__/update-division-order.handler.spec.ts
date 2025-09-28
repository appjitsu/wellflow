import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { UpdateDivisionOrderHandler } from '../update-division-order.handler';
import { IDivisionOrderRepository } from '../../../domain/repositories/division-order.repository.interface';

describe('UpdateDivisionOrderHandler', () => {
  let handler: UpdateDivisionOrderHandler;
  let _divisionOrderRepository: IDivisionOrderRepository;
  let _eventBus: EventBus;

  beforeEach(async () => {
    const mockDivisionOrderRepository = {
      findById: jest.fn(),
      validateDecimalInterestTotals: jest.fn(),
      save: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateDivisionOrderHandler,
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

    handler = module.get<UpdateDivisionOrderHandler>(
      UpdateDivisionOrderHandler,
    );
    _divisionOrderRepository = module.get('DivisionOrderRepository');
    _eventBus = module.get(EventBus);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
