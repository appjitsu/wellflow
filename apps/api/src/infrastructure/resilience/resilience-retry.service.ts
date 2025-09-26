import { Injectable, Logger } from '@nestjs/common';
import { CircuitBreakerState } from './retry.interface';
import type {
  IRetryStrategy,
  ICircuitBreaker,
  RetryConfig,
  RetryResult,
  CircuitBreakerConfig,
  CircuitBreakerStats,
} from './retry.interface';
import { IBulkheadRegistry } from './bulkhead.interface';

type ExponentialDelayOptions = Pick<
  RetryConfig,
  'initialDelayMs' | 'backoffMultiplier' | 'maxDelayMs' | 'jitterEnabled'
>;

interface AggregateResilienceStats {
  bulkheads: Array<{
    name: string;
    activeCalls: number;
    queuedCalls: number;
    completedCalls: number;
    failedCalls: number;
    rejectedCalls: number;
    averageExecutionTime: number;
    lastExecutionTime: Date;
  }>;
  registryStats: {
    totalBulkheads: number;
    totalActiveCalls: number;
    totalQueuedCalls: number;
    totalRejectedCalls: number;
  };
}

/**
 * Exponential backoff retry strategy with jitter
 */
@Injectable()
export class ExponentialBackoffRetryStrategy implements IRetryStrategy {
  private readonly logger = new Logger(ExponentialBackoffRetryStrategy.name);

  /**
   * Default retry configuration
   */
  private readonly defaultConfig: RetryConfig = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    jitterEnabled: true,
  };

  /**
   * Execute a function with retry logic
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async execute<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {},
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    const retryHistory: RetryResult<T>['retryHistory'] = [];

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      const attemptStartTime = Date.now();

      try {
        const result = await fn();
        const executionTime = Date.now() - startTime;

        return {
          success: true,
          data: result,
          attempts: attempt,
          totalExecutionTime: executionTime,
          retryHistory,
        };
      } catch (error) {
        const executionTime = Date.now() - attemptStartTime;
        const err = error instanceof Error ? error : new Error(String(error));

        retryHistory.push({
          attempt,
          error: err,
          delay: 0, // No delay on first attempt
          executionTime,
        });

        // Check if we should retry
        if (
          attempt < finalConfig.maxAttempts &&
          this.shouldRetry(err, finalConfig)
        ) {
          const delay = this.calculateDelay(attempt, finalConfig);

          // Call retry callback if provided
          if (finalConfig.onRetry) {
            finalConfig.onRetry(attempt, err, delay);
          }

          this.logger.warn(
            `Retry attempt ${attempt} failed, retrying in ${delay}ms: ${err.message}`,
          );

          // Update retry history with delay
          if (retryHistory.length > 0) {
            (
              retryHistory[retryHistory.length - 1] as { delay?: number }
            ).delay = delay;
          }

          // Wait before retry
          await this.delay(delay);
        } else {
          // No more retries or error not retryable
          const totalExecutionTime = Date.now() - startTime;

          return {
            success: false,
            error: err,
            attempts: attempt,
            totalExecutionTime,
            retryHistory,
          };
        }
      }
    }

    // This should never be reached, but TypeScript requires it
    const totalExecutionTime = Date.now() - startTime;
    return {
      success: false,
      error: new Error('Retry logic error'),
      attempts: finalConfig.maxAttempts,
      totalExecutionTime,
      retryHistory,
    };
  }

  /**
   * Calculate delay for next retry attempt using exponential backoff with jitter
   */
  calculateDelay(attempt: number, config: RetryConfig): number {
    const options: ExponentialDelayOptions = {
      initialDelayMs: config.initialDelayMs,
      backoffMultiplier: config.backoffMultiplier,
      maxDelayMs: config.maxDelayMs,
      jitterEnabled: config.jitterEnabled,
    };
    const exponentialDelay =
      options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1);
    const cappedDelay = Math.min(exponentialDelay, options.maxDelayMs);

    if (options.jitterEnabled) {
      const jitterRange = cappedDelay * 0.25;
      // eslint-disable-next-line sonarjs/pseudo-random
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      return Math.max(0, Math.floor(cappedDelay + jitter));
    }

    return Math.floor(cappedDelay);
  }

  /**
   * Check if error should be retried
   */
  shouldRetry(error: Error, config: RetryConfig): boolean {
    // Use custom retry condition if provided
    if (config.retryCondition) {
      return config.retryCondition(error);
    }

    // Default retry conditions for common transient errors
    const errorMessage = error.message.toLowerCase();

    // Network errors
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('network') ||
      errorMessage.includes('econnreset') ||
      errorMessage.includes('enotfound')
    ) {
      return true;
    }

    // HTTP errors that are typically transient
    if (
      errorMessage.includes('502') || // Bad Gateway
      errorMessage.includes('503') || // Service Unavailable
      errorMessage.includes('504') || // Gateway Timeout
      errorMessage.includes('429')
    ) {
      // Too Many Requests
      return true;
    }

    // Rate limiting
    if (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests')
    ) {
      return true;
    }

    // Don't retry client errors (4xx) except 429
    if (errorMessage.includes('4') && !errorMessage.includes('429')) {
      return false;
    }

    // Retry server errors (5xx)
    if (errorMessage.includes('5')) {
      return true;
    }

    // Retry by default for unknown errors (be conservative)
    return true;
  }

  /**
   * Utility method to create a delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Circuit Breaker implementation for fault tolerance
 */
@Injectable()
export class ResilienceCircuitBreaker implements ICircuitBreaker {
  private logger!: Logger;

  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private nextRetryTime?: Date;

  constructor(
    private readonly config: CircuitBreakerConfig & { name?: string },
  ) {
    this.logger = new Logger(`CircuitBreaker-${this.config.name || 'default'}`);
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check circuit breaker state
    switch (this.state) {
      case CircuitBreakerState.OPEN:
        if (this.shouldAttemptReset()) {
          this.state = CircuitBreakerState.HALF_OPEN;
          this.logger.log(`Circuit breaker transitioning to HALF_OPEN`);
        } else {
          throw new Error(`Circuit breaker is OPEN - service unavailable`);
        }
        break;

      case CircuitBreakerState.HALF_OPEN:
        // Allow call but be ready to handle failure
        break;

      case CircuitBreakerState.CLOSED:
        // Normal operation
        break;
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextRetryTime: this.nextRetryTime,
    };
  }

  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.nextRetryTime = undefined;

    this.logger.log(`Circuit breaker manually reset to CLOSED`);
  }

  /**
   * Record a successful call
   */
  private recordSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = new Date();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitBreakerState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.logger.log(
          `Circuit breaker closed after ${this.config.successThreshold} successes`,
        );
      }
    } else if (this.state === CircuitBreakerState.CLOSED) {
      // Reset success count periodically in closed state
      if (this.successCount > 100) {
        this.successCount = 1;
      }
    }
  }

  /**
   * Record a failed call
   */
  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Any failure in half-open state immediately opens the circuit
      this.state = CircuitBreakerState.OPEN;
      this.nextRetryTime = new Date(Date.now() + this.config.recoveryTimeoutMs);
      this.successCount = 0;
      this.logger.warn(
        `Circuit breaker opened due to failure in HALF_OPEN state`,
      );
    } else if (this.state === CircuitBreakerState.CLOSED) {
      if (this.failureCount >= this.config.failureThreshold) {
        this.state = CircuitBreakerState.OPEN;
        this.nextRetryTime = new Date(
          Date.now() + this.config.recoveryTimeoutMs,
        );
        this.logger.warn(
          `Circuit breaker opened after ${this.failureCount} failures (threshold: ${this.config.failureThreshold})`,
        );
      }
    }
  }

  /**
   * Check if circuit breaker should attempt to reset from OPEN state
   */
  private shouldAttemptReset(): boolean {
    if (!this.nextRetryTime) return false;
    return Date.now() >= this.nextRetryTime.getTime();
  }
}

/**
 * Regulatory Resilience Service
 * Combines bulkhead, retry, and circuit breaker patterns for external API calls
 */
@Injectable()
export class RegulatoryResilienceService {
  private readonly logger = new Logger(RegulatoryResilienceService.name);

  constructor(
    private readonly bulkheadRegistry: Pick<
      IBulkheadRegistry,
      'getBulkhead' | 'getAllStats'
    >,
    private readonly retryStrategy: IRetryStrategy,
  ) {}

  /**
   * Execute regulatory API call with full resilience patterns
   */
  async executeRegulatoryCall<T>(
    bulkheadName: string,
    operation: () => Promise<T>,
    options: {
      retryConfig?: Partial<RetryConfig>;
      description?: string;
    } = {},
  ): Promise<T> {
    const { retryConfig, description } = options;

    const bulkhead = this.bulkheadRegistry.getBulkhead(bulkheadName);

    // Create retry-enabled operation
    const retryableOperation = async (): Promise<T> => {
      const retryResult = await this.retryStrategy.execute(
        operation,
        retryConfig,
      );

      if (!retryResult.success) {
        const lastEntry = retryResult.retryHistory.at(-1);
        const errorToThrow = lastEntry?.error ?? retryResult.error;
        throw errorToThrow ?? new Error('Retry operation failed');
      }

      return retryResult.data as T;
    };

    const bulkheadResult = await bulkhead.execute(retryableOperation);

    if (!bulkheadResult.success) {
      if (bulkheadResult.rejected) {
        throw new Error(
          `Bulkhead rejected call: ${bulkheadResult.error?.message}`,
        );
      }
      throw bulkheadResult.error || new Error('Bulkhead operation failed');
    }

    const monitoringEnabled = bulkhead.getConfig().monitoringEnabled;
    if (monitoringEnabled) {
      this.logger.debug(
        `Regulatory call completed: ${description ?? bulkheadName} (${bulkheadResult.executionTime}ms)`,
      );
    }

    return bulkheadResult.data as T;
  }

  /**
   * Get resilience statistics
   */
  getResilienceStats(): AggregateResilienceStats {
    const bulkheads = this.bulkheadRegistry.getAllStats();

    return {
      bulkheads,
      registryStats: {
        totalBulkheads: bulkheads.length,
        totalActiveCalls: bulkheads.reduce((sum, b) => sum + b.activeCalls, 0),
        totalQueuedCalls: bulkheads.reduce((sum, b) => sum + b.queuedCalls, 0),
        totalRejectedCalls: bulkheads.reduce(
          (sum, b) => sum + b.rejectedCalls,
          0,
        ),
      },
    };
  }
}
