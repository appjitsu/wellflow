import { Test, TestingModule } from '@nestjs/testing';
import { ReportSubmissionService } from '../report-submission.service';
import { AdapterRegistryService } from '../adapter-registry.service';
import { CircuitBreaker } from '../../../../common/resilience/circuit-breaker';

describe('ReportSubmissionService', () => {
  let service: ReportSubmissionService;

  beforeEach(async () => {
    const mockReportInstanceRepository = {} as any;
    const mockAdapterRegistryService = {} as any;
    const mockCircuitBreaker = {} as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportSubmissionService,
        {
          provide: 'ReportInstanceRepository',
          useValue: mockReportInstanceRepository,
        },
        {
          provide: AdapterRegistryService,
          useValue: mockAdapterRegistryService,
        },
        {
          provide: CircuitBreaker,
          useValue: mockCircuitBreaker,
        },
      ],
    }).compile();

    service = module.get(ReportSubmissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
