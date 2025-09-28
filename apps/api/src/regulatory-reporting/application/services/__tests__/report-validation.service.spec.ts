import { Test, TestingModule } from '@nestjs/testing';
import { ReportValidationService } from '../report-validation.service';
import { NormalizedProductionService } from '../normalized-production.service';

describe('ReportValidationService', () => {
  let service: ReportValidationService;

  beforeEach(async () => {
    const mockReportInstanceRepository = {
      findById: jest.fn(),
    };

    const mockNormalizedProductionService = {
      buildMonthlyForOrganization: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportValidationService,
        {
          provide: 'ReportInstanceRepository',
          useValue: mockReportInstanceRepository,
        },
        {
          provide: NormalizedProductionService,
          useValue: mockNormalizedProductionService,
        },
      ],
    }).compile();

    service = module.get<ReportValidationService>(ReportValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
