import { Test, TestingModule } from '@nestjs/testing';
import { JobMetricsController } from '../job-metrics.controller';
import { JobMetricsService } from '../../services/job-metrics.service';

describe('JobMetricsController', () => {
  let controller: JobMetricsController;

  beforeEach(async () => {
    const mockJobMetricsService = {
      getSystemMetrics: jest.fn(),
      getAllQueueMetrics: jest.fn(),
      getQueueMetrics: jest.fn(),
      getJobMetrics: jest.fn(),
      getJobMetricsByTimeRange: jest.fn(),
      getJobMetricsByOrganization: jest.fn(),
      clearOldMetrics: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobMetricsController],
      providers: [
        {
          provide: JobMetricsService,
          useValue: mockJobMetricsService,
        },
      ],
    }).compile();

    controller = module.get<JobMetricsController>(JobMetricsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
