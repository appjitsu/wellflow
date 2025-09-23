import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JobMetricsService } from '../job-metrics.service';
import { JobType } from '../../types/job.types';

describe('JobMetricsService', () => {
  let service: JobMetricsService;

  const mockJob = (overrides: Partial<Job> = {}) =>
    ({
      id: 'test-job-123',
      name: 'test-job',
      queueName: JobType.DATA_VALIDATION,
      data: {
        organizationId: 'org-456',
        userId: 'user-789',
      },
      opts: {
        priority: 1,
        delay: 0,
        attempts: 3,
      },
      attemptsMade: 0,
      ...overrides,
    }) as unknown as Job;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobMetricsService],
    }).compile();

    service = module.get<JobMetricsService>(JobMetricsService);

    // Mock the logger
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clear metrics between tests
    (service as any).jobMetrics.clear();
    (service as any).queueMetrics.clear();
  });

  describe('Job Start Metrics', () => {
    it('should record job start metrics', () => {
      const job = mockJob();

      service.recordJobStart(job);

      const metrics = service.getJobMetrics('test-job-123');
      expect(metrics).toBeDefined();
      expect(metrics!.jobId).toBe('test-job-123');
      expect(metrics!.queueName).toBe(JobType.DATA_VALIDATION);
      expect(metrics!.status).toBe('started');
      expect(metrics!.organizationId).toBe('org-456');
      expect(metrics!.userId).toBe('user-789');
      expect(metrics!.attemptNumber).toBe(1);
      expect(metrics!.startTime).toBeInstanceOf(Date);
    });

    it('should update queue metrics on job start', () => {
      const job = mockJob();

      service.recordJobStart(job);

      const queueMetrics = service.getQueueMetrics(JobType.DATA_VALIDATION);
      expect(queueMetrics).toBeDefined();
      expect(queueMetrics!.totalJobs).toBe(1);
      expect(queueMetrics!.activeJobs).toBe(1);
    });
  });

  describe('Job Completion Metrics', () => {
    it('should record job completion metrics', () => {
      const job = mockJob();
      const result = { success: true, data: 'test-result' };

      // First record start
      service.recordJobStart(job);

      // Then record completion
      service.recordJobComplete(job, result);

      const metrics = service.getJobMetrics('test-job-123');
      expect(metrics).toBeDefined();
      expect(metrics!.status).toBe('completed');
      expect(metrics!.endTime).toBeInstanceOf(Date);
      expect(metrics!.duration).toBeGreaterThan(0);
      expect(metrics!.metadata?.result).toEqual(result);
    });

    it('should update queue metrics on job completion', () => {
      const job = mockJob();

      service.recordJobStart(job);
      service.recordJobComplete(job, { success: true });

      const queueMetrics = service.getQueueMetrics(JobType.DATA_VALIDATION);
      expect(queueMetrics).toBeDefined();
      expect(queueMetrics!.completedJobs).toBe(1);
      expect(queueMetrics!.activeJobs).toBe(0);
      expect(queueMetrics!.successRate).toBe(100);
      expect(queueMetrics!.averageDuration).toBeGreaterThan(0);
    });

    it('should handle completion without start metrics', () => {
      const job = mockJob();

      service.recordJobComplete(job, { success: true });

      // Should log warning but not crash
      const metrics = service.getJobMetrics('test-job-123');
      expect(metrics).toBeUndefined();
    });
  });

  describe('Job Failure Metrics', () => {
    it('should record job failure metrics', () => {
      const job = mockJob();
      const error = new Error('Test error');

      service.recordJobStart(job);
      service.recordJobFailure(job, error);

      const metrics = service.getJobMetrics('test-job-123');
      expect(metrics).toBeDefined();
      expect(metrics!.status).toBe('failed');
      expect(metrics!.errorMessage).toBe('Test error');
      expect(metrics!.metadata?.errorName).toBe('Error');
      expect(metrics!.metadata?.errorStack).toBeDefined();
    });

    it('should update queue metrics on job failure', () => {
      const job = mockJob();

      service.recordJobStart(job);
      service.recordJobFailure(job, new Error('Test error'));

      const queueMetrics = service.getQueueMetrics(JobType.DATA_VALIDATION);
      expect(queueMetrics).toBeDefined();
      expect(queueMetrics!.failedJobs).toBe(1);
      expect(queueMetrics!.activeJobs).toBe(0);
      expect(queueMetrics!.successRate).toBe(0);
    });
  });

  describe('System Metrics', () => {
    it('should calculate system-wide metrics', () => {
      const job1 = mockJob({ id: 'job-1' });
      const job2 = mockJob({ id: 'job-2' });
      const job3 = mockJob({ id: 'job-3' });

      // Record various job states
      service.recordJobStart(job1);
      service.recordJobComplete(job1, { success: true });

      service.recordJobStart(job2);
      service.recordJobComplete(job2, { success: true });

      service.recordJobStart(job3);
      service.recordJobFailure(job3, new Error('Test error'));

      const systemMetrics = service.getSystemMetrics();

      expect(systemMetrics.totalJobs).toBe(3);
      expect(systemMetrics.totalCompletedJobs).toBe(2);
      expect(systemMetrics.totalFailedJobs).toBe(1);
      expect(systemMetrics.overallSuccessRate).toBeCloseTo(66.67, 1);
      expect(systemMetrics.averageJobDuration).toBeGreaterThan(0);
      expect(systemMetrics.timestamp).toBeInstanceOf(Date);
    });

    it('should handle empty metrics gracefully', () => {
      const systemMetrics = service.getSystemMetrics();

      expect(systemMetrics.totalJobs).toBe(0);
      expect(systemMetrics.totalCompletedJobs).toBe(0);
      expect(systemMetrics.totalFailedJobs).toBe(0);
      expect(systemMetrics.overallSuccessRate).toBe(0);
      expect(systemMetrics.averageJobDuration).toBe(0);
    });
  });

  describe('Time Range Queries', () => {
    it('should filter jobs by time range', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      const job1 = mockJob({ id: 'job-1' });
      const job2 = mockJob({ id: 'job-2' });

      service.recordJobStart(job1);
      service.recordJobStart(job2);

      // Manually set start times for testing
      const metrics1 = service.getJobMetrics('job-1')!;
      const metrics2 = service.getJobMetrics('job-2')!;
      metrics1.startTime = twoHoursAgo;
      metrics2.startTime = now;

      const recentJobs = service.getJobMetricsByTimeRange(oneHourAgo, now);

      expect(recentJobs).toHaveLength(1);
      expect(recentJobs[0]?.jobId).toBe('job-2');
    });
  });

  describe('Organization Filtering', () => {
    it('should filter jobs by organization', () => {
      const job1 = mockJob({
        id: 'job-1',
        data: { organizationId: 'org-1' },
      });
      const job2 = mockJob({
        id: 'job-2',
        data: { organizationId: 'org-2' },
      });

      service.recordJobStart(job1);
      service.recordJobStart(job2);

      const org1Jobs = service.getJobMetricsByOrganization('org-1');

      expect(org1Jobs).toHaveLength(1);
      expect(org1Jobs[0]?.jobId).toBe('job-1');
      expect(org1Jobs[0]?.organizationId).toBe('org-1');
    });
  });

  describe('Metrics Cleanup', () => {
    it('should clear old metrics', () => {
      const job = mockJob();
      service.recordJobStart(job);

      // Manually set old timestamp
      const metrics = service.getJobMetrics('test-job-123')!;
      metrics.startTime = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago

      service.clearOldMetrics(24); // Clear metrics older than 24 hours

      const clearedMetrics = service.getJobMetrics('test-job-123');
      expect(clearedMetrics).toBeUndefined();
    });

    it('should keep recent metrics', () => {
      const job = mockJob();
      service.recordJobStart(job);

      service.clearOldMetrics(24); // Clear metrics older than 24 hours

      const metrics = service.getJobMetrics('test-job-123');
      expect(metrics).toBeDefined();
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize sensitive data in job results', () => {
      const job = mockJob();
      const result = {
        success: true,
        data: 'test-result',
        // eslint-disable-next-line sonarjs/no-hardcoded-passwords
        password: 'test-password-123',
        apiKey: 'key-456',
        token: 'token-789',
      };

      service.recordJobStart(job);
      service.recordJobComplete(job, result);

      const metrics = service.getJobMetrics('test-job-123')!;
      expect(metrics.metadata?.result.password).toBe('[REDACTED]');
      expect(metrics.metadata?.result.apiKey).toBe('[REDACTED]');
      expect(metrics.metadata?.result.token).toBe('[REDACTED]');
      expect(metrics.metadata?.result.data).toBe('test-result');
    });
  });

  describe('Queue Statistics', () => {
    it('should calculate success rates correctly', () => {
      const jobs = Array.from({ length: 10 }, (_, i) =>
        mockJob({ id: `job-${i}` }),
      );

      // Start all jobs
      jobs.forEach((job) => service.recordJobStart(job));

      // Complete 7 jobs successfully
      jobs
        .slice(0, 7)
        .forEach((job) => service.recordJobComplete(job, { success: true }));

      // Fail 3 jobs
      jobs
        .slice(7)
        .forEach((job) =>
          service.recordJobFailure(job, new Error('Test error')),
        );

      const queueMetrics = service.getQueueMetrics(JobType.DATA_VALIDATION);
      expect(queueMetrics!.successRate).toBe(70);
      expect(queueMetrics!.completedJobs).toBe(7);
      expect(queueMetrics!.failedJobs).toBe(3);
    });
  });
});
