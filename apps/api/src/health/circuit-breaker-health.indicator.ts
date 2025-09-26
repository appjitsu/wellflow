import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { CircuitBreakerService } from '../common/resilience/circuit-breaker.service';

@Injectable()
export class CircuitBreakerHealthIndicator extends HealthIndicator {
  constructor(private readonly circuitBreakerService: CircuitBreakerService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const metrics = this.circuitBreakerService.getAllMetrics();

      // Check for unhealthy circuit breakers (too many failures or stuck open)
      const unhealthyBreakers = metrics.filter(
        (metric) => metric.state === 'OPEN' && metric.failureCount > 10,
      );

      const openBreakers = metrics.filter((metric) => metric.state === 'OPEN');
      const halfOpenBreakers = metrics.filter(
        (metric) => metric.state === 'HALF_OPEN',
      );

      const isHealthy = unhealthyBreakers.length === 0;

      return this.getStatus(key, isHealthy, {
        totalCircuitBreakers: metrics.length,
        openCircuitBreakers: openBreakers.length,
        halfOpenCircuitBreakers: halfOpenBreakers.length,
        unhealthyCircuitBreakers: unhealthyBreakers.length,
        circuitBreakerStates: metrics.reduce((acc, metric) => {
          acc[metric.serviceName] = {
            state: metric.state,
            failureCount: metric.failureCount,
            lastFailureTime: metric.lastFailureTime,
            totalRequests: metric.totalRequests,
            totalFailures: metric.totalFailures,
            totalSuccesses: metric.totalSuccesses,
          };
          return acc;
        }, {}),
        status: isHealthy ? 'healthy' : 'degraded',
      });
    } catch (error) {
      return this.getStatus(key, false, {
        error: error.message,
        status: 'error',
      });
    }
  }
}
