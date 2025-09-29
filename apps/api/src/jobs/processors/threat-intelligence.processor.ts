import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import { BullMQConfigService } from '../../jobs/config/bullmq-config.service';
import { JobMetricsService } from '../../jobs/services/job-metrics.service';
import { ThreatFeedService } from '../../common/rate-limiting/external-threat-intelligence/threat-feed.service';

export interface ThreatIntelligenceJobData {
  feedName?: string; // If specified, update only this feed
  timestamp: Date;
  organizationId?: string;
  forceUpdate?: boolean; // Force update even if recently updated
}

export interface ThreatIntelligenceJobResult {
  success: boolean;
  feedsUpdated: string[];
  feedsFailed: string[];
  totalFeeds: number;
  duration: number;
  timestamp: Date;
  errors?: string[];
}

/**
 * Threat Intelligence Processor
 *
 * Processes threat intelligence feed update jobs using BullMQ.
 * Handles scheduled updates of IP blacklists from various threat intelligence sources.
 */
@Injectable()
export class ThreatIntelligenceProcessor
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ThreatIntelligenceProcessor.name);
  private worker!: Worker;

  constructor(
    private readonly bullMQConfig: BullMQConfigService,
    private readonly metricsService: JobMetricsService,
    private readonly threatFeedService: ThreatFeedService,
  ) {}

  async onModuleInit() {
    // Wait a bit for BullMQ config to initialize Redis connection
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.initializeWorker();
    this.logger.log('Threat Intelligence Processor initialized');
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      this.logger.log('Threat Intelligence Processor destroyed');
    }
  }

  private initializeWorker() {
    const queueConfig = this.bullMQConfig.getQueueConfig('threat-intelligence');
    const redisConnection = this.bullMQConfig.getRedisConnection();

    if (!redisConnection) {
      this.logger.error(
        'Redis connection not available for threat intelligence worker',
      );
      return;
    }

    this.worker = new Worker(
      'threat-intelligence',
      async (job: Job<ThreatIntelligenceJobData>) => {
        return await this.processJob(job);
      },
      {
        connection: redisConnection,
        ...queueConfig?.workerOptions,
      },
    );

    this.worker.on('completed', (job, result: ThreatIntelligenceJobResult) => {
      this.logger.log(
        `✅ Threat intelligence job ${job.id} completed successfully`,
        {
          jobId: job.id,
          jobName: job.name,
          duration: job.processedOn ? Date.now() - job.processedOn : 'unknown',
          result,
        },
      );
      this.metricsService.recordJobComplete(job, result);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`❌ Threat intelligence job ${job?.id} failed`, {
        jobId: job?.id,
        jobName: job?.name,
        error: err.message,
        stack: err.stack,
      });
      if (job) {
        this.metricsService.recordJobFailure(job, err);
      }
    });

    this.worker.on('stalled', (jobId) => {
      this.logger.warn(`Threat intelligence job ${jobId} stalled`);
    });

    this.worker.on('error', (err) => {
      this.logger.error(`❌ Threat intelligence worker error: ${err.message}`, {
        error: err.message,
        stack: err.stack,
      });
    });

    // Register worker with BullMQ config
    this.bullMQConfig.registerWorker('threat-intelligence', this.worker);

    this.logger.log('Threat intelligence processor initialized');
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  private async processJob(
    job: Job<ThreatIntelligenceJobData>,
  ): Promise<ThreatIntelligenceJobResult> {
    const startTime = Date.now();
    this.metricsService.recordJobStart(job);
    this.logger.log(
      `🚀 Processing threat intelligence job ${job.id}: ${job.name}`,
      {
        jobId: job.id,
        jobName: job.name,
        feedName: job.data.feedName,
        forceUpdate: job.data.forceUpdate,
        timestamp: job.data.timestamp,
      },
    );

    try {
      const { data } = job;
      const feedsUpdated: string[] = [];
      const feedsFailed: string[] = [];
      const errors: string[] = [];

      // Update progress
      await job.updateProgress(10);

      if (data.feedName) {
        // Update specific feed
        this.logger.log(`Updating specific threat feed: ${data.feedName}`);
        try {
          await this.threatFeedService.triggerFeedUpdate(data.feedName);
          feedsUpdated.push(data.feedName);
          await job.updateProgress(80);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(`Failed to update feed ${data.feedName}:`, error);
          feedsFailed.push(data.feedName);
          errors.push(`${data.feedName}: ${errorMessage}`);
        }
      } else {
        // Update all feeds
        this.logger.log('Updating all threat intelligence feeds');
        const feedStatus = this.threatFeedService.getFeedStatus();
        const totalFeeds = feedStatus.totalFeeds;

        let processedFeeds = 0;

        for (const feed of feedStatus.feeds) {
          if (!feed.loaded || data.forceUpdate) {
            try {
              await this.threatFeedService.triggerFeedUpdate(feed.name);
              feedsUpdated.push(feed.name);
              this.logger.debug(`Successfully updated feed: ${feed.name}`);
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
              this.logger.error(`Failed to update feed ${feed.name}:`, error);
              feedsFailed.push(feed.name);
              errors.push(`${feed.name}: ${errorMessage}`);
            }
          } else {
            this.logger.debug(`Skipping already loaded feed: ${feed.name}`);
          }

          processedFeeds++;
          const progress = Math.min(
            90,
            20 + (processedFeeds / totalFeeds) * 60,
          );
          await job.updateProgress(progress);
        }
      }

      await job.updateProgress(100);

      const duration = Date.now() - startTime;
      const result: ThreatIntelligenceJobResult = {
        success: feedsFailed.length === 0,
        feedsUpdated,
        feedsFailed,
        totalFeeds: feedsUpdated.length + feedsFailed.length,
        duration,
        timestamp: new Date(),
        errors: errors.length > 0 ? errors : undefined,
      };

      this.logger.log(
        `Threat intelligence job completed: ${feedsUpdated.length} updated, ${feedsFailed.length} failed in ${duration}ms`,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Threat intelligence job ${job.id} failed:`, error);

      throw new Error(
        `Threat intelligence job failed after ${duration}ms: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
