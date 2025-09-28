import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { ReassignCurativeItemHandler } from '../reassign-curative-item.handler';

describe('ReassignCurativeItemHandler', () => {
  let handler: ReassignCurativeItemHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReassignCurativeItemHandler,
        {
          provide: 'CurativeItemRepository',
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: 'CurativeActivityRepository',
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: EventBus,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<ReassignCurativeItemHandler>(
      ReassignCurativeItemHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
