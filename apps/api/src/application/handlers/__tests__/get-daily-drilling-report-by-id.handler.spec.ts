import { Test, TestingModule } from '@nestjs/testing';
import { GetDailyDrillingReportByIdHandler } from '../get-daily-drilling-report-by-id.handler';

describe('GetDailyDrillingReportByIdHandler', () => {
  let service: GetDailyDrillingReportByIdHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDailyDrillingReportByIdHandler,
        {
          provide: 'DailyDrillingReportRepository',
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GetDailyDrillingReportByIdHandler>(
      GetDailyDrillingReportByIdHandler,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
