import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JobSchedulerService } from '../job-scheduler.service';
import { BullMQConfigService } from '../../config/bullmq-config.service';

describe('JobSchedulerService', () => {
  let service: JobSchedulerService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('redis://localhost:6379'),
    };

    const mockBullMQConfig = {
      getQueue: jest.fn(),
      getWorker: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobSchedulerService,
        {
          provide: BullMQConfigService,
          useValue: mockBullMQConfig,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<JobSchedulerService>(JobSchedulerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
