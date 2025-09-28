import { Test, TestingModule } from '@nestjs/testing';
import { JobSchedulerController } from '../job-scheduler.controller';
import { JobSchedulerService } from '../../services/job-scheduler.service';

describe('JobSchedulerController', () => {
  let controller: JobSchedulerController;

  const mockJobSchedulerService = {
    getScheduledJobs: jest.fn(),
    getScheduledJob: jest.fn(),
    scheduleJob: jest.fn(),
    updateScheduledJob: jest.fn(),
    unscheduleJob: jest.fn(),
    toggleScheduledJob: jest.fn(),
    getSchedulerStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobSchedulerController],
      providers: [
        {
          provide: JobSchedulerService,
          useValue: mockJobSchedulerService,
        },
      ],
    }).compile();

    controller = module.get<JobSchedulerController>(JobSchedulerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
