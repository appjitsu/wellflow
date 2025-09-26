import { Injectable, Logger } from '@nestjs/common';

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
  retryableErrors?: (error: unknown) => boolean;
}

export interface RetryMetrics {
  operationName: string;
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  totalRetries: number;
  averageDelayMs: number;
  lastExecutionTime: number;
}

interface RetryContext {
  attempt: number;
  totalDelay: number;
  lastError: unknown;
  operationName: string;
  retryableErrors: (error: unknown) => boolean;
}

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);
  private readonly metrics = new Map<string, RetryMetrics>();

  /**
   * Execute an operation with retry logic
   */
  async execute<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    operationName?: string,
  ): Promise<T> {
    this.validateConfig(config);

    const context = this.createRetryContext(config, operationName);

    while (context.attempt <= config.maxAttempts) {
      try {
        const result = await operation();
        this.handleSuccess(context);
        return result;
      } catch (error) {
        if (!this.shouldRetry(error, context, config)) {
          throw error;
        }
        await this.performRetry(error, context, config);
      }
    }

    this.handleFinalFailure(context);
    throw context.lastError;
  }

  private validateConfig(config: RetryConfig): void {
    if (config.maxAttempts < 1) {
      throw new Error('maxAttempts must be at least 1');
    }
  }

  private createRetryContext(
    config: RetryConfig,
    operationName?: string,
  ): RetryContext {
    return {
      attempt: 1,
      totalDelay: 0,
      lastError: undefined,
      operationName: operationName || 'unknown',
      retryableErrors:
        config.retryableErrors || ((error) => this.isRetryableError(error)),
    };
  }

  private handleSuccess(context: RetryContext): void {
    this.recordSuccess(
      context.operationName,
      context.attempt,
      context.totalDelay,
    );
    this.logger.debug(
      `Operation ${context.operationName} succeeded on attempt ${context.attempt}`,
    );
  }

  private shouldRetry(
    error: unknown,
    context: RetryContext,
    config: RetryConfig,
  ): boolean {
    context.lastError = error;

    // Don't retry on the last attempt
    if (context.attempt === config.maxAttempts) {
      return false;
    }

    // Check if the error is retryable
    if (!context.retryableErrors(error)) {
      this.logger.debug(
        `Operation ${context.operationName} failed with non-retryable error on attempt ${context.attempt}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }

    return true;
  }

  private async performRetry(
    error: unknown,
    context: RetryContext,
    config: RetryConfig,
  ): Promise<void> {
    // Calculate delay with exponential backoff
    const delay = Math.min(
      config.initialDelayMs *
        Math.pow(config.backoffMultiplier, context.attempt - 1),
      config.maxDelayMs,
    );

    context.totalDelay += delay;

    this.logger.warn(
      `Operation ${context.operationName} failed on attempt ${context.attempt}/${config.maxAttempts}. Retrying in ${delay}ms. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );

    await this.delay(delay);
    context.attempt++;
  }

  private handleFinalFailure(context: RetryContext): void {
    this.recordFailure(
      context.operationName,
      context.attempt - 1,
      context.totalDelay,
    );
    this.logger.error(
      `Operation ${context.operationName} failed after ${context.attempt - 1} attempts. Total delay: ${context.totalDelay}ms`,
    );
  }

  /**
   * Execute with exponential backoff retry (convenience method)
   */
  async executeWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts = 3,
    initialDelayMs = 1000,
    operationName?: string,
  ): Promise<T> {
    return this.execute(
      operation,
      {
        maxAttempts,
        initialDelayMs,
        backoffMultiplier: 2,
        maxDelayMs: 30000, // 30 seconds max
        retryableErrors: (error) => this.isRetryableError(error),
      },
      operationName,
    );
  }

  /**
   * Execute with fixed delay retry (convenience method)
   */
  async executeWithFixedDelay<T>(
    operation: () => Promise<T>,
    maxAttempts = 3,
    delayMs = 1000,
    operationName?: string,
  ): Promise<T> {
    return this.execute(
      operation,
      {
        maxAttempts,
        initialDelayMs: delayMs,
        backoffMultiplier: 1,
        maxDelayMs: delayMs,
      },
      operationName,
    );
  }

  /**
   * Get metrics for a specific operation
   */
  getMetrics(operationName: string): RetryMetrics | undefined {
    return this.metrics.get(operationName);
  }

  /**
   * Get metrics for all operations
   */
  getAllMetrics(): RetryMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Reset metrics for a specific operation
   */
  resetMetrics(operationName: string): boolean {
    return this.metrics.delete(operationName);
  }

  /**
   * Default retryable error check - considers network and server errors as retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    // Network errors
    if (
      error.message.includes('ECONNRESET') ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ENOTFOUND') ||
      error.message.includes('Network') ||
      error.message.includes('timeout')
    ) {
      return true;
    }

    // HTTP errors that might be transient
    if (
      error.message.includes('502') || // Bad Gateway
      error.message.includes('503') || // Service Unavailable
      error.message.includes('504') || // Gateway Timeout
      error.message.includes('408')
    ) {
      // Request Timeout
      return true;
    }

    // Rate limiting (might be temporary)
    if (error.message.includes('429')) {
      // Too Many Requests
      return true;
    }

    return false;
  }

  /**
   * Sleep for the specified number of milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Record a successful operation
   */
  private recordSuccess(
    operationName: string,
    attempts: number,
    totalDelay: number,
  ): void {
    const metrics = this.getOrCreateMetrics(operationName);
    metrics.totalAttempts += attempts;
    metrics.successfulAttempts += 1;
    metrics.totalRetries += attempts - 1;
    metrics.averageDelayMs = (metrics.averageDelayMs + totalDelay) / 2;
    metrics.lastExecutionTime = Date.now();
  }

  /**
   * Record a failed operation
   */
  private recordFailure(
    operationName: string,
    attempts: number,
    totalDelay: number,
  ): void {
    const metrics = this.getOrCreateMetrics(operationName);
    metrics.totalAttempts += attempts;
    metrics.failedAttempts += 1;
    metrics.totalRetries += attempts - 1;
    metrics.averageDelayMs = (metrics.averageDelayMs + totalDelay) / 2;
    metrics.lastExecutionTime = Date.now();
  }

  /**
   * Get or create metrics for an operation
   */
  private getOrCreateMetrics(operationName: string): RetryMetrics {
    let metrics = this.metrics.get(operationName);
    if (!metrics) {
      metrics = {
        operationName,
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        totalRetries: 0,
        averageDelayMs: 0,
        lastExecutionTime: 0,
      };
      this.metrics.set(operationName, metrics);
    }
    return metrics;
  }
}
