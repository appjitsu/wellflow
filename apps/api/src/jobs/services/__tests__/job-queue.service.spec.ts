import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { JobQueueService } from '../job-queue.service';
import { BullMQConfigService } from '../../config/bullmq-config.service';
import {
  LeaseDataValidationJobData,
  ComplianceReportJobData,
  SystemNotificationJobData,
  JobType,
} from '../../types/job.types';

describe('JobQueueService', () => {
  let service: JobQueueService;
  let bullMQConfig: jest.Mocked<BullMQConfigService>;
  let mockQueue: jest.Mocked<Queue>;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn(),
      getJobs: jest.fn(),
      getJob: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      clean: jest.fn(),
      obliterate: jest.fn(),
      getJobCounts: jest.fn(),
      getWaiting: jest.fn(),
      getActive: jest.fn(),
      getCompleted: jest.fn(),
      getFailed: jest.fn(),
      getDelayed: jest.fn(),
      name: 'test-queue',
    } as unknown as jest.Mocked<Queue>;

    const mockBullMQConfig = {
      getQueue: jest.fn().mockReturnValue(mockQueue),
      getQueues: jest.fn().mockReturnValue([mockQueue]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobQueueService,
        {
          provide: BullMQConfigService,
          useValue: mockBullMQConfig,
        },
      ],
    }).compile();

    service = module.get<JobQueueService>(JobQueueService);
    bullMQConfig = module.get(BullMQConfigService);

    // Mock the logger
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Data Validation Jobs', () => {
    it('should enqueue lease data validation job', async () => {
      const jobData: LeaseDataValidationJobData = {
        leaseId: 'lease-123',
        organizationId: 'org-456',
        timestamp: new Date(),
        validationType: 'production_data',
        includeHistorical: false,
        notifyOnFailure: true,
      };

      const options = { priority: 1, delay: 1000 };
      mockQueue.add.mockResolvedValue({ id: 'job-123' } as any);

      const result = await service.enqueueDataValidation(jobData, options);

      expect(bullMQConfig.getQueue).toHaveBeenCalledWith(
        JobType.DATA_VALIDATION,
      );
      expect(mockQueue.add).toHaveBeenCalledWith(
        'lease-data-validation',
        jobData,
        expect.objectContaining(options),
      );
      expect(result).toEqual({ id: 'job-123' });
    });

    it('should handle data validation job enqueue errors', async () => {
      const jobData: LeaseDataValidationJobData = {
        leaseId: 'lease-error',
        organizationId: 'org-456',
        timestamp: new Date(),
        validationType: 'production_data',
        includeHistorical: false,
        notifyOnFailure: true,
      };

      mockQueue.add.mockRejectedValue(new Error('Queue connection failed'));

      await expect(service.enqueueDataValidation(jobData)).rejects.toThrow(
        'Failed to enqueue data validation job: Queue connection failed',
      );
    });
  });

  describe('Report Generation Jobs', () => {
    it('should enqueue compliance report job', async () => {
      const jobData: ComplianceReportJobData = {
        organizationId: 'org-456',
        reportType: 'monthly_compliance',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        includeCharts: true,
        format: 'pdf',
        recipients: ['compliance@wellflow.com'],
        autoSubmit: false,
        timestamp: new Date(),
      };

      mockQueue.add.mockResolvedValue({ id: 'report-job-456' } as any);

      const result = await service.enqueueReportGeneration(jobData);

      expect(bullMQConfig.getQueue).toHaveBeenCalledWith(
        JobType.REPORT_GENERATION,
      );
      expect(mockQueue.add).toHaveBeenCalledWith(
        'compliance-report',
        jobData,
        expect.any(Object),
      );
      expect(result).toEqual({ id: 'report-job-456' });
    });

    it('should handle report generation job enqueue errors', async () => {
      const jobData: ComplianceReportJobData = {
        organizationId: 'org-456',
        reportType: 'monthly_compliance',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
        },
        includeCharts: true,
        format: 'pdf',
        recipients: ['compliance@wellflow.com'],
        autoSubmit: false,
        timestamp: new Date(),
      };

      bullMQConfig.getQueue.mockReturnValue(undefined);

      await expect(service.enqueueReportGeneration(jobData)).rejects.toThrow(
        'Report generation queue not found',
      );
    });
  });

  describe('Email Notification Jobs', () => {
    it('should enqueue system notification job', async () => {
      const jobData: SystemNotificationJobData = {
        message: 'System maintenance scheduled',
        recipientEmails: ['admin@wellflow.com'],
        priority: 'high',
        organizationId: 'org-456',
        timestamp: new Date(),
        templateId: 'system-maintenance',
        templateData: {
          maintenanceDate: '2024-02-15',
          duration: '2 hours',
        },
      };

      mockQueue.add.mockResolvedValue({ id: 'email-job-789' } as any);

      const result = await service.enqueueEmailNotification(jobData);

      expect(bullMQConfig.getQueue).toHaveBeenCalledWith(
        JobType.EMAIL_NOTIFICATION,
      );
      expect(mockQueue.add).toHaveBeenCalledWith(
        'system-notification',
        jobData,
        expect.any(Object),
      );
      expect(result).toEqual({ id: 'email-job-789' });
    });

    it('should prioritize high-priority notifications', async () => {
      const jobData: SystemNotificationJobData = {
        message: 'Critical system alert',
        recipientEmails: ['admin@wellflow.com'],
        priority: 'critical',
        organizationId: 'org-456',
        timestamp: new Date(),
      };

      mockQueue.add.mockResolvedValue({ id: 'critical-job-999' } as any);

      await service.enqueueEmailNotification(jobData);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'system-notification',
        jobData,
        expect.objectContaining({
          priority: 10, // HIGH priority for email notifications
        }),
      );
    });
  });

  describe('Queue Management', () => {
    it('should get job counts for all queues', async () => {
      mockQueue.getWaiting.mockResolvedValue([]);
      mockQueue.getActive.mockResolvedValue([]);
      mockQueue.getCompleted.mockResolvedValue([]);
      mockQueue.getFailed.mockResolvedValue([]);
      mockQueue.getDelayed.mockResolvedValue([]);

      const result = await service.getQueueStats();

      expect(result).toHaveLength(3); // 3 queue types
      expect(result[0]).toHaveProperty('queueName');
      expect(result[0]).toHaveProperty('waiting');
      expect(result[0]).toHaveProperty('active');
      expect(result[0]).toHaveProperty('completed');
      expect(result[0]).toHaveProperty('failed');
      expect(result[0]).toHaveProperty('delayed');
      expect(result[0]).toHaveProperty('total');
    });

    it('should handle queue stats errors gracefully', async () => {
      mockQueue.getWaiting.mockRejectedValue(
        new Error('Redis connection failed'),
      );

      const result = await service.getQueueStats();

      expect(result).toHaveLength(3); // 3 queue types
      // Should handle errors gracefully and return partial results
    });

    it('should pause a queue', async () => {
      mockQueue.pause.mockResolvedValue();

      await service.pauseQueue(JobType.DATA_VALIDATION);

      expect(bullMQConfig.getQueue).toHaveBeenCalledWith(
        JobType.DATA_VALIDATION,
      );
      expect(mockQueue.pause).toHaveBeenCalled();
    });

    it('should resume a queue', async () => {
      mockQueue.resume.mockResolvedValue();

      await service.resumeQueue(JobType.DATA_VALIDATION);

      expect(bullMQConfig.getQueue).toHaveBeenCalledWith(
        JobType.DATA_VALIDATION,
      );
      expect(mockQueue.resume).toHaveBeenCalled();
    });

    it('should clean completed jobs', async () => {
      mockQueue.clean.mockResolvedValue(['job1', 'job2']);

      const result = await service.cleanQueue(
        JobType.DATA_VALIDATION,
        'completed',
        1000,
      );

      expect(bullMQConfig.getQueue).toHaveBeenCalledWith(
        JobType.DATA_VALIDATION,
      );
      expect(mockQueue.clean).toHaveBeenCalledWith(1000, 100, 'completed');
      expect(result).toEqual(['job1', 'job2']);
    });

    it('should handle queue not found errors', async () => {
      bullMQConfig.getQueue.mockReturnValue(undefined);

      await expect(service.pauseQueue(JobType.DATA_VALIDATION)).rejects.toThrow(
        'Queue data-validation not found',
      );
    });
  });

  describe('Job Retrieval', () => {
    it('should get jobs from a queue', async () => {
      const mockJobs = [
        { id: 'job1', name: 'test-job-1' },
        { id: 'job2', name: 'test-job-2' },
      ];

      mockQueue.getJobs.mockResolvedValue(mockJobs as any);

      const result = await service.getJobs(
        JobType.DATA_VALIDATION,
        'waiting',
        0,
        10,
      );

      expect(bullMQConfig.getQueue).toHaveBeenCalledWith(
        JobType.DATA_VALIDATION,
      );
      expect(mockQueue.getJobs).toHaveBeenCalledWith(['waiting'], 0, 10);
      expect(result).toEqual(mockJobs);
    });

    it('should get a specific job', async () => {
      const mockJob = { id: 'job-123', name: 'test-job' };
      mockQueue.getJob.mockResolvedValue(mockJob as any);

      const result = await service.getJob(JobType.DATA_VALIDATION, 'job-123');

      expect(bullMQConfig.getQueue).toHaveBeenCalledWith(
        JobType.DATA_VALIDATION,
      );
      expect(mockQueue.getJob).toHaveBeenCalledWith('job-123');
      expect(result).toEqual(mockJob);
    });
  });
});
