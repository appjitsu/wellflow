import { Test, TestingModule } from '@nestjs/testing';
import { FinalizeLosHandler } from '../finalize-los.handler';
import { EventBus } from '@nestjs/cqrs';

describe('FinalizeLosHandler', () => {
  let service: FinalizeLosHandler;

  beforeEach(async () => {
    const mockRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinalizeLosHandler,
        {
          provide: 'LosRepository',
          useValue: mockRepo,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    service = module.get<FinalizeLosHandler>(FinalizeLosHandler);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
