import { Test, TestingModule } from '@nestjs/testing';
import { DailyDrillingReportRepository } from '../daily-drilling-report.repository';
import { DatabaseService } from '../../../database/database.service';

describe('DailyDrillingReportRepository', () => {
  let service: DailyDrillingReportRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyDrillingReportRepository,
        {
          provide: DatabaseService,
          useValue: {
            getDb: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DailyDrillingReportRepository>(
      DailyDrillingReportRepository,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
