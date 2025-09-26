import { Injectable, Logger, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';

export interface QueryMetrics {
  query: string;
  executionTime: number;
  timestamp: Date;
  connectionId?: string;
  userId?: string;
  applicationName?: string;
  clientAddress?: string;
}

export interface SlowQueryAlert {
  query: string;
  executionTime: number;
  threshold: number;
  timestamp: Date;
  metadata: {
    connectionId?: string;
    userId?: string;
    applicationName?: string;
    clientAddress?: string;
    queryPlan?: any;
  };
}

export interface DatabasePerformanceMetrics {
  timestamp: Date;
  activeConnections: number;
  totalConnections: number;
  connectionUtilization: number;
  cacheHitRatio: number;
  averageQueryTime: number;
  slowQueriesCount: number;
  deadlocksCount: number;
  tempFilesCount: number;
  tempFilesSize: number;
  bufferCacheHitRatio: number;
  indexUsageRatio: number;
}

/**
 * Database Performance Monitoring Service
 * Monitors query performance, slow queries, and database health metrics
 */
@Injectable()
export class DatabasePerformanceService {
  private readonly logger = new Logger(DatabasePerformanceService.name);
  private queryMetrics: QueryMetrics[] = [];
  private slowQueryThreshold = 1000; // 1 second
  private metricsRetentionPeriod = 24 * 60 * 60 * 1000; // 24 hours
  private maxMetricsStored = 10000;

  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    this.startMonitoring();
  }

  /**
   * Record a query execution
   */
  async recordQueryExecution(
    query: string,
    executionTime: number,
    metadata?: {
      connectionId?: string;
      userId?: string;
      applicationName?: string;
      clientAddress?: string;
    },
  ): Promise<void> {
    const queryMetric: QueryMetrics = {
      query: this.sanitizeQuery(query),
      executionTime,
      timestamp: new Date(),
      ...metadata,
    };

    this.queryMetrics.push(queryMetric);

    // Check for slow query
    if (executionTime > this.slowQueryThreshold) {
      await this.handleSlowQuery(queryMetric);
    }

    // Maintain metrics array size
    if (this.queryMetrics.length > this.maxMetricsStored) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetricsStored);
    }

    // Clean old metrics periodically
    this.cleanOldMetrics();
  }

  /**
   * Get current performance metrics
   */
  async getPerformanceMetrics(): Promise<DatabasePerformanceMetrics> {
    const [connectionStats, cacheStats, queryStats] = await Promise.allSettled([
      this.getConnectionStats(),
      this.getCacheStats(),
      this.getQueryStats(),
    ]);

    const connections = connectionStats.status === 'fulfilled' ? connectionStats.value : {
      activeConnections: 0,
      totalConnections: 0,
      connectionUtilization: 0,
    };

    const cache = cacheStats.status === 'fulfilled' ? cacheStats.value : {
      cacheHitRatio: 0,
      bufferCacheHitRatio: 0,
      indexUsageRatio: 0,
    };

    const queries = queryStats.status === 'fulfilled' ? queryStats.value : {
      averageQueryTime: 0,
      slowQueriesCount: 0,
    };

    return {
      timestamp: new Date(),
      activeConnections: connections.activeConnections,
      totalConnections: connections.totalConnections,
      connectionUtilization: connections.connectionUtilization,
      cacheHitRatio: cache.cacheHitRatio,
      bufferCacheHitRatio: cache.bufferCacheHitRatio,
      indexUsageRatio: cache.indexUsageRatio,
      averageQueryTime: queries.averageQueryTime,
      slowQueriesCount: queries.slowQueriesCount,
      deadlocksCount: 0, // Would need to query pg_stat_database
      tempFilesCount: 0, // Would need to query pg_stat_database
      tempFilesSize: 0, // Would need to query pg_stat_database
    };
  }

  /**
   * Get slow queries within a time period
   */
  getSlowQueries(
    timeRangeMs: number = 60 * 60 * 1000, // 1 hour
    minExecutionTime: number = this.slowQueryThreshold,
  ): QueryMetrics[] {
    const cutoffTime = new Date(Date.now() - timeRangeMs);

    return this.queryMetrics
      .filter(metric =>
        metric.timestamp >= cutoffTime &&
        metric.executionTime >= minExecutionTime
      )
      .sort((a, b) => b.executionTime - a.executionTime);
  }

  /**
   * Get query performance statistics
   */
  getQueryPerformanceStats(timeRangeMs: number = 60 * 60 * 1000): {
    totalQueries: number;
    averageExecutionTime: number;
    medianExecutionTime: number;
    p95ExecutionTime: number;
    p99ExecutionTime: number;
    slowQueriesCount: number;
    topSlowQueries: Array<{ query: string; count: number; averageTime: number }>;
  } {
    const cutoffTime = new Date(Date.now() - timeRangeMs);
    const recentMetrics = this.queryMetrics.filter(m => m.timestamp >= cutoffTime);

    if (recentMetrics.length === 0) {
      return {
        totalQueries: 0,
        averageExecutionTime: 0,
        medianExecutionTime: 0,
        p95ExecutionTime: 0,
        p99ExecutionTime: 0,
        slowQueriesCount: 0,
        topSlowQueries: [],
      };
    }

    const executionTimes = recentMetrics.map(m => m.executionTime).sort((a, b) => a - b);
    const slowQueries = recentMetrics.filter(m => m.executionTime > this.slowQueryThreshold);

    // Calculate percentiles
    const p95Index = Math.floor(executionTimes.length * 0.95);
    const p99Index = Math.floor(executionTimes.length * 0.99);
    const medianIndex = Math.floor(executionTimes.length / 2);

    // Group queries by pattern
    const queryGroups = new Map<string, { totalTime: number; count: number; queries: string[] }>();
    slowQueries.forEach(metric => {
      const pattern = this.extractQueryPattern(metric.query);
      if (!queryGroups.has(pattern)) {
        queryGroups.set(pattern, { totalTime: 0, count: 0, queries: [] });
      }
      const group = queryGroups.get(pattern)!;
      group.totalTime += metric.executionTime;
      group.count++;
      group.queries.push(metric.query);
    });

    const topSlowQueries = Array.from(queryGroups.entries())
      .map(([pattern, stats]) => ({
        query: pattern,
        count: stats.count,
        averageTime: stats.totalTime / stats.count,
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    return {
      totalQueries: recentMetrics.length,
      averageExecutionTime: executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length,
      medianExecutionTime: executionTimes[medianIndex],
      p95ExecutionTime: executionTimes[p95Index] || executionTimes[executionTimes.length - 1],
      p99ExecutionTime: executionTimes[p99Index] || executionTimes[executionTimes.length - 1],
      slowQueriesCount: slowQueries.length,
      topSlowQueries,
    };
  }

  /**
   * Set slow query threshold
   */
  setSlowQueryThreshold(thresholdMs: number): void {
    this.slowQueryThreshold = thresholdMs;
  }

  /**
   * Get database locks information
   */
  async getLockInfo(): Promise<{
    activeLocks: number;
    blockedQueries: number;
    lockWaiters: Array<{
      waitingPid: number;
      waitingQuery: string;
      blockingPid: number;
      blockingQuery: string;
      lockType: string;
      relation: string;
    }>;
  }> {
    try {
      // This would query pg_locks, pg_stat_activity, etc.
      // For now, return mock data structure
      return {
        activeLocks: 0,
        blockedQueries: 0,
        lockWaiters: [],
      };
    } catch (error) {
      this.logger.error('Failed to get lock information:', error);
      return {
        activeLocks: 0,
        blockedQueries: 0,
        lockWaiters: [],
      };
    }
  }

  private async handleSlowQuery(queryMetric: QueryMetrics): Promise<void> {
    this.logger.warn(`Slow query detected: ${queryMetric.executionTime}ms`, {
      query: queryMetric.query,
      executionTime: queryMetric.executionTime,
      threshold: this.slowQueryThreshold,
      connectionId: queryMetric.connectionId,
      userId: queryMetric.userId,
      timestamp: queryMetric.timestamp,
    });

    // Here you could:
    // 1. Send alerts to monitoring systems
    // 2. Log to external monitoring service
    // 3. Trigger query optimization suggestions
    // 4. Collect query execution plans for analysis
  }

  private async getConnectionStats(): Promise<{
    activeConnections: number;
    totalConnections: number;
    connectionUtilization: number;
  }> {
    try {
      const result = await this.db.execute({
        sql: `
          SELECT
            count(*) as active_connections,
            (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections
          FROM pg_stat_activity
          WHERE state = 'active'
        `,
        args: [],
      });

      const activeConnections = Array.isArray(result) && result[0]
        ? parseInt((result[0] as any).active_connections) || 0
        : 0;

      const maxConnections = Array.isArray(result) && result[0]
        ? parseInt((result[0] as any).max_connections) || 100
        : 100;

      return {
        activeConnections,
        totalConnections: maxConnections,
        connectionUtilization: (activeConnections / maxConnections) * 100,
      };
    } catch (error) {
      this.logger.error('Failed to get connection stats:', error);
      return {
        activeConnections: 0,
        totalConnections: 0,
        connectionUtilization: 0,
      };
    }
  }

  private async getCacheStats(): Promise<{
    cacheHitRatio: number;
    bufferCacheHitRatio: number;
    indexUsageRatio: number;
  }> {
    try {
      // Query pg_stat_database for cache statistics
      const result = await this.db.execute({
        sql: `
          SELECT
            blks_hit::float / (blks_hit + blks_read) * 100 as cache_hit_ratio
          FROM pg_stat_database
          WHERE datname = current_database()
        `,
        args: [],
      });

      const cacheHitRatio = Array.isArray(result) && result[0]
        ? parseFloat((result[0] as any).cache_hit_ratio) || 0
        : 0;

      return {
        cacheHitRatio,
        bufferCacheHitRatio: cacheHitRatio, // Simplified
        indexUsageRatio: 0, // Would need more complex query
      };
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error);
      return {
        cacheHitRatio: 0,
        bufferCacheHitRatio: 0,
        indexUsageRatio: 0,
      };
    }
  }

  private getQueryStats(): {
    averageQueryTime: number;
    slowQueriesCount: number;
  } {
    const recentMetrics = this.queryMetrics.filter(
      m => m.timestamp > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );

    const averageQueryTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.executionTime, 0) / recentMetrics.length
      : 0;

    const slowQueriesCount = recentMetrics.filter(
      m => m.executionTime > this.slowQueryThreshold
    ).length;

    return {
      averageQueryTime,
      slowQueriesCount,
    };
  }

  private sanitizeQuery(query: string): string {
    // Remove actual values from parameterized queries for privacy
    return query
      .replace(/\$[0-9]+/g, '?') // Replace parameter placeholders
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private extractQueryPattern(query: string): string {
    // Extract the basic structure of the query for grouping
    return query
      .replace(/\b\d+\b/g, '?') // Replace numbers
      .replace(/'[^']*'/g, '?') // Replace string literals
      .replace(/\b[a-f0-9-]{36}\b/g, '?') // Replace UUIDs
      .replace(/\s+/g, ' ')
      .trim();
  }

  private cleanOldMetrics(): void {
    const cutoffTime = new Date(Date.now() - this.metricsRetentionPeriod);
    this.queryMetrics = this.queryMetrics.filter(
      metric => metric.timestamp > cutoffTime
    );
  }

  private startMonitoring(): void {
    // Set up periodic cleanup
    setInterval(() => {
      this.cleanOldMetrics();
    }, 60 * 60 * 1000); // Clean every hour
  }
}
