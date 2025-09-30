import { Injectable, Logger, Inject } from '@nestjs/common';
import { CircuitBreakerService } from '../common/resilience/circuit-breaker.service';
import { RetryService } from '../common/resilience/retry.service';
import { HealthCheckService } from '../health/health.service';
import { EnhancedEventBusService } from '../common/events/enhanced-event-bus.service';
import { Redis } from 'ioredis';
import { sql } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import * as schema from '../database/schema';

export interface SystemMetrics {
  timestamp: string;
  uptime: number;

  // Application metrics
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    utilizationPercent: number;
  };

  cpu: {
    user: number;
    system: number;
  };

  // Resilience metrics
  circuitBreakers: Array<{
    serviceName: string;
    state: string;
    failureCount: number;
    totalRequests: number;
    totalFailures: number;
    totalSuccesses: number;
    successRate: number;
  }>;

  retryOperations: Array<{
    operationName: string;
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    totalRetries: number;
    averageDelayMs: number;
    successRate: number;
  }>;

  // Event metrics
  events: {
    totalPublished: number;
    totalProcessed: number;
    totalFailed: number;
    eventsByType: Record<string, number>;
    averageProcessingTime: number;
  };

  // Database metrics
  database: {
    connectionCount: number;
    activeQueries: number;
    slowQueries: number;
    cacheHitRatio: number;
  };

  // Cache metrics
  redis: {
    connected: boolean;
    memoryUsage: number;
    keyCount: number;
    hitRate: number;
  };

  // API metrics
  api: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    requestsByEndpoint: Record<string, number>;
    requestsByMethod: Record<string, number>;
  };

  // Business metrics
  business: {
    activeWells: number;
    totalWells: number;
    wellsByStatus: Record<string, number>;
    recentActivity: Array<{
      type: string;
      count: number;
      timestamp: string;
    }>;
  };
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private apiMetrics = new Map<
    string,
    {
      totalRequests: number;
      totalResponseTime: number;
      errorCount: number;
      lastUpdated: Date;
    }
  >();

  constructor(
    private readonly databaseService: DatabaseService,
    @Inject('REDIS_CONNECTION')
    private readonly redis: Redis,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly retryService: RetryService,
    private readonly healthCheckService: HealthCheckService,
    private readonly eventBus: EnhancedEventBusService,
  ) {}

  async getSystemMetrics(): Promise<SystemMetrics> {
    const [
      memoryMetrics,
      cpuMetrics,
      circuitBreakerMetrics,
      retryMetrics,
      eventMetrics,
      databaseMetrics,
      redisMetrics,
      apiMetrics,
      businessMetrics,
    ] = await Promise.all([
      this.getMemoryMetrics(),
      this.getCpuMetrics(),
      this.getCircuitBreakerMetrics(),
      this.getRetryMetrics(),
      this.getEventMetrics(),
      this.getDatabaseMetrics(),
      this.getRedisMetrics(),
      this.getApiMetrics(),
      this.getBusinessMetrics(),
    ]);

    return {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - ((global as { startTime?: number }).startTime || 0),
      memory: memoryMetrics,
      cpu: cpuMetrics,
      circuitBreakers: circuitBreakerMetrics,
      retryOperations: retryMetrics,
      events: eventMetrics,
      database: databaseMetrics,
      redis: redisMetrics,
      api: apiMetrics,
      business: businessMetrics,
    };
  }

  recordApiRequest(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number,
  ): void {
    const key = `${method}:${endpoint}`;
    const existing = this.apiMetrics.get(key) || {
      totalRequests: 0,
      totalResponseTime: 0,
      errorCount: 0,
      lastUpdated: new Date(),
    };

    existing.totalRequests++;
    existing.totalResponseTime += responseTime;
    if (statusCode >= 400) {
      existing.errorCount++;
    }
    existing.lastUpdated = new Date();

    this.apiMetrics.set(key, existing);
  }

  /**
   * Increment a counter metric
   * Stub implementation for rate limiting metrics
   */
  increment(_metric: string, _tags?: Record<string, string>): void {
    // Stub implementation - could be extended to store metrics
    // For now, just log at debug level
    this.logger.debug(`Metric incremented: ${_metric}`);
  }

  /**
   * Set a gauge metric value
   * Stub implementation for rate limiting metrics
   */
  gauge(_metric: string, _value: number, _tags?: Record<string, string>): void {
    // Stub implementation - could be extended to store metrics
    // For now, just log at debug level
    this.logger.debug(`Gauge set: ${_metric} = ${_value}`);
  }

  private async getMemoryMetrics() {
    await Promise.resolve(); // Ensure async nature
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;

    return {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      utilizationPercent: Math.round((heapUsedMB / heapTotalMB) * 100),
    };
  }

  private async getCpuMetrics() {
    await Promise.resolve(); // Ensure async nature
    const cpuUsage = process.cpuUsage();
    return {
      user: cpuUsage.user,
      system: cpuUsage.system,
    };
  }

  private async getCircuitBreakerMetrics() {
    await Promise.resolve(); // Ensure async nature
    const metrics = this.circuitBreakerService.getAllMetrics();

    return metrics.map((metric) => ({
      serviceName: metric.serviceName,
      state: metric.state,
      failureCount: metric.failureCount,
      totalRequests: metric.totalRequests,
      totalFailures: metric.totalFailures,
      totalSuccesses: metric.totalSuccesses,
      successRate:
        metric.totalRequests > 0
          ? Math.round((metric.totalSuccesses / metric.totalRequests) * 100)
          : 0,
    }));
  }

  private async getRetryMetrics() {
    await Promise.resolve(); // Ensure async nature
    // Get retry metrics from the retry service
    // This would need to be implemented in the RetryService
    return [];
  }

  private async getEventMetrics() {
    await Promise.resolve(); // Ensure async nature
    const eventMetrics = this.eventBus.getEventMetrics();

    // Type guard for expected metric structure
    const isValidMetric = (
      metric: unknown,
    ): metric is {
      totalPublished: number;
      totalProcessed: number;
      totalFailed: number;
    } => {
      if (typeof metric !== 'object' || metric === null) {
        return false;
      }
      const obj = metric as Record<string, unknown>;
      return (
        typeof obj.totalPublished === 'number' &&
        typeof obj.totalProcessed === 'number' &&
        typeof obj.totalFailed === 'number'
      );
    };

    const validMetrics = Object.values(eventMetrics).filter(isValidMetric);

    const totalPublished = validMetrics.reduce(
      (sum, metric) => sum + metric.totalPublished,
      0,
    );
    const totalProcessed = validMetrics.reduce(
      (sum, metric) => sum + metric.totalProcessed,
      0,
    );
    const totalFailed = validMetrics.reduce(
      (sum, metric) => sum + metric.totalFailed,
      0,
    );

    return {
      totalPublished,
      totalProcessed,
      totalFailed,
      eventsByType: Object.keys(eventMetrics).reduce(
        (acc, eventType) => {
          // eslint-disable-next-line security/detect-object-injection
          const metric = eventMetrics[eventType];
          if (isValidMetric(metric)) {
            // eslint-disable-next-line security/detect-object-injection
            acc[eventType] = metric.totalPublished;
          }
          return acc;
        },
        {} as Record<string, number>,
      ),
      averageProcessingTime: 0, // Would need to track processing times
    };
  }

  private async getDatabaseMetrics() {
    try {
      // Get active connection count
      const db = this.databaseService.getDb();
      const result = (await db.execute(
        sql`SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active'`,
      )) as unknown as Array<Record<string, unknown>>;

      const activeConnections =
        Array.isArray(result) && result[0]
          ? parseInt(String(result[0].active_connections)) || 0
          : 0;

      return {
        connectionCount: activeConnections,
        activeQueries: activeConnections,
        slowQueries: 0, // Would need slow query log analysis
        cacheHitRatio: 0, // Would need pg_stat_database analysis
      };
    } catch (error) {
      this.logger.error('Failed to get database metrics:', error);
      return {
        connectionCount: 0,
        activeQueries: 0,
        slowQueries: 0,
        cacheHitRatio: 0,
      };
    }
  }

  private async getRedisMetrics() {
    try {
      const memory = await this.redis.info('memory');
      const stats = await this.redis.info('stats');

      const usedMemory = /used_memory:([^\r\n]+)/.exec(memory)?.[1] || '0';
      const keyspaceHits = /keyspace_hits:([^\r\n]+)/.exec(stats)?.[1] || '0';
      const keyspaceMisses =
        /keyspace_misses:([^\r\n]+)/.exec(stats)?.[1] || '0';

      const totalRequests = parseInt(keyspaceHits) + parseInt(keyspaceMisses);
      const hitRate =
        totalRequests > 0
          ? Math.round((parseInt(keyspaceHits) / totalRequests) * 100)
          : 0;

      return {
        connected: this.redis.status === 'ready',
        memoryUsage: parseInt(usedMemory),
        keyCount: await this.redis.dbsize(),
        hitRate,
      };
    } catch (error) {
      this.logger.error('Failed to get Redis metrics:', error);
      return {
        connected: false,
        memoryUsage: 0,
        keyCount: 0,
        hitRate: 0,
      };
    }
  }

  private async getApiMetrics() {
    await Promise.resolve(); // Ensure async nature
    const allMetrics = Array.from(this.apiMetrics.values());

    const totalRequests = allMetrics.reduce(
      (sum, metric) => sum + metric.totalRequests,
      0,
    );
    const totalResponseTime = allMetrics.reduce(
      (sum, metric) => sum + metric.totalResponseTime,
      0,
    );
    const totalErrors = allMetrics.reduce(
      (sum, metric) => sum + metric.errorCount,
      0,
    );

    const requestsByEndpoint: Record<string, number> = {};
    const requestsByMethod: Record<string, number> = {};

    for (const [key, metric] of this.apiMetrics) {
      const parts = key.split(':');
      const method = parts[0];
      const endpoint = parts[1] || 'unknown';

      if (method) {
        /* eslint-disable security/detect-object-injection */
        requestsByEndpoint[endpoint] =
          (requestsByEndpoint[endpoint] || 0) + metric.totalRequests;
        requestsByMethod[method] =
          (requestsByMethod[method] || 0) + metric.totalRequests;
        /* eslint-enable security/detect-object-injection */
      }
    }

    return {
      totalRequests,
      averageResponseTime:
        totalRequests > 0 ? Math.round(totalResponseTime / totalRequests) : 0,
      errorRate:
        totalRequests > 0 ? Math.round((totalErrors / totalRequests) * 100) : 0,
      requestsByEndpoint,
      requestsByMethod,
    };
  }

  private async getBusinessMetrics() {
    try {
      // Get well counts by status
      const db = this.databaseService.getDb();
      const wellsResult = await db
        .select({
          status: schema.wells.status,
          count: schema.wells.id,
        })
        .from(schema.wells)
        .$dynamic()
        .groupBy(schema.wells.status);

      const wellsByStatus: Record<string, number> = {};
      let totalWells = 0;

      if (Array.isArray(wellsResult)) {
        for (const row of wellsResult) {
          const rowData = row as Record<string, unknown>;
          const status = String(rowData.status) || 'unknown';
          const count = parseInt(String(rowData.count)) || 0;
          // eslint-disable-next-line security/detect-object-injection
          wellsByStatus[status] = count;
          totalWells += count;
        }
      }

      return {
        activeWells: wellsByStatus['active'] || 0,
        totalWells,
        wellsByStatus,
        recentActivity: [], // Would need to aggregate recent audit logs
      };
    } catch (error) {
      this.logger.error('Failed to get business metrics:', error);
      return {
        activeWells: 0,
        totalWells: 0,
        wellsByStatus: {},
        recentActivity: [],
      };
    }
  }
}
