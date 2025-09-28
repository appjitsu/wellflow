import { Test, TestingModule } from '@nestjs/testing';
import { GetRegulatoryReportStatusHandler } from '../get-regulatory-report-status.handler';

describe('GetRegulatoryReportStatusHandler', () => {
  let service: GetRegulatoryReportStatusHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetRegulatoryReportStatusHandler,
        {
          provide: 'ReportInstanceRepository',
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GetRegulatoryReportStatusHandler>(
      GetRegulatoryReportStatusHandler,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
