import { Test, TestingModule } from '@nestjs/testing';
import { GenerateRegulatoryReportHandler } from '../generate-regulatory-report.handler';
import { ReportGenerationService } from '../../services/report-generation.service';

describe('GenerateRegulatoryReportHandler', () => {
  let service: GenerateRegulatoryReportHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateRegulatoryReportHandler,
        {
          provide: ReportGenerationService,
          useValue: {
            generate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GenerateRegulatoryReportHandler>(
      GenerateRegulatoryReportHandler,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
