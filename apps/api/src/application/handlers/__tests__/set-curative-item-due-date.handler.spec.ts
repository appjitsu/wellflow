import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { SetCurativeItemDueDateHandler } from '../set-curative-item-due-date.handler';

describe('SetCurativeItemDueDateHandler', () => {
  let handler: SetCurativeItemDueDateHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SetCurativeItemDueDateHandler,
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

    handler = module.get<SetCurativeItemDueDateHandler>(
      SetCurativeItemDueDateHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
