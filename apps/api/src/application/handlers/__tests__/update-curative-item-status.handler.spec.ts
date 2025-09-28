import { Test, TestingModule } from '@nestjs/testing';
import { UpdateCurativeItemStatusHandler } from '../update-curative-item-status.handler';
import { EventBus } from '@nestjs/cqrs';

describe('UpdateCurativeItemStatusHandler', () => {
  let service: UpdateCurativeItemStatusHandler;

  beforeEach(async () => {
    const mockRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const mockActivityRepo = {
      create: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCurativeItemStatusHandler,
        {
          provide: 'CurativeItemRepository',
          useValue: mockRepo,
        },
        {
          provide: 'CurativeActivityRepository',
          useValue: mockActivityRepo,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    service = module.get<UpdateCurativeItemStatusHandler>(
      UpdateCurativeItemStatusHandler,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
