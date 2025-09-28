import { Test, TestingModule } from '@nestjs/testing';
import { ValidateRegulatoryReportHandler } from '../validate-regulatory-report.handler';
import { ReportValidationService } from '../../services/report-validation.service';

describe('ValidateRegulatoryReportHandler', () => {
  let handler: ValidateRegulatoryReportHandler;

  beforeEach(async () => {
    const mockReportValidationService = {
      validate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateRegulatoryReportHandler,
        {
          provide: ReportValidationService,
          useValue: mockReportValidationService,
        },
      ],
    }).compile();

    handler = module.get<ValidateRegulatoryReportHandler>(
      ValidateRegulatoryReportHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
