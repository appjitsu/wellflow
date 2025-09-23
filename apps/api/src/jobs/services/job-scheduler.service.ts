import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Queue } from 'bullmq';

import { BullMQConfigService } from '../config/bullmq-config.service';

export interface ScheduledJobConfig {
  name: string;
  cron: string;
  enabled: boolean;
  timezone?: string;
  jobData: Record<string, unknown>;
  description: string;
}

/**
 * Job Scheduler Service
 *
 * Manages scheduled and recurring jobs for the WellFlow system.
 * Handles cron-based scheduling for regular maintenance tasks,
 * compliance reporting, and automated notifications.
 *
 * Features:
 * - Cron-based job scheduling
 * - Timezone support
 * - Dynamic schedule management
 * - Job deduplication
 * - Schedule monitoring and logging
 */
const DEFAULT_TIMEZONE = 'America/Chicago'; // Central Time for oil & gas operations

// Queue name constants to avoid duplication
const QUEUE_NAMES = {
  DATA_VALIDATION: 'data-validation',
  REPORT_GENERATION: 'report-generation',
  EMAIL_NOTIFICATIONS: 'email-notifications',
} as const;

@Injectable()
export class JobSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobSchedulerService.name);
  private schedulers: Map<string, Queue> = new Map();
  private scheduledJobs: Map<string, ScheduledJobConfig> = new Map();

  constructor(private readonly bullMQConfig: BullMQConfigService) {}

  async onModuleInit() {
    await this.initializeSchedulers();
    await this.setupDefaultSchedules();
    this.logger.log('Job Scheduler Service initialized');
  }

  async onModuleDestroy() {
    await this.cleanup();
    this.logger.log('Job Scheduler Service destroyed');
  }

  /**
   * Initialize queue schedulers for each queue
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  private async initializeSchedulers(): Promise<void> {
    // BullMQ v5+ doesn't require separate QueueScheduler instances
    // Scheduling is handled directly by the Queue instances
    this.logger.log(
      'Queue schedulers initialized (handled by Queue instances)',
    );
  }

  /**
   * Setup default scheduled jobs for WellFlow
   */
  private async setupDefaultSchedules(): Promise<void> {
    // Daily production data validation at 2 AM
    await this.scheduleJob({
      name: 'daily-production-validation',
      cron: '0 2 * * *', // Every day at 2 AM
      enabled: true,
      timezone: DEFAULT_TIMEZONE, // Central Time for oil & gas operations
      description: 'Daily validation of production data for compliance',
      jobData: {
        leaseId: 'scheduled-validation',
        organizationId: 'system',
        timestamp: new Date(),
        validationType: 'daily_production',
        includeHistorical: false,
        notifyOnFailure: true,
      },
    });

    // Weekly compliance report generation on Sundays at 6 AM
    await this.scheduleJob({
      name: 'weekly-compliance-report',
      cron: '0 6 * * 0', // Every Sunday at 6 AM
      enabled: true,
      timezone: DEFAULT_TIMEZONE,
      description:
        'Weekly compliance report generation for regulatory submission',
      jobData: {
        organizationId: 'system',
        reportType: 'compliance_weekly',
        includeCharts: true,
        format: 'pdf',
        recipients: ['compliance@wellflow.com'],
        autoSubmit: false,
        timestamp: new Date(),
      },
    });

    // Monthly production summary on the 1st at 8 AM
    await this.scheduleJob({
      name: 'monthly-production-summary',
      cron: '0 8 1 * *', // 1st of every month at 8 AM
      enabled: true,
      timezone: DEFAULT_TIMEZONE,
      description: 'Monthly production summary report for stakeholders',
      jobData: {
        organizationId: 'system',
        reportType: 'production_monthly',
        includeCharts: true,
        format: 'pdf',
        recipients: ['management@wellflow.com', 'operations@wellflow.com'],
        autoSubmit: true,
        timestamp: new Date(),
      },
    });

    // Daily permit expiration check at 9 AM
    await this.scheduleJob({
      name: 'permit-expiration-check',
      cron: '0 9 * * *', // Every day at 9 AM
      enabled: true,
      timezone: DEFAULT_TIMEZONE,
      description: 'Check for expiring permits and send notifications',
      jobData: {
        message: 'Permit expiration check',
        recipientEmails: ['permits@wellflow.com', 'compliance@wellflow.com'],
        priority: 'medium',
        organizationId: 'system',
        timestamp: new Date(),
        notificationType: 'compliance_reminder',
        reminderType: 'permit_renewal',
        daysAhead: 30, // Notify 30 days before expiration
      },
    });

    // Weekly data cleanup on Saturdays at 11 PM
    await this.scheduleJob({
      name: 'weekly-data-cleanup',
      cron: '0 23 * * 6', // Every Saturday at 11 PM
      enabled: true,
      timezone: DEFAULT_TIMEZONE,
      description: 'Clean up old job data and temporary files',
      jobData: {
        leaseId: 'scheduled-cleanup',
        organizationId: 'system',
        timestamp: new Date(),
        validationType: 'data_cleanup',
        retentionDays: 90,
        includeJobHistory: true,
        notifyOnCompletion: false,
      },
    });

    this.logger.log(`Setup ${this.scheduledJobs.size} default scheduled jobs`);
  }

  /**
   * Schedule a new job with cron pattern
   */
  async scheduleJob(config: ScheduledJobConfig): Promise<void> {
    if (!config.enabled) {
      this.logger.log(`Skipping disabled scheduled job: ${config.name}`);
      return;
    }

    try {
      // Store the job configuration
      this.scheduledJobs.set(config.name, config);

      // Determine which queue to use based on job data
      const queueName = this.determineQueueForJob(config.jobData);

      // Retry getting queue up to 3 times with delays to handle initialization timing
      let queue = this.bullMQConfig.getQueue(queueName);
      let retries = 0;
      while (!queue && retries < 3) {
        this.logger.warn(
          `Queue '${queueName}' not found, retrying in 1 second... (attempt ${retries + 1}/3)`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        queue = this.bullMQConfig.getQueue(queueName);
        retries++;
      }

      if (!queue) {
        throw new Error(`Queue not found after retries: ${queueName}`);
      }

      // Add repeatable job
      await queue.add(config.name, config.jobData, {
        repeat: {
          pattern: config.cron,
          tz: config.timezone || 'UTC',
        },
        // Prevent duplicate jobs
        jobId: `scheduled-${config.name}`,
        // Remove completed jobs after 24 hours
        removeOnComplete: 24,
        removeOnFail: 10,
      });

      this.logger.log(
        `Scheduled job '${config.name}' with pattern '${config.cron}' in timezone '${config.timezone || 'UTC'}'`,
      );
    } catch (error) {
      this.logger.error(`Failed to schedule job '${config.name}':`, error);
      throw error;
    }
  }

  /**
   * Remove a scheduled job
   */
  async unscheduleJob(jobName: string): Promise<void> {
    try {
      const config = this.scheduledJobs.get(jobName);
      if (!config) {
        this.logger.warn(`Scheduled job not found: ${jobName}`);
        return;
      }

      const queueName = this.determineQueueForJob(config.jobData);
      const queue = this.bullMQConfig.getQueue(queueName);

      if (queue) {
        // Use the modern BullMQ 5.x API
        try {
          await queue.removeRepeatable(jobName, {
            pattern: config.cron,
            tz: config.timezone || 'UTC',
          });
        } catch (error) {
          // If the job doesn't exist, that's fine - it's already removed
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('not found')) {
            throw error;
          }
        }
      }

      this.scheduledJobs.delete(jobName);
      this.logger.log(`Unscheduled job: ${jobName}`);
    } catch (error) {
      this.logger.error(`Failed to unschedule job '${jobName}':`, error);
      throw error;
    }
  }

  /**
   * Update a scheduled job
   */
  async updateScheduledJob(
    jobName: string,
    config: Partial<ScheduledJobConfig>,
  ): Promise<void> {
    const existingConfig = this.scheduledJobs.get(jobName);
    if (!existingConfig) {
      throw new Error(`Scheduled job not found: ${jobName}`);
    }

    // Remove existing job
    await this.unscheduleJob(jobName);

    // Add updated job
    const updatedConfig = { ...existingConfig, ...config };
    await this.scheduleJob(updatedConfig);

    this.logger.log(`Updated scheduled job: ${jobName}`);
  }

  /**
   * Get all scheduled jobs
   */
  getScheduledJobs(): ScheduledJobConfig[] {
    return Array.from(this.scheduledJobs.values());
  }

  /**
   * Get scheduled job by name
   */
  getScheduledJob(jobName: string): ScheduledJobConfig | undefined {
    return this.scheduledJobs.get(jobName);
  }

  /**
   * Enable or disable a scheduled job
   */
  async toggleScheduledJob(jobName: string, enabled: boolean): Promise<void> {
    const config = this.scheduledJobs.get(jobName);
    if (!config) {
      throw new Error(`Scheduled job not found: ${jobName}`);
    }

    if (enabled && !config.enabled) {
      // Enable the job
      await this.scheduleJob({ ...config, enabled: true });
    } else if (!enabled && config.enabled) {
      // Disable the job
      await this.unscheduleJob(jobName);
      this.scheduledJobs.set(jobName, { ...config, enabled: false });
    }

    this.logger.log(
      `${enabled ? 'Enabled' : 'Disabled'} scheduled job: ${jobName}`,
    );
  }

  /**
   * Determine which queue to use based on job data
   */
  private determineQueueForJob(jobData: Record<string, unknown>): string {
    const data = jobData;
    if (data.validationType || data.retentionDays) {
      return QUEUE_NAMES.DATA_VALIDATION;
    } else if (data.reportType || data.format) {
      return QUEUE_NAMES.REPORT_GENERATION;
    } else if (data.notificationType || data.recipients) {
      return QUEUE_NAMES.EMAIL_NOTIFICATIONS;
    }

    // Default to data validation queue
    return QUEUE_NAMES.DATA_VALIDATION;
  }

  /**
   * Get scheduler statistics
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async getSchedulerStats(): Promise<{
    totalSchedulers: number;
    totalScheduledJobs: number;
    enabledJobs: number;
    disabledJobs: number;
    jobsByQueue: Record<string, number>;
  }> {
    const jobsByQueueMap = new Map<string, number>();

    // Group jobs by queue using Map to avoid object injection
    for (const config of this.scheduledJobs.values()) {
      const queueName = this.determineQueueForJob(config.jobData);
      jobsByQueueMap.set(queueName, (jobsByQueueMap.get(queueName) || 0) + 1);
    }

    return {
      totalSchedulers: this.schedulers.size,
      totalScheduledJobs: this.scheduledJobs.size,
      enabledJobs: Array.from(this.scheduledJobs.values()).filter(
        (job) => job.enabled,
      ).length,
      disabledJobs: Array.from(this.scheduledJobs.values()).filter(
        (job) => !job.enabled,
      ).length,
      jobsByQueue: Object.fromEntries(jobsByQueueMap),
    };
  }

  /**
   * Cleanup schedulers on module destroy
   */
  private async cleanup(): Promise<void> {
    for (const [queueName, scheduler] of this.schedulers.entries()) {
      try {
        await scheduler.close();
        this.logger.log(`Closed scheduler for queue: ${queueName}`);
      } catch (error) {
        this.logger.error(
          `Error closing scheduler for queue ${queueName}:`,
          error,
        );
      }
    }

    this.schedulers.clear();
    this.scheduledJobs.clear();
  }
}
