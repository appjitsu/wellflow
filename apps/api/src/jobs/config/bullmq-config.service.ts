import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, QueueOptions, WorkerOptions } from 'bullmq';
import Redis from 'ioredis';

export interface QueueConfig {
  name: string;
  options?: Omit<QueueOptions, 'connection'>;
  workerOptions?: Omit<WorkerOptions, 'connection'>;
}

/**
 * BullMQ Configuration Service
 *
 * Manages BullMQ queue configurations, Redis connections, and provides
 * centralized queue and worker setup for the WellFlow application.
 *
 * Supports oil & gas industry requirements:
 * - Data validation jobs for production data integrity
 * - Report generation for compliance (Form PR, JIB statements)
 * - Email notifications for regulatory deadlines
 */
@Injectable()
export class BullMQConfigService implements OnModuleInit, OnModuleDestroy {
  private redisConnection!: Redis;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();

  // Queue definitions for WellFlow
  private readonly queueConfigs: QueueConfig[] = [
    {
      name: 'data-validation',
      options: {
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
          // Delay failed jobs by 30 seconds before retry
          delay: 30000,
        },
      },
      workerOptions: {
        concurrency: 5,
        limiter: {
          max: 10,
          duration: 1000,
        },
        // Remove stalled jobs after 30 seconds
        stalledInterval: 30 * 1000,
        maxStalledCount: 1,
      },
    },
    {
      name: 'report-generation',
      options: {
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: 50,
          removeOnFail: 25,
          // Delay failed jobs by 2 minutes before retry
          delay: 2 * 60 * 1000,
        },
      },
      workerOptions: {
        concurrency: 2, // CPU intensive operations
        limiter: {
          max: 5,
          duration: 1000,
        },
        // Remove stalled jobs after 2 minutes
        stalledInterval: 2 * 60 * 1000,
        maxStalledCount: 1,
      },
    },
    {
      name: 'email-notifications',
      options: {
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: 200,
          removeOnFail: 100,
          // Delay failed jobs by 10 seconds before retry
          delay: 10 * 1000,
        },
      },
      workerOptions: {
        concurrency: 10,
        limiter: {
          max: 20,
          duration: 1000,
        },
        // Remove stalled jobs after 1 minute
        stalledInterval: 60 * 1000,
        maxStalledCount: 2,
      },
    },
    {
      name: 'threat-intelligence',
      options: {
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: 50,
          removeOnFail: 25,
          // No default delay - jobs should execute immediately unless explicitly delayed
        },
      },
      workerOptions: {
        concurrency: 2, // Network I/O operations
        limiter: {
          max: 5,
          duration: 1000,
        },
        // Remove stalled jobs after 5 minutes
        stalledInterval: 5 * 60 * 1000,
        maxStalledCount: 1,
      },
    },
  ];

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeRedisConnection();
    await this.initializeQueues();
  }

  async onModuleDestroy() {
    await this.closeWorkers();
    await this.closeQueues();
    await this.closeRedisConnection();
  }

  private async initializeRedisConnection() {
    const redisUrl = this.configService.get<string>(
      'REDIS_URL',
      'redis://localhost:6379',
    );

    this.redisConnection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    this.redisConnection.on('error', (err) => {
      console.error('BullMQ Redis Connection Error:', err);
    });

    this.redisConnection.on('connect', () => {
      console.log('✅ BullMQ Redis connected successfully');
    });

    try {
      await this.redisConnection.connect();
    } catch (error) {
      console.error('❌ BullMQ Redis connection failed:', error);
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async initializeQueues() {
    for (const config of this.queueConfigs) {
      const queue = new Queue(config.name, {
        connection: this.redisConnection,
        ...config.options,
      });

      this.queues.set(config.name, queue);
      console.log(`✅ Queue '${config.name}' initialized`);
    }
  }

  private async closeWorkers() {
    for (const [name, worker] of this.workers) {
      await worker.close();
      console.log(`🔌 Worker '${name}' closed`);
    }
    this.workers.clear();
  }

  private async closeQueues() {
    for (const [name, queue] of this.queues) {
      await queue.close();
      console.log(`🔌 Queue '${name}' closed`);
    }
    this.queues.clear();
  }

  private async closeRedisConnection() {
    if (this.redisConnection) {
      await this.redisConnection.quit();
      console.log('🔌 BullMQ Redis connection closed');
    }
  }

  /**
   * Get a queue by name
   */
  getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  /**
   * Get all available queues
   */
  getAllQueues(): Queue[] {
    return Array.from(this.queues.values());
  }

  /**
   * Get all queue names
   */
  getQueueNames(): string[] {
    return Array.from(this.queues.keys());
  }

  /**
   * Register a worker for a specific queue
   */
  registerWorker(queueName: string, worker: Worker) {
    this.workers.set(queueName, worker);
    console.log(`✅ Worker registered for queue '${queueName}'`);
  }

  /**
   * Get Redis connection for BullMQ
   */
  getRedisConnection(): Redis {
    if (!this.redisConnection) {
      throw new Error('Redis connection not initialized');
    }
    return this.redisConnection;
  }

  /**
   * Get queue configuration
   */
  getQueueConfig(name: string): QueueConfig | undefined {
    return this.queueConfigs.find((config) => config.name === name);
  }

  /**
   * Check if BullMQ is fully initialized
   */
  isInitialized(): boolean {
    return (
      this.redisConnection != null &&
      this.redisConnection.status === 'ready' &&
      this.queues.size === this.queueConfigs.length
    );
  }

  /**
   * Wait for BullMQ to be fully initialized
   */
  async waitForInitialization(maxRetries = 10, delayMs = 1000): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (this.isInitialized()) {
        console.log(`✅ BullMQ fully initialized on attempt ${attempt}`);
        return;
      }

      if (attempt < maxRetries) {
        console.log(
          `⏳ Waiting for BullMQ initialization (attempt ${attempt}/${maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        throw new Error(
          `BullMQ failed to initialize after ${maxRetries} attempts`,
        );
      }
    }
  }
}
