import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Query Performance Metrics Interface
 * Defines the structure for query performance data
 */
export interface QueryPerformanceMetrics {
  queryId: string;
  query: string;
  executionTime: number;
  timestamp: Date;
  parameters?: unknown[];
  rowCount?: number;
  error?: string;
  organizationId?: string;
  userId?: string;
}

/**
 * Performance Alert Interface
 * Defines alerts for slow queries
 */
export interface PerformanceAlert {
  type: 'SLOW_QUERY' | 'TIMEOUT' | 'ERROR';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  metrics: QueryPerformanceMetrics;
  threshold: number;
}

/**
 * Query Performance Observer Interface
 * Implements Observer Pattern for performance monitoring
 */
export interface IQueryPerformanceObserver {
  onQueryExecuted(metrics: QueryPerformanceMetrics): void;
  onSlowQueryDetected(alert: PerformanceAlert): void;
  onQueryError(metrics: QueryPerformanceMetrics): void;
}

/**
 * Performance Statistics Interface
 * Aggregated performance data
 */
export interface PerformanceStatistics {
  totalQueries: number;
  averageExecutionTime: number;
  slowQueries: number;
  errorQueries: number;
  p95ExecutionTime: number;
  p99ExecutionTime: number;
  queriesPerSecond: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

/**
 * Query Performance Monitoring Service
 * Implements Observer Pattern and Single Responsibility Principle
 * Tracks query execution times to meet KAN-33 <50ms database query requirement
 */
@Injectable()
export class QueryPerformanceService {
  private readonly logger = new Logger(QueryPerformanceService.name);
  private readonly observers: IQueryPerformanceObserver[] = [];
  private readonly queryMetrics: Map<string, QueryPerformanceMetrics[]> =
    new Map();
  private readonly performanceThresholds = {
    slowQueryThreshold: 50, // KAN-33 requirement: <50ms
    criticalQueryThreshold: 200, // Critical threshold
    timeoutThreshold: 5000, // 5 seconds timeout
  };

  constructor(private readonly configService: ConfigService) {
    // Override thresholds from configuration if provided
    this.performanceThresholds.slowQueryThreshold =
      this.configService.get<number>('DB_SLOW_QUERY_THRESHOLD', 50);
    this.performanceThresholds.criticalQueryThreshold =
      this.configService.get<number>('DB_CRITICAL_QUERY_THRESHOLD', 200);
    this.performanceThresholds.timeoutThreshold =
      this.configService.get<number>('DB_TIMEOUT_THRESHOLD', 5000);
  }

  /**
   * Subscribe to performance events (Observer Pattern)
   */
  subscribe(observer: IQueryPerformanceObserver): void {
    this.observers.push(observer);
  }

  /**
   * Unsubscribe from performance events
   */
  unsubscribe(observer: IQueryPerformanceObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  /**
   * Record query execution metrics
   * Main method for tracking query performance
   */
  recordQueryExecution(metrics: QueryPerformanceMetrics): void {
    // Store metrics for analysis
    const organizationKey = metrics.organizationId || 'global';
    if (!this.queryMetrics.has(organizationKey)) {
      this.queryMetrics.set(organizationKey, []);
    }

    const orgMetrics = this.queryMetrics.get(organizationKey)!;
    orgMetrics.push(metrics);

    // Keep only last 1000 queries per organization to prevent memory leaks
    if (orgMetrics.length > 1000) {
      orgMetrics.shift();
    }

    // Notify observers
    this.notifyQueryExecuted(metrics);

    // Check for performance issues
    this.analyzeQueryPerformance(metrics);

    // Log performance data
    this.logQueryPerformance(metrics);
  }

  /**
   * Create a query execution timer
   * Returns a function to stop the timer and record metrics
   */
  startQueryTimer(
    queryId: string,
    query: string,
    parameters?: unknown[],
    organizationId?: string,
    userId?: string,
  ): () => void {
    const startTime = Date.now();

    return () => {
      const executionTime = Date.now() - startTime;
      const metrics: QueryPerformanceMetrics = {
        queryId,
        query,
        executionTime,
        timestamp: new Date(),
        parameters,
        organizationId,
        userId,
      };

      this.recordQueryExecution(metrics);
    };
  }

  /**
   * Record query error
   */
  recordQueryError(
    queryId: string,
    query: string,
    error: string,
    executionTime: number,
    organizationId?: string,
    userId?: string,
  ): void {
    const metrics: QueryPerformanceMetrics = {
      queryId,
      query,
      executionTime,
      timestamp: new Date(),
      error,
      organizationId,
      userId,
    };

    this.recordQueryExecution(metrics);
    this.notifyQueryError(metrics);
  }

  /**
   * Get performance statistics for an organization
   */
  getPerformanceStatistics(
    organizationId?: string,
    timeRangeMinutes: number = 60,
  ): PerformanceStatistics {
    const organizationKey = organizationId || 'global';
    const metrics = this.queryMetrics.get(organizationKey) || [];

    const cutoffTime = new Date(Date.now() - timeRangeMinutes * 60 * 1000);
    const recentMetrics = metrics.filter((m) => m.timestamp >= cutoffTime);

    if (recentMetrics.length === 0) {
      return this.getEmptyStatistics(timeRangeMinutes);
    }

    const executionTimes = recentMetrics
      .map((m) => m.executionTime)
      .sort((a, b) => a - b);
    const slowQueries = recentMetrics.filter(
      (m) => m.executionTime > this.performanceThresholds.slowQueryThreshold,
    ).length;
    const errorQueries = recentMetrics.filter((m) => m.error).length;

    return {
      totalQueries: recentMetrics.length,
      averageExecutionTime:
        executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length,
      slowQueries,
      errorQueries,
      p95ExecutionTime: this.calculatePercentile(executionTimes, 0.95),
      p99ExecutionTime: this.calculatePercentile(executionTimes, 0.99),
      queriesPerSecond: recentMetrics.length / (timeRangeMinutes * 60),
      timeRange: {
        start: cutoffTime,
        end: new Date(),
      },
    };
  }

  /**
   * Get slow queries for analysis
   */
  getSlowQueries(
    organizationId?: string,
    limit: number = 10,
  ): QueryPerformanceMetrics[] {
    const organizationKey = organizationId || 'global';
    const metrics = this.queryMetrics.get(organizationKey) || [];

    return metrics
      .filter(
        (m) => m.executionTime > this.performanceThresholds.slowQueryThreshold,
      )
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, limit);
  }

  /**
   * Clear metrics for an organization (useful for testing)
   */
  clearMetrics(organizationId?: string): void {
    const organizationKey = organizationId || 'global';
    this.queryMetrics.delete(organizationKey);
  }

  /**
   * Private method to notify observers of query execution
   */
  private notifyQueryExecuted(metrics: QueryPerformanceMetrics): void {
    this.observers.forEach((observer) => {
      try {
        observer.onQueryExecuted(metrics);
      } catch (error) {
        this.logger.error('Error notifying query execution observer:', error);
      }
    });
  }

  /**
   * Private method to notify observers of query errors
   */
  private notifyQueryError(metrics: QueryPerformanceMetrics): void {
    this.observers.forEach((observer) => {
      try {
        observer.onQueryError(metrics);
      } catch (error) {
        this.logger.error('Error notifying query error observer:', error);
      }
    });
  }

  /**
   * Private method to notify observers of slow queries
   */
  private notifySlowQuery(alert: PerformanceAlert): void {
    this.observers.forEach((observer) => {
      try {
        observer.onSlowQueryDetected(alert);
      } catch (error) {
        this.logger.error('Error notifying slow query observer:', error);
      }
    });
  }

  /**
   * Analyze query performance and generate alerts
   */
  private analyzeQueryPerformance(metrics: QueryPerformanceMetrics): void {
    const { executionTime } = metrics;

    // Check for slow queries
    if (executionTime > this.performanceThresholds.slowQueryThreshold) {
      const severity = this.determineSeverity(executionTime);
      const alert: PerformanceAlert = {
        type: 'SLOW_QUERY',
        severity,
        message: `Query exceeded ${this.performanceThresholds.slowQueryThreshold}ms threshold`,
        metrics,
        threshold: this.performanceThresholds.slowQueryThreshold,
      };

      this.notifySlowQuery(alert);
    }

    // Check for timeouts
    if (executionTime > this.performanceThresholds.timeoutThreshold) {
      const alert: PerformanceAlert = {
        type: 'TIMEOUT',
        severity: 'CRITICAL',
        message: `Query exceeded timeout threshold of ${this.performanceThresholds.timeoutThreshold}ms`,
        metrics,
        threshold: this.performanceThresholds.timeoutThreshold,
      };

      this.notifySlowQuery(alert);
    }
  }

  /**
   * Determine alert severity based on execution time
   */
  private determineSeverity(
    executionTime: number,
  ): PerformanceAlert['severity'] {
    if (executionTime > this.performanceThresholds.timeoutThreshold) {
      return 'CRITICAL';
    } else if (
      executionTime > this.performanceThresholds.criticalQueryThreshold
    ) {
      return 'HIGH';
    } else if (
      executionTime >
      this.performanceThresholds.slowQueryThreshold * 2
    ) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  /**
   * Log query performance data
   */
  private logQueryPerformance(metrics: QueryPerformanceMetrics): void {
    const { queryId, executionTime, error, organizationId } = metrics;

    if (error) {
      this.logger.error(
        `Query error: ${queryId} (${executionTime}ms) - ${error}`,
        { organizationId, metrics },
      );
    } else if (executionTime > this.performanceThresholds.slowQueryThreshold) {
      this.logger.warn(`Slow query detected: ${queryId} (${executionTime}ms)`, {
        organizationId,
        metrics,
      });
    } else {
      this.logger.debug(`Query executed: ${queryId} (${executionTime}ms)`, {
        organizationId,
      });
    }
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(
    sortedArray: number[],
    percentile: number,
  ): number {
    if (sortedArray.length === 0) return 0;

    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Get empty statistics structure
   */
  private getEmptyStatistics(timeRangeMinutes: number): PerformanceStatistics {
    const now = new Date();
    return {
      totalQueries: 0,
      averageExecutionTime: 0,
      slowQueries: 0,
      errorQueries: 0,
      p95ExecutionTime: 0,
      p99ExecutionTime: 0,
      queriesPerSecond: 0,
      timeRange: {
        start: new Date(now.getTime() - timeRangeMinutes * 60 * 1000),
        end: now,
      },
    };
  }
}
