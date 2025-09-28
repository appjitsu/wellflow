import { Test, TestingModule } from '@nestjs/testing';
import { DailyDrillingReportsController } from '../daily-drilling-reports.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

describe('DailyDrillingReportsController', () => {
  let service: DailyDrillingReportsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyDrillingReportsController,
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: QueryBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DailyDrillingReportsController>(
      DailyDrillingReportsController,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
