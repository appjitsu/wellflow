import { Test, TestingModule } from '@nestjs/testing';
import { ReportGenerationProcessor } from '../report-generation.processor';
import { BullMQConfigService } from '../../config/bullmq-config.service';

describe('ReportGenerationProcessor', () => {
  let processor: ReportGenerationProcessor;
  let mockBullMQConfig: jest.Mocked<BullMQConfigService>;

  beforeEach(async () => {
    // Create mock for BullMQConfigService
    mockBullMQConfig = {
      getQueueConfig: jest.fn(),
      getRedisConnection: jest.fn(),
      registerWorker: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportGenerationProcessor,
        {
          provide: BullMQConfigService,
          useValue: mockBullMQConfig,
        },
      ],
    }).compile();

    processor = module.get<ReportGenerationProcessor>(
      ReportGenerationProcessor,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize worker on module init', async () => {
      // Mock queue config
      mockBullMQConfig.getQueueConfig.mockReturnValue({
        name: 'report-generation',
        workerOptions: { concurrency: 2 },
      });

      // Mock Redis connection
      const mockRedis = {};
      mockBullMQConfig.getRedisConnection.mockReturnValue(mockRedis as any);

      // Call onModuleInit
      await processor.onModuleInit();

      // Verify worker was registered
      expect(mockBullMQConfig.registerWorker).toHaveBeenCalled();
    });
  });
});
