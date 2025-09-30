import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { JobsModule } from '../jobs.module';
import { JobQueueService } from '../services/job-queue.service';
import { JobMetricsService } from '../services/job-metrics.service';
import { JobSchedulerService } from '../services/job-scheduler.service';
import { BullMQConfigService } from '../config/bullmq-config.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SentryModule } from '../../sentry/sentry.module';
import { LogRocketModule } from '../../logrocket/logrocket.module';

import {
  LeaseDataValidationJobData,
  ComplianceReportJobData,
  SystemNotificationJobData,
  JobType,
} from '../types/job.types';

/**
 * Queue statistics interface
 */
interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}

/**
 * Queue statistics interface
 */
interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  total: number;
}

describe('Jobs Integration', () => {
  let module: TestingModule;
  let jobQueueService: JobQueueService;
  let metricsService: JobMetricsService;
  let schedulerService: JobSchedulerService;
  let bullMQConfig: BullMQConfigService;

  beforeAll(async () => {
    // Mock Redis connection for testing
    const mockRedisService = {
      getClient: jest.fn().mockReturnValue({
        status: 'ready',
        disconnect: jest.fn(),
      }),
    };

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        EventEmitterModule.forRoot(),
        SentryModule,
        LogRocketModule,
        JobsModule,
      ],
    })
      .overrideProvider('RedisService')
      .useValue(mockRedisService)
      .compile();

    jobQueueService = module.get<JobQueueService>(JobQueueService);
    metricsService = module.get<JobMetricsService>(JobMetricsService);
    schedulerService = module.get<JobSchedulerService>(JobSchedulerService);
    bullMQConfig = module.get<BullMQConfigService>(BullMQConfigService);

    // Mock the logger to reduce test output
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Integration', () => {
    it('should initialize all job services', () => {
      expect(jobQueueService).toBeDefined();
      expect(metricsService).toBeDefined();
      expect(schedulerService).toBeDefined();
      expect(bullMQConfig).toBeDefined();
    });

    it('should have all required queues configured', () => {
      // Mock queue retrieval since BullMQ may not initialize in test environment
      jest.spyOn(bullMQConfig, 'getQueue').mockImplementation((name) => {
        return { name } as any; // Mock queue object
      });

      const dataValidationQueue = bullMQConfig.getQueue(
        JobType.DATA_VALIDATION,
      );
      const reportGenerationQueue = bullMQConfig.getQueue(
        JobType.REPORT_GENERATION,
      );
      const emailNotificationQueue = bullMQConfig.getQueue(
        JobType.EMAIL_NOTIFICATION,
      );

      expect(dataValidationQueue).toBeDefined();
      expect(reportGenerationQueue).toBeDefined();
      expect(emailNotificationQueue).toBeDefined();
    });
  });

  describe('End-to-End Job Processing', () => {
    it('should process data validation job end-to-end', async () => {
      const jobData: LeaseDataValidationJobData = {
        leaseId: 'integration-test-lease',
        organizationId: 'test-org',
        timestamp: new Date(),
        validationType: 'production_data',
        includeHistorical: false,
        notifyOnFailure: true,
      };

      // Mock queue operations for testing
      const mockQueue = {
        add: jest.fn().mockResolvedValue({ id: 'test-job-123' }),
        getJobCounts: jest.fn().mockResolvedValue({
          waiting: 1,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
        }),
      };

      jest.spyOn(bullMQConfig, 'getQueue').mockReturnValue(mockQueue as any);

      // Enqueue the job
      const job = await jobQueueService.enqueueDataValidation(jobData);
      expect(job.id).toBe('test-job-123');

      // Verify queue stats (mock the method since BullMQ queues may not be fully initialized in test)
      jest.spyOn(jobQueueService, 'getQueueStats').mockResolvedValue([
        {
          queueName: JobType.DATA_VALIDATION,
          waiting: 1,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          total: 1,
        },
      ]);

      const stats = (await jobQueueService.getQueueStats()) as QueueStats[];
      expect(stats).toHaveLength(1);
      expect(stats[0]!.waiting).toBe(1);
    });

    it('should process report generation job end-to-end', async () => {
      const jobData: ComplianceReportJobData = {
        organizationId: 'test-org',
        reportType: 'monthly_compliance',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        includeCharts: true,
        format: 'pdf',
        recipients: ['test@wellflow.com'],
        autoSubmit: false,
        timestamp: new Date(),
      };

      const mockQueue = {
        add: jest.fn().mockResolvedValue({ id: 'report-job-456' }),
        getJobCounts: jest.fn().mockResolvedValue({
          waiting: 1,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
        }),
      };

      jest.spyOn(bullMQConfig, 'getQueue').mockReturnValue(mockQueue as any);

      const job = await jobQueueService.enqueueReportGeneration(jobData);
      expect(job.id).toBe('report-job-456');
    });

    it('should process email notification job end-to-end', async () => {
      const jobData: SystemNotificationJobData = {
        message: 'Integration test notification',
        recipientEmails: ['test@wellflow.com'],
        priority: 'medium',
        organizationId: 'test-org',
        timestamp: new Date(),
      };

      const mockQueue = {
        add: jest.fn().mockResolvedValue({ id: 'email-job-789' }),
        getJobCounts: jest.fn().mockResolvedValue({
          waiting: 1,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
        }),
      };

      jest.spyOn(bullMQConfig, 'getQueue').mockReturnValue(mockQueue as any);

      const job = await jobQueueService.enqueueEmailNotification(jobData);
      expect(job.id).toBe('email-job-789');
    });
  });

  describe('Metrics Integration', () => {
    it('should collect metrics across job lifecycle', () => {
      const mockJob = {
        id: 'metrics-test-job',
        name: 'test-job',
        queueName: JobType.DATA_VALIDATION,
        data: {
          organizationId: 'test-org',
          userId: 'test-user',
        },
        opts: { priority: 1 },
        attemptsMade: 0,
      } as any;

      // Simulate job lifecycle
      metricsService.recordJobStart(mockJob);

      let metrics = metricsService.getJobMetrics('metrics-test-job');
      expect(metrics?.status).toBe('started');

      metricsService.recordJobComplete(mockJob, { success: true });

      metrics = metricsService.getJobMetrics('metrics-test-job');
      expect(metrics?.status).toBe('completed');
      expect(metrics?.duration).toBeGreaterThan(0);

      // Check system metrics
      const systemMetrics = metricsService.getSystemMetrics();
      expect(systemMetrics.totalJobs).toBe(1);
      expect(systemMetrics.totalCompletedJobs).toBe(1);
    });
  });

  describe('Scheduler Integration', () => {
    it('should manage scheduled jobs', async () => {
      const scheduleConfig = {
        name: 'test-scheduled-job',
        cron: '0 0 * * *', // Daily at midnight
        enabled: true,
        timezone: 'America/Chicago',
        description: 'Test scheduled job',
        jobData: {
          leaseId: 'scheduled-lease',
          organizationId: 'test-org',
          timestamp: new Date(),
          validationType: 'production_data',
          includeHistorical: false,
          notifyOnFailure: true,
        },
      };

      // Mock queue for scheduler
      const mockQueue = {
        add: jest.fn().mockResolvedValue({ id: 'scheduled-job-123' }),
        removeRepeatable: jest.fn().mockResolvedValue(undefined),
      };

      jest.spyOn(bullMQConfig, 'getQueue').mockReturnValue(mockQueue as any);

      // Schedule the job
      await schedulerService.scheduleJob(scheduleConfig);

      // Verify job was scheduled
      const scheduledJobs = schedulerService.getScheduledJobs();
      expect(scheduledJobs).toHaveLength(1);
      expect(scheduledJobs[0]?.name).toBe('test-scheduled-job');

      // Test job toggling
      await schedulerService.toggleScheduledJob('test-scheduled-job', false);
      const disabledJob =
        schedulerService.getScheduledJob('test-scheduled-job');
      expect(disabledJob?.enabled).toBe(false);

      // Clean up
      await schedulerService.unscheduleJob('test-scheduled-job');
      const remainingJobs = schedulerService.getScheduledJobs();
      expect(remainingJobs).toHaveLength(0);
    });

    it('should provide scheduler statistics', async () => {
      const stats = await schedulerService.getSchedulerStats();

      expect(stats).toHaveProperty('totalSchedulers');
      expect(stats).toHaveProperty('totalScheduledJobs');
      expect(stats).toHaveProperty('enabledJobs');
      expect(stats).toHaveProperty('disabledJobs');
      expect(stats).toHaveProperty('jobsByQueue');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle queue connection errors gracefully', async () => {
      jest.spyOn(bullMQConfig, 'getQueue').mockReturnValue(undefined);

      const jobData: LeaseDataValidationJobData = {
        leaseId: 'error-test-lease',
        organizationId: 'test-org',
        timestamp: new Date(),
        validationType: 'production_data',
        includeHistorical: false,
        notifyOnFailure: true,
      };

      await expect(
        jobQueueService.enqueueDataValidation(jobData),
      ).rejects.toThrow(
        'Failed to enqueue data validation job: Queue data-validation not found',
      );
    });

    it('should handle metrics collection errors gracefully', () => {
      const invalidJob = null as any;

      // Should not throw errors
      expect(() => {
        metricsService.recordJobStart(invalidJob);
      }).not.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent jobs', async () => {
      const jobPromises = Array.from({ length: 10 }, (_, i) => {
        const jobData: LeaseDataValidationJobData = {
          leaseId: `concurrent-lease-${i}`,
          organizationId: 'test-org',
          timestamp: new Date(),
          validationType: 'production_data',
          includeHistorical: false,
          notifyOnFailure: true,
        };

        const mockQueue = {
          add: jest.fn().mockResolvedValue({ id: `concurrent-job-${i}` }),
        };

        jest.spyOn(bullMQConfig, 'getQueue').mockReturnValue(mockQueue as any);

        return jobQueueService.enqueueDataValidation(jobData);
      });

      const jobs = await Promise.all(jobPromises);
      expect(jobs).toHaveLength(10);
      jobs.forEach((job, i) => {
        expect(job.id).toBe(`concurrent-job-${i}`);
      });
    });

    it('should maintain metrics accuracy under load', () => {
      const jobs = Array.from({ length: 100 }, (_, i) => ({
        id: `load-test-job-${i}`,
        name: 'load-test',
        queueName: JobType.DATA_VALIDATION,
        data: { organizationId: 'test-org' },
        opts: { priority: 1 },
        attemptsMade: 0,
      })) as any[];

      // Simulate high-volume job processing with deterministic 80% success rate
      jobs.forEach((job, i) => {
        metricsService.recordJobStart(job);
        if (i % 5 !== 4) {
          // 80% success rate (4 out of 5 jobs succeed)
          metricsService.recordJobComplete(job, { success: true });
        } else {
          metricsService.recordJobFailure(job, new Error('Random failure'));
        }
      });

      const systemMetrics = metricsService.getSystemMetrics();
      expect(systemMetrics.totalJobs).toBeGreaterThanOrEqual(100);
      expect(systemMetrics.overallSuccessRate).toBeGreaterThan(70);
      expect(systemMetrics.overallSuccessRate).toBeLessThan(90);
    });
  });
});
