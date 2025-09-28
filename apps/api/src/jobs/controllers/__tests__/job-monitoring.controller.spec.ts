import { Test, TestingModule } from '@nestjs/testing';
import { JobMonitoringController } from '../job-monitoring.controller';
import { JobQueueService } from '../../services/job-queue.service';
import { BullMQConfigService } from '../../config/bullmq-config.service';
import { Reflector } from '@nestjs/core';
import { AbilitiesFactory } from '../../../authorization/abilities.factory';

describe('JobMonitoringController', () => {
  let controller: JobMonitoringController;

  beforeEach(async () => {
    const mockJobQueueService = {
      getQueueStats: jest.fn(),
      pauseQueue: jest.fn(),
      resumeQueue: jest.fn(),
      cleanQueue: jest.fn(),
      getJobsByStatus: jest.fn(),
      retryJob: jest.fn(),
      removeJob: jest.fn(),
    };
    const mockBullMQConfigService = {
      getAllQueues: jest.fn().mockReturnValue([]),
    };
    const mockReflector = {} as any;
    const mockAbilitiesFactory = {} as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobMonitoringController],
      providers: [
        {
          provide: JobQueueService,
          useValue: mockJobQueueService,
        },
        {
          provide: BullMQConfigService,
          useValue: mockBullMQConfigService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: AbilitiesFactory,
          useValue: mockAbilitiesFactory,
        },
      ],
    }).compile();

    controller = module.get<JobMonitoringController>(JobMonitoringController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
