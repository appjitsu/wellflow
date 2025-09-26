/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterEnabled: boolean;
  retryCondition?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error, delay: number) => void;
}

/**
 * Retry execution result
 */
export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalExecutionTime: number;
  retryHistory: Array<{
    attempt: number;
    error: Error;
    delay: number;
    executionTime: number;
  }>;
}

/**
 * Retry strategy interface
 */
export interface IRetryStrategy {
  /**
   * Execute a function with retry logic
   */
  execute<T>(
    fn: () => Promise<T>,
    config?: Partial<RetryConfig>,
  ): Promise<RetryResult<T>>;

  /**
   * Calculate delay for next retry attempt
   */
  calculateDelay(attempt: number, config: RetryConfig): number;

  /**
   * Check if error should be retried
   */
  shouldRetry(error: Error, config: RetryConfig): boolean;
}

/**
 * Circuit breaker state
 */
export enum CircuitBreakerState {
  CLOSED = 'closed', // Normal operation
  OPEN = 'open', // Failing, rejecting calls
  HALF_OPEN = 'half_open', // Testing if service recovered
}

/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  nextRetryTime?: Date;
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures to open circuit
  recoveryTimeoutMs: number; // Time to wait before trying half-open
  successThreshold: number; // Number of successes to close circuit
  monitoringEnabled: boolean;
}

/**
 * Circuit breaker interface
 */
export interface ICircuitBreaker {
  /**
   * Execute function with circuit breaker protection
   */
  execute<T>(fn: () => Promise<T>): Promise<T>;

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState;

  /**
   * Get circuit breaker statistics
   */
  getStats(): CircuitBreakerStats;

  /**
   * Manually reset circuit breaker
   */
  reset(): void;
}
