import { Injectable, Logger } from '@nestjs/common';
import { Queue, Job } from 'bullmq';
import { BullMQConfigService } from '../config/bullmq-config.service';
import {
  JobType,
  JobPriority,
  JobOptions,
  AllJobData,
  DataValidationJobData,
  ReportGenerationJobData,
  EmailNotificationJobData,
} from '../types/job.types';

const ENQUEUE_ERROR_PREFIX = 'Failed to enqueue';
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';
const DATA_VALIDATION_JOB_TYPE = 'data validation job';

/**
 * Job Queue Service
 *
 * Centralized service for managing job queues and dispatching background jobs
 * in the WellFlow oil & gas production management system.
 *
 * Features:
 * - Type-safe job dispatching
 * - Centralized queue management
 * - Job monitoring and metrics
 * - Error handling and retry logic
 */
@Injectable()
export class JobQueueService {
  private readonly logger = new Logger(JobQueueService.name);

  constructor(private readonly bullMQConfig: BullMQConfigService) {}

  /**
   * Add a data validation job to the queue
   */
  async addDataValidationJob(
    jobName: string,
    data: DataValidationJobData,
    options?: JobOptions,
  ): Promise<Job<DataValidationJobData>> {
    const queue = this.getQueue(JobType.DATA_VALIDATION);

    const job = await queue.add(jobName, data, {
      priority: options?.priority || JobPriority.NORMAL,
      delay: options?.delay,
      attempts: options?.attempts,
      backoff: options?.backoff,
      removeOnComplete: options?.removeOnComplete,
      removeOnFail: options?.removeOnFail,
      repeat: options?.repeat,
    });

    this.logger.log(
      `Data validation job '${jobName}' added with ID: ${job.id}`,
    );
    return job;
  }

  /**
   * Enqueue a data validation job (alias for addDataValidationJob)
   */
  async enqueueDataValidation(
    data: DataValidationJobData,
    options?: JobOptions,
  ): Promise<Job<DataValidationJobData>> {
    try {
      return await this.addDataValidationJob(
        'lease-data-validation',
        data,
        options,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      throw new Error(
        `${ENQUEUE_ERROR_PREFIX} ${DATA_VALIDATION_JOB_TYPE}: ${message}`,
      );
    }
  }

  /**
   * Add a report generation job to the queue
   */
  async addReportGenerationJob(
    jobName: string,
    data: ReportGenerationJobData,
    options?: JobOptions,
  ): Promise<Job<ReportGenerationJobData>> {
    const queue = this.getQueue(JobType.REPORT_GENERATION);

    const job = await queue.add(jobName, data, {
      priority: options?.priority || JobPriority.NORMAL,
      delay: options?.delay,
      attempts: options?.attempts,
      backoff: options?.backoff,
      removeOnComplete: options?.removeOnComplete,
      removeOnFail: options?.removeOnFail,
      repeat: options?.repeat,
    });

    this.logger.log(
      `Report generation job '${jobName}' added with ID: ${job.id}`,
    );
    return job;
  }

  /**
   * Enqueue a report generation job (alias for addReportGenerationJob)
   */
  async enqueueReportGeneration(
    data: ReportGenerationJobData,
    options?: JobOptions,
  ): Promise<Job<ReportGenerationJobData>> {
    try {
      return await this.addReportGenerationJob(
        'compliance-report',
        data,
        options,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      if (message.includes('not found')) {
        throw new Error('Report generation queue not found');
      }
      throw new Error(
        `${ENQUEUE_ERROR_PREFIX} report generation job: ${message}`,
      );
    }
  }

  /**
   * Add an email notification job to the queue
   */
  async addEmailNotificationJob(
    jobName: string,
    data: EmailNotificationJobData,
    options?: JobOptions,
  ): Promise<Job<EmailNotificationJobData>> {
    const queue = this.getQueue(JobType.EMAIL_NOTIFICATION);

    const job = await queue.add(jobName, data, {
      priority: options?.priority || JobPriority.HIGH, // Email notifications are typically high priority
      delay: options?.delay,
      attempts: options?.attempts || 5, // More retries for email
      backoff: options?.backoff || { type: 'exponential', delay: 1000 },
      removeOnComplete: options?.removeOnComplete,
      removeOnFail: options?.removeOnFail,
      repeat: options?.repeat,
    });

    this.logger.log(
      `Email notification job '${jobName}' added with ID: ${job.id}`,
    );
    return job;
  }

  /**
   * Enqueue an email notification job (alias for addEmailNotificationJob)
   */
  async enqueueEmailNotification(
    data: EmailNotificationJobData,
    options?: JobOptions,
  ): Promise<Job<EmailNotificationJobData>> {
    try {
      return await this.addEmailNotificationJob(
        'system-notification',
        data,
        options,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      throw new Error(
        `${ENQUEUE_ERROR_PREFIX} email notification job: ${message}`,
      );
    }
  }

  /**
   * Schedule a recurring job
   */
  async scheduleRecurringJob(
    queueType: JobType,
    jobName: string,
    data: AllJobData,
    cronPattern: string,
    options?: Omit<JobOptions, 'repeat'>,
  ): Promise<Job<AllJobData>> {
    const queue = this.getQueue(queueType);

    const job = await queue.add(jobName, data, {
      ...options,
      repeat: {
        pattern: cronPattern,
      },
    });

    this.logger.log(
      `Recurring job '${jobName}' scheduled with pattern: ${cronPattern}`,
    );
    return job;
  }

  /**
   * Get job by ID
   */
  async getJob(queueType: JobType, jobId: string): Promise<Job | undefined> {
    const queue = this.getQueue(queueType);
    return await queue.getJob(jobId);
  }

  /**
   * Get jobs by status
   */
  async getJobsByStatus(
    queueType: JobType,
    status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed',
    start = 0,
    end = 10,
  ): Promise<Job[]> {
    const queue = this.getQueue(queueType);
    return await queue.getJobs([status], start, end);
  }

  /**
   * Get jobs from a queue (alias for getJobsByStatus)
   */
  async getJobs(
    queueType: JobType,
    status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed',
    start = 0,
    end = 10,
  ): Promise<Job[]> {
    return await this.getJobsByStatus(queueType, status, start, end);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueType?: JobType): Promise<unknown> {
    if (queueType) {
      // Single queue stats
      const queue = this.getQueue(queueType);

      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        total:
          waiting.length +
          active.length +
          completed.length +
          failed.length +
          delayed.length,
      };
    } else {
      // All queues stats
      const queueTypes = [
        JobType.DATA_VALIDATION,
        JobType.REPORT_GENERATION,
        JobType.EMAIL_NOTIFICATION,
      ];
      const stats = [];

      for (const type of queueTypes) {
        try {
          const queueStats = await this.getQueueStats(type);
          stats.push({
            queueName: type,
            ...(queueStats as Record<string, unknown>),
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
          this.logger.warn(
            `Failed to get stats for queue ${type}: ${errorMessage}`,
          );
          // Return partial stats for failed queue
          stats.push({
            queueName: type,
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
            total: 0,
            error: errorMessage,
          });
        }
      }

      return stats;
    }
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueType: JobType): Promise<void> {
    const queue = this.getQueue(queueType);
    await queue.pause();
    this.logger.log(`Queue '${queueType}' paused`);
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueType: JobType): Promise<void> {
    const queue = this.getQueue(queueType);
    await queue.resume();
    this.logger.log(`Queue '${queueType}' resumed`);
  }

  /**
   * Clean completed jobs
   */
  async cleanQueue(
    queueType: JobType,
    status: 'completed' | 'failed' | 'active' | 'waiting',
    grace: number = 24 * 60 * 60 * 1000, // 24 hours
    limit: number = 100,
  ): Promise<string[]> {
    const queue = this.getQueue(queueType);
    const result = await queue.clean(grace, limit, status);
    this.logger.log(
      `Queue '${queueType}' cleaned: ${result.length} ${status} jobs removed`,
    );
    return result;
  }

  /**
   * Remove a specific job
   */
  async removeJob(queueType: JobType, jobId: string): Promise<void> {
    const job = await this.getJob(queueType, jobId);
    if (job) {
      await job.remove();
      this.logger.log(`Job ${jobId} removed from queue '${queueType}'`);
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(queueType: JobType, jobId: string): Promise<void> {
    const job = await this.getJob(queueType, jobId);
    if (job) {
      await job.retry();
      this.logger.log(`Job ${jobId} retried in queue '${queueType}'`);
    }
  }

  /**
   * Get all queue names
   */
  getQueueNames(): string[] {
    return this.bullMQConfig.getQueueNames();
  }

  /**
   * Get all queues for monitoring
   */
  getAllQueues(): Queue[] {
    return this.bullMQConfig.getAllQueues();
  }

  /**
   * Private helper to get queue by type
   */
  private getQueue(queueType: JobType): Queue {
    const queue = this.bullMQConfig.getQueue(queueType);
    if (!queue) {
      throw new Error(`Queue ${queueType} not found`);
    }
    return queue;
  }
}
