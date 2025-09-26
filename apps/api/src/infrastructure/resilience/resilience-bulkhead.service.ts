import { Injectable, Logger } from '@nestjs/common';
import type { BulkheadConfig } from './bulkhead.interface';
import {
  IBulkhead,
  IBulkheadRegistry,
  BulkheadResult,
  BulkheadStats,
} from './bulkhead.interface';

type Executor<T> = () => Promise<T>;
const DEFAULT_HISTORY_LENGTH = 100;
const DEFAULT_PRIORITY_ORDER = [
  'regulatory_agency',
  'third_party',
  'internal',
  'notification',
];

/**
 * Thread-safe bulkhead implementation
 * Isolates external API calls to prevent cascading failures
 */
@Injectable()
export class ResilienceBulkhead implements IBulkhead {
  private readonly logger: Logger;

  private activeCalls = 0;
  private queuedCalls: Array<() => void> = [];
  private completedCalls = 0;
  private failedCalls = 0;
  private rejectedCalls = 0;
  private executionTimes: number[] = [];
  private lastExecutionTime: Date = new Date();

  constructor(private readonly config: BulkheadConfig) {
    this.logger = new Logger(`Bulkhead-${this.config.name}`);
  }

  /**
   * Execute a function within the bulkhead
   */
  async execute<T>(fn: Executor<T>): Promise<BulkheadResult<T>> {
    return this.executeWithTimeout(fn, this.config.executionTimeoutMs);
  }

  /**
   * Execute a function within the bulkhead with timeout
   */
  async executeWithTimeout<T>(
    fn: Executor<T>,
    timeoutMs: number,
  ): Promise<BulkheadResult<T>> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      // Check if we can accept the call
      if (!this.canAcceptCall()) {
        this.rejectedCalls++;
        resolve({
          success: false,
          rejected: true,
          executionTime: Date.now() - startTime,
          bulkheadName: this.config.name,
          error: new Error(
            `Bulkhead ${this.config.name} rejected call: capacity exceeded`,
          ),
        });
        return;
      }

      // Check if we can execute immediately
      if (this.activeCalls < this.config.maxConcurrentCalls) {
        void this.executeImmediately(fn, timeoutMs, startTime).then(resolve);
      } else {
        const queuedResolver = () => {
          void this.executeImmediately(fn, timeoutMs, startTime).then(resolve);
        };
        this.queueCall(queuedResolver, startTime);
      }
    });
  }

  /**
   * Execute function immediately
   */
  private async executeImmediately<T>(
    fn: Executor<T>,
    timeoutMs: number,
    startTime: number,
  ): Promise<BulkheadResult<T>> {
    this.activeCalls++;
    this.lastExecutionTime = new Date();

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              `Bulkhead ${this.config.name} execution timeout after ${timeoutMs}ms`,
            ),
          );
        }, timeoutMs);
      });

      // Race between function execution and timeout
      const result = await Promise.race([fn(), timeoutPromise]);

      const executionTime = Date.now() - startTime;
      this.completedCalls++;
      this.executionTimes.push(executionTime);

      this.maintainExecutionHistory();
      this.logSuccessIfMonitoringEnabled(executionTime);

      return {
        success: true,
        data: result,
        executionTime,
        bulkheadName: this.config.name,
        rejected: false,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.failedCalls++;
      this.executionTimes.push(executionTime);

      this.logErrorIfMonitoringEnabled(error);

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        executionTime,
        bulkheadName: this.config.name,
        rejected: false,
      };
    } finally {
      this.activeCalls--;

      // Process next queued call if any
      if (this.queuedCalls.length > 0) {
        const nextCall = this.queuedCalls.shift();
        if (nextCall) {
          nextCall();
        }
      }
    }
  }

  /**
   * Queue a call for later execution
   */
  private queueCall(executeFn: () => void, _queueStartTime: number): void {
    if (this.queuedCalls.length >= this.config.maxQueueSize) {
      this.rejectedCalls++;
      this.logger.warn(
        `Bulkhead ${this.config.name} queue full, rejecting call`,
      );
      return;
    }

    const timeoutHandle = setTimeout(() => {
      const index = this.queuedCalls.indexOf(executeFn);
      if (index !== -1) {
        this.queuedCalls.splice(index, 1);
        this.rejectedCalls++;
        this.logger.warn(
          `Bulkhead ${this.config.name} queued call timed out after ${this.config.queueTimeoutMs}ms`,
        );
      }
    }, this.config.queueTimeoutMs);

    const wrappedExecuteFn = () => {
      clearTimeout(timeoutHandle);
      executeFn();
    };

    this.queuedCalls.push(wrappedExecuteFn);

    if (this.config.monitoringEnabled) {
      this.logger.debug(
        `Bulkhead ${this.config.name} queued call (queue size: ${this.queuedCalls.length})`,
      );
    }
  }

  /**
   * Get current bulkhead statistics
   */
  getStats(): BulkheadStats {
    const averageExecutionTime =
      this.executionTimes.length > 0
        ? this.executionTimes.reduce((sum, time) => sum + time, 0) /
          this.executionTimes.length
        : 0;

    return {
      name: this.config.name,
      activeCalls: this.activeCalls,
      queuedCalls: this.queuedCalls.length,
      completedCalls: this.completedCalls,
      failedCalls: this.failedCalls,
      rejectedCalls: this.rejectedCalls,
      averageExecutionTime: Math.round(averageExecutionTime * 100) / 100,
      lastExecutionTime: this.lastExecutionTime,
    };
  }

  /**
   * Check if bulkhead can accept new calls
   */
  canAcceptCall(): boolean {
    return (
      this.activeCalls < this.config.maxConcurrentCalls ||
      this.queuedCalls.length < this.config.maxQueueSize
    );
  }

  /**
   * Get bulkhead configuration
   */
  getConfig(): BulkheadConfig {
    return { ...this.config };
  }

  private maintainExecutionHistory(): void {
    if (this.executionTimes.length > DEFAULT_HISTORY_LENGTH) {
      this.executionTimes.shift();
    }
  }

  private logSuccessIfMonitoringEnabled(executionTime: number): void {
    if (this.config.monitoringEnabled) {
      this.logger.debug(
        `Bulkhead ${this.config.name} completed call in ${executionTime}ms`,
      );
    }
  }

  private logErrorIfMonitoringEnabled(error: unknown): void {
    if (this.config.monitoringEnabled) {
      this.logger.warn(
        `Bulkhead ${this.config.name} failed call: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

/**
 * Bulkhead Registry for managing multiple bulkheads
 */
@Injectable()
export class BulkheadRegistry implements IBulkheadRegistry {
  private readonly logger = new Logger(BulkheadRegistry.name);
  private readonly bulkheads = new Map<string, IBulkhead>();

  // Default configurations for different types of external services
  private readonly defaultConfigs: Record<string, Partial<BulkheadConfig>> = {
    // Regulatory agency APIs (strict rate limits, high reliability required)
    regulatory_agency: {
      maxConcurrentCalls: 2,
      maxQueueSize: 5,
      queueTimeoutMs: 30000, // 30 seconds
      executionTimeoutMs: 60000, // 60 seconds
      monitoringEnabled: true,
    },
    // Third-party services (moderate limits)
    third_party: {
      maxConcurrentCalls: 5,
      maxQueueSize: 10,
      queueTimeoutMs: 15000, // 15 seconds
      executionTimeoutMs: 30000, // 30 seconds
      monitoringEnabled: true,
    },
    // Internal services (higher concurrency)
    internal: {
      maxConcurrentCalls: 10,
      maxQueueSize: 20,
      queueTimeoutMs: 10000, // 10 seconds
      executionTimeoutMs: 20000, // 20 seconds
      monitoringEnabled: false,
    },
    // Notification services (high throughput)
    notification: {
      maxConcurrentCalls: 20,
      maxQueueSize: 50,
      queueTimeoutMs: 5000, // 5 seconds
      executionTimeoutMs: 10000, // 10 seconds
      monitoringEnabled: false,
    },
  };

  /**
   * Create or get a bulkhead by name
   */
  getBulkhead(name: string, config?: Partial<BulkheadConfig>): IBulkhead {
    const existingBulkhead = this.bulkheads.get(name);
    if (existingBulkhead) {
      return existingBulkhead;
    }

    // Create new bulkhead with merged configuration
    const defaultConfig = this.getDefaultConfigForName(name);
    const finalConfig: BulkheadConfig = {
      name,
      maxConcurrentCalls: 5,
      maxQueueSize: 10,
      queueTimeoutMs: 15000,
      executionTimeoutMs: 30000,
      monitoringEnabled: true,
      ...defaultConfig,
      ...config,
    };

    const bulkhead = new ResilienceBulkhead(finalConfig);
    this.bulkheads.set(name, bulkhead);

    this.logger.log(
      `Created bulkhead: ${name} (concurrency: ${finalConfig.maxConcurrentCalls})`,
    );
    return bulkhead;
  }

  /**
   * Remove a bulkhead
   */
  removeBulkhead(name: string): boolean {
    const removed = this.bulkheads.delete(name);
    if (removed) {
      this.logger.log(`Removed bulkhead: ${name}`);
    }
    return removed;
  }

  /**
   * Get all bulkhead statistics
   */
  getAllStats(): BulkheadStats[] {
    return Array.from(this.bulkheads.values()).map((bulkhead) =>
      bulkhead.getStats(),
    );
  }

  /**
   * Get bulkhead by name
   */
  getBulkheadByName(name: string): IBulkhead | undefined {
    return this.bulkheads.get(name);
  }

  private getDefaultConfigForName(name: string): Partial<BulkheadConfig> {
    // Direct name match using secure property access
    const directConfig = this.getConfigByKey(name);
    if (directConfig) {
      return directConfig;
    }

    // Pattern matching for normalized names
    const normalized = name.toLowerCase();
    const match = DEFAULT_PRIORITY_ORDER.find((key) =>
      normalized.includes(key),
    );

    if (match) {
      const matchedConfig = this.getConfigByKey(match);
      if (matchedConfig) {
        return matchedConfig;
      }
    }

    // Default fallback
    return this.getConfigByKey('third_party') || {};
  }

  private getConfigByKey(key: string): Partial<BulkheadConfig> | null {
    // Secure config access using Object.entries to avoid direct property access
    const configEntry = Object.entries(this.defaultConfigs).find(
      ([configKey]) => configKey === key,
    );
    return configEntry ? configEntry[1] : null;
  }

  private aggregateStats(stats: BulkheadStats[]): {
    totalBulkheads: number;
    totalActiveCalls: number;
    totalQueuedCalls: number;
    totalRejectedCalls: number;
  } {
    return stats.reduce(
      (acc, stat) => ({
        totalBulkheads: acc.totalBulkheads + 1,
        totalActiveCalls: acc.totalActiveCalls + stat.activeCalls,
        totalQueuedCalls: acc.totalQueuedCalls + stat.queuedCalls,
        totalRejectedCalls: acc.totalRejectedCalls + stat.rejectedCalls,
      }),
      {
        totalBulkheads: 0,
        totalActiveCalls: 0,
        totalQueuedCalls: 0,
        totalRejectedCalls: 0,
      },
    );
  }

  /**
   * Get registry statistics
   */
  getRegistryStats(): {
    totalBulkheads: number;
    totalActiveCalls: number;
    totalQueuedCalls: number;
    totalRejectedCalls: number;
  } {
    return this.aggregateStats(this.getAllStats());
  }
}
