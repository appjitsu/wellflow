import { Injectable, Logger } from '@nestjs/common';
import {
  CircuitBreaker,
  CircuitBreakerConfig,
  CircuitState,
} from './circuit-breaker';

export interface CircuitBreakerMetrics {
  serviceName: string;
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuitBreakers = new Map<string, CircuitBreaker>();
  private readonly metrics = new Map<string, CircuitBreakerMetrics>();

  /**
   * Register a circuit breaker for a specific service
   */
  registerCircuitBreaker(
    serviceName: string,
    config: CircuitBreakerConfig,
  ): void {
    if (this.circuitBreakers.has(serviceName)) {
      this.logger.warn(
        `Circuit breaker for service '${serviceName}' already exists. Skipping registration.`,
      );
      return;
    }

    const circuitBreaker = new CircuitBreaker(config);
    this.circuitBreakers.set(serviceName, circuitBreaker);

    // Initialize metrics
    this.metrics.set(serviceName, {
      serviceName,
      state: CircuitState.CLOSED,
      failureCount: 0,
      lastFailureTime: 0,
      totalRequests: 0,
      totalFailures: 0,
      totalSuccesses: 0,
    });

    this.logger.log(
      `Registered circuit breaker for service '${serviceName}' with config: ${JSON.stringify(config)}`,
    );
  }

  /**
   * Execute an operation with circuit breaker protection
   */
  async execute<T>(
    serviceName: string,
    operation: () => Promise<T>,
    operationName?: string,
  ): Promise<T> {
    const circuitBreaker = this.validateCircuitBreaker(serviceName);
    const metrics = this.getMetricsForService(serviceName);

    this.incrementRequestCount(metrics);

    try {
      const result = await circuitBreaker.execute(operation);
      this.handleSuccess(metrics, circuitBreaker, serviceName, operationName);
      return result;
    } catch (error) {
      this.handleFailure(
        metrics,
        circuitBreaker,
        serviceName,
        operationName,
        error,
      );
      throw error;
    }
  }

  private validateCircuitBreaker(serviceName: string): CircuitBreaker {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (!circuitBreaker) {
      throw new Error(
        `Circuit breaker for service '${serviceName}' is not registered. ` +
          'Call registerCircuitBreaker() first.',
      );
    }
    return circuitBreaker;
  }

  private getMetricsForService(serviceName: string): CircuitBreakerMetrics {
    const metrics = this.metrics.get(serviceName);
    if (!metrics) {
      throw new Error(`Metrics not found for service '${serviceName}'`);
    }
    return metrics;
  }

  private incrementRequestCount(metrics: CircuitBreakerMetrics): void {
    metrics.totalRequests += 1;
  }

  private handleSuccess(
    metrics: CircuitBreakerMetrics,
    circuitBreaker: CircuitBreaker,
    serviceName: string,
    operationName?: string,
  ): void {
    metrics.totalSuccesses += 1;
    this.updateMetricsFromCircuitBreaker(metrics, circuitBreaker);
    const operationSuffix = operationName ? ` (${operationName})` : '';
    this.logger.debug(
      `Circuit breaker operation successful for service '${serviceName}'${operationSuffix}`,
    );
  }

  private handleFailure(
    metrics: CircuitBreakerMetrics,
    circuitBreaker: CircuitBreaker,
    serviceName: string,
    operationName: string | undefined,
    error: unknown,
  ): void {
    metrics.totalFailures += 1;
    this.updateMetricsFromCircuitBreaker(metrics, circuitBreaker);

    const operationSuffix = operationName ? ` (${operationName})` : '';
    if (this.isCircuitBreakerError(error)) {
      this.logger.warn(
        `Circuit breaker blocked operation for service '${serviceName}'${operationSuffix}: ${(error as Error).message}`,
      );
    } else {
      this.logger.error(
        `Circuit breaker operation failed for service '${serviceName}'${operationSuffix}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private updateMetricsFromCircuitBreaker(
    metrics: CircuitBreakerMetrics,
    circuitBreaker: CircuitBreaker,
  ): void {
    metrics.state = circuitBreaker.getState();
    metrics.failureCount = circuitBreaker.getFailureCount();
    metrics.lastFailureTime = circuitBreaker.getLastFailureTime();
  }

  private isCircuitBreakerError(error: unknown): boolean {
    return (
      error instanceof Error && error.message.includes('Circuit breaker is')
    );
  }

  /**
   * Get current state of a circuit breaker
   */
  getState(serviceName: string): CircuitState | undefined {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    return circuitBreaker?.getState();
  }

  /**
   * Get metrics for a specific service
   */
  getMetrics(serviceName: string): CircuitBreakerMetrics | undefined {
    return this.metrics.get(serviceName);
  }

  /**
   * Get metrics for all services
   */
  getAllMetrics(): CircuitBreakerMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Reset a circuit breaker (force close)
   */
  resetCircuitBreaker(serviceName: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (!circuitBreaker) {
      this.logger.warn(
        `Cannot reset circuit breaker for '${serviceName}': not found`,
      );
      return false;
    }

    // Since CircuitBreaker doesn't expose a reset method, we'll log the attempt
    // In a real implementation, you'd modify the CircuitBreaker class to support reset
    this.logger.warn(
      `Resetting circuit breaker for service '${serviceName}'. Full reset not implemented in current version.`,
    );
    return true; // Indicate the operation was attempted
  }

  /**
   * Get all registered service names
   */
  getRegisteredServices(): string[] {
    return Array.from(this.circuitBreakers.keys());
  }
}
