import { Test, TestingModule } from '@nestjs/testing';
import { SubmitRegulatoryReportHandler } from '../submit-regulatory-report.handler';
import { ReportSubmissionService } from '../../services/report-submission.service';

describe('SubmitRegulatoryReportHandler', () => {
  let handler: SubmitRegulatoryReportHandler;

  beforeEach(async () => {
    const mockReportSubmissionService = {
      submit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmitRegulatoryReportHandler,
        {
          provide: ReportSubmissionService,
          useValue: mockReportSubmissionService,
        },
      ],
    }).compile();

    handler = module.get<SubmitRegulatoryReportHandler>(
      SubmitRegulatoryReportHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
