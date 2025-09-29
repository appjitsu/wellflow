import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Queue } from 'bullmq';
import { BullMQConfigService } from '../../../jobs/config/bullmq-config.service';
import { ThreatIntelligenceJobData } from '../../../jobs/processors/threat-intelligence.processor';
import { ThreatFeedService } from './threat-feed.service';

/**
 * Threat Intelligence Scheduler Service
 *
 * Manages scheduling of threat intelligence feed updates using Bull MQ.
 * Handles both recurring scheduled updates and on-demand updates.
 */
@Injectable()
export class ThreatIntelligenceSchedulerService
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(ThreatIntelligenceSchedulerService.name);
  private threatIntelligenceQueue!: Queue;
  private isInitialized = false;

  constructor(
    private readonly bullMQConfig: BullMQConfigService,
    private readonly threatFeedService: ThreatFeedService,
  ) {}

  onApplicationBootstrap(): void {
    // Use a delayed initialization to ensure all other services are ready
    setTimeout(() => {
      void this.initializeSchedulerWithRetry();
    }, 2000); // 2 second delay to ensure BullMQ is fully ready
  }

  private async initializeSchedulerWithRetry(): Promise<void> {
    try {
      await this.initializeScheduler();
    } catch (error) {
      this.logger.error('Failed to initialize Threat Intelligence Scheduler', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Retry initialization after a delay
      this.retryInitialization();
    }
  }

  private async initializeScheduler(): Promise<void> {
    this.logger.log('Starting Threat Intelligence Scheduler initialization...');

    // Wait for BullMQ config to initialize with extended retry logic
    await this.waitForBullMQInitialization();
    await this.initializeQueue();

    // Set initialized flag BEFORE scheduling jobs
    this.isInitialized = true;

    await this.scheduleRecurringJobs();
    this.logger.log('Threat Intelligence Scheduler initialized successfully');
  }

  private retryInitialization(): void {
    setTimeout(() => {
      void this.retryInitializationAsync();
    }, 30000); // Retry every 30 seconds
  }

  private async retryInitializationAsync(): Promise<void> {
    if (!this.isInitialized) {
      this.logger.log(
        'Retrying Threat Intelligence Scheduler initialization...',
      );
      try {
        await this.initializeScheduler();
      } catch {
        this.logger.error('Retry failed, will attempt again in 30 seconds');
        this.retryInitialization();
      }
    }
  }

  private async waitForBullMQInitialization(): Promise<void> {
    this.logger.debug('Waiting for BullMQ to be fully initialized...');
    // Use longer timeout and more retries for application bootstrap
    await this.bullMQConfig.waitForInitialization(20, 2000); // 20 retries, 2 second delay
    this.logger.debug('BullMQ initialization confirmed');
  }

  private async initializeQueue() {
    // Try to get the queue, and if it doesn't exist, create it
    let queue = this.bullMQConfig.getQueue('threat-intelligence');

    if (!queue) {
      this.logger.warn(
        'Threat intelligence queue not found, attempting to create it',
      );

      // Get the queue configuration
      const queueConfig = this.bullMQConfig.getQueueConfig(
        'threat-intelligence',
      );
      if (!queueConfig) {
        throw new Error(
          'Threat intelligence queue configuration not found in BullMQ config',
        );
      }

      // Create the queue manually using the Redis connection
      const redisConnection = this.bullMQConfig.getRedisConnection();
      const { Queue } = await import('bullmq');

      queue = new Queue('threat-intelligence', {
        connection: redisConnection,
        ...queueConfig.options,
      });

      // Register the queue with BullMQ config (if there's a method for it)
      // Note: This is a workaround since the queue should have been created during initialization
      this.logger.warn(
        'Created threat intelligence queue manually - this indicates a timing issue',
      );
    }

    this.threatIntelligenceQueue = queue;
    this.logger.log('Threat intelligence queue initialized successfully');
  }

  /**
   * Schedule recurring threat intelligence feed updates
   */
  private async scheduleRecurringJobs() {
    const feedStatus = this.threatFeedService.getFeedStatus();

    for (const feed of feedStatus.feeds) {
      if (!feed.loaded) {
        // Schedule immediate update for feeds that aren't loaded
        await this.scheduleImmediateUpdate(feed.name);
      }
    }

    // Schedule updates every minute for testing (change to daily in production)
    await this.scheduleRecurringUpdate('* * * * *', 'testing-frequent-update');

    // Schedule daily full update at 2 AM (disabled for testing)
    // await this.scheduleRecurringUpdate('0 2 * * *', 'daily-full-update');

    this.logger.log('Scheduled recurring threat intelligence jobs');
  }

  /**
   * Check if scheduler is ready to accept jobs
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.threatIntelligenceQueue) {
      throw new Error('Threat Intelligence Scheduler is not initialized yet');
    }
  }

  /**
   * Schedule a recurring threat intelligence update
   */
  async scheduleRecurringUpdate(
    cronPattern: string,
    jobName: string,
  ): Promise<void> {
    this.ensureInitialized();

    const jobData: ThreatIntelligenceJobData = {
      timestamp: new Date(),
      forceUpdate: jobName === 'daily-full-update', // Force update for daily jobs
    };

    await this.threatIntelligenceQueue.add(jobName, jobData, {
      repeat: {
        pattern: cronPattern,
      },
      removeOnComplete: 10,
      removeOnFail: 5,
    });

    this.logger.log(
      `Scheduled recurring job: ${jobName} with pattern: ${cronPattern}`,
    );
  }

  /**
   * Schedule an immediate threat intelligence update
   */
  async scheduleImmediateUpdate(feedName?: string): Promise<void> {
    this.ensureInitialized();

    const jobData: ThreatIntelligenceJobData = {
      feedName,
      timestamp: new Date(),
      forceUpdate: true,
    };

    const jobName = feedName ? `update-${feedName}` : 'update-all-feeds';

    await this.threatIntelligenceQueue.add(jobName, jobData, {
      priority: 10, // High priority for immediate updates
      removeOnComplete: 5,
      removeOnFail: 3,
    });

    this.logger.log(`Scheduled immediate update: ${jobName}`);
  }

  /**
   * Schedule a delayed threat intelligence update
   */
  async scheduleDelayedUpdate(
    delayMs: number,
    feedName?: string,
  ): Promise<void> {
    this.ensureInitialized();

    const jobData: ThreatIntelligenceJobData = {
      feedName,
      timestamp: new Date(),
      forceUpdate: false,
    };

    const jobName = feedName
      ? `delayed-update-${feedName}`
      : 'delayed-update-all';

    await this.threatIntelligenceQueue.add(jobName, jobData, {
      delay: delayMs,
      removeOnComplete: 5,
      removeOnFail: 3,
    });

    this.logger.log(`Scheduled delayed update: ${jobName} in ${delayMs}ms`);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    this.ensureInitialized();

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.threatIntelligenceQueue.getWaiting(),
      this.threatIntelligenceQueue.getActive(),
      this.threatIntelligenceQueue.getCompleted(),
      this.threatIntelligenceQueue.getFailed(),
      this.threatIntelligenceQueue.getDelayed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
    };
  }

  /**
   * Clear all jobs from the queue (useful for testing)
   */
  async clearQueue(): Promise<void> {
    this.ensureInitialized();
    await this.threatIntelligenceQueue.obliterate({ force: true });
    this.logger.log('Cleared threat intelligence queue');
  }

  /**
   * Manually trigger a threat intelligence update
   */
  async triggerUpdate(feedName?: string, forceUpdate = false): Promise<void> {
    this.ensureInitialized();

    const jobData: ThreatIntelligenceJobData = {
      feedName,
      timestamp: new Date(),
      forceUpdate,
    };

    const jobName = feedName
      ? `manual-update-${feedName}`
      : 'manual-update-all';

    await this.threatIntelligenceQueue.add(jobName, jobData, {
      priority: 20, // Highest priority for manual triggers
      removeOnComplete: 3,
      removeOnFail: 2,
    });

    this.logger.log(`Manually triggered update: ${jobName}`);
  }

  /**
   * Get initialization status
   */
  getInitializationStatus(): { initialized: boolean; queueReady: boolean } {
    return {
      initialized: this.isInitialized,
      queueReady: !!this.threatIntelligenceQueue,
    };
  }
}
