import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IQueryPerformanceObserver,
  QueryPerformanceMetrics,
  PerformanceAlert,
} from './query-performance.service';

/**
 * Performance Alert Observer
 * Implements Observer Pattern for handling performance alerts
 * Follows Single Responsibility Principle - only handles alerting
 */
@Injectable()
export class PerformanceAlertObserver implements IQueryPerformanceObserver {
  private readonly logger = new Logger(PerformanceAlertObserver.name);
  private readonly alertCounts = new Map<string, number>();
  private readonly lastAlertTime = new Map<string, Date>();

  // Rate limiting for alerts (prevent spam)
  private readonly alertRateLimit = {
    maxAlertsPerMinute: 10,
    cooldownMinutes: 5,
  };

  constructor(private readonly configService: ConfigService) {
    // Override rate limits from configuration
    this.alertRateLimit.maxAlertsPerMinute = this.configService.get<number>(
      'ALERT_RATE_LIMIT_PER_MINUTE',
      10,
    );
    this.alertRateLimit.cooldownMinutes = this.configService.get<number>(
      'ALERT_COOLDOWN_MINUTES',
      5,
    );
  }

  /**
   * Handle query execution events
   * Logs successful queries at debug level
   */
  onQueryExecuted(metrics: QueryPerformanceMetrics): void {
    // Only log if execution time is notable or in debug mode
    const isDebugMode =
      this.configService.get<string>('NODE_ENV') === 'development';

    if (isDebugMode || metrics.executionTime > 10) {
      this.logger.debug(
        `Query executed: ${metrics.queryId} in ${metrics.executionTime}ms`,
        {
          organizationId: metrics.organizationId,
          userId: metrics.userId,
          rowCount: metrics.rowCount,
        },
      );
    }
  }

  /**
   * Handle slow query detection
   * Implements rate limiting to prevent alert spam
   */
  onSlowQueryDetected(alert: PerformanceAlert): void {
    const alertKey = this.generateAlertKey(alert);

    // Check rate limiting
    if (!this.shouldSendAlert(alertKey)) {
      return;
    }

    // Update alert tracking
    this.updateAlertTracking(alertKey);

    // Log the alert based on severity
    this.logAlert(alert);

    // Send notifications based on severity
    this.sendNotifications(alert);
  }

  /**
   * Handle query errors
   * Always logs errors regardless of rate limiting
   */
  onQueryError(metrics: QueryPerformanceMetrics): void {
    this.logger.error(
      `Query error: ${metrics.queryId} failed after ${metrics.executionTime}ms`,
      {
        error: metrics.error,
        query: this.sanitizeQuery(metrics.query),
        organizationId: metrics.organizationId,
        userId: metrics.userId,
        parameters: this.sanitizeParameters(metrics.parameters),
      },
    );

    // Create error alert
    const errorAlert: PerformanceAlert = {
      type: 'ERROR',
      severity: 'HIGH',
      message: `Query failed: ${metrics.error}`,
      metrics,
      threshold: 0,
    };

    this.sendNotifications(errorAlert);
  }

  /**
   * Generate unique key for alert rate limiting
   */
  private generateAlertKey(alert: PerformanceAlert): string {
    const { type, severity, metrics } = alert;
    const orgId = metrics.organizationId || 'global';

    // Create key based on alert type, severity, and organization
    return `${type}_${severity}_${orgId}`;
  }

  /**
   * Check if alert should be sent based on rate limiting
   */
  private shouldSendAlert(alertKey: string): boolean {
    const now = new Date();
    const lastAlert = this.lastAlertTime.get(alertKey);
    const alertCount = this.alertCounts.get(alertKey) || 0;

    // If no previous alert, allow it
    if (!lastAlert) {
      return true;
    }

    // Check cooldown period
    const cooldownMs = this.alertRateLimit.cooldownMinutes * 60 * 1000;
    const timeSinceLastAlert = now.getTime() - lastAlert.getTime();

    if (timeSinceLastAlert < cooldownMs) {
      // Within cooldown period, check rate limit
      const minutesSinceLastAlert = timeSinceLastAlert / (60 * 1000);
      const allowedAlerts = Math.floor(
        minutesSinceLastAlert * this.alertRateLimit.maxAlertsPerMinute,
      );

      return alertCount <= allowedAlerts;
    }

    // Outside cooldown period, reset counter
    this.alertCounts.set(alertKey, 0);
    return true;
  }

  /**
   * Update alert tracking counters
   */
  private updateAlertTracking(alertKey: string): void {
    const now = new Date();
    const currentCount = this.alertCounts.get(alertKey) || 0;

    this.alertCounts.set(alertKey, currentCount + 1);
    this.lastAlertTime.set(alertKey, now);
  }

  /**
   * Log alert based on severity level
   */
  private logAlert(alert: PerformanceAlert): void {
    const { type, severity, message, metrics, threshold } = alert;
    const logContext = {
      alertType: type,
      severity,
      queryId: metrics.queryId,
      executionTime: metrics.executionTime,
      threshold,
      organizationId: metrics.organizationId,
      userId: metrics.userId,
      query: this.sanitizeQuery(metrics.query),
    };

    switch (severity) {
      case 'CRITICAL':
        this.logger.error(`🚨 CRITICAL ALERT: ${message}`, logContext);
        break;
      case 'HIGH':
        this.logger.error(`⚠️ HIGH ALERT: ${message}`, logContext);
        break;
      case 'MEDIUM':
        this.logger.warn(`⚡ MEDIUM ALERT: ${message}`, logContext);
        break;
      case 'LOW':
        this.logger.warn(`📊 LOW ALERT: ${message}`, logContext);
        break;
    }
  }

  /**
   * Send notifications based on alert severity
   * In a real implementation, this would integrate with notification services
   */
  private sendNotifications(alert: PerformanceAlert): void {
    const { severity, type } = alert;

    // For now, just log the notification intent
    // In production, this would integrate with:
    // - Email notifications (Resend)
    // - SMS alerts (Twilio) for critical issues
    // - Slack/Teams webhooks
    // - PagerDuty for critical production issues

    if (severity === 'CRITICAL') {
      this.logger.error(
        `📱 Would send CRITICAL notification for ${type} alert`,
        { alert },
      );
    } else if (severity === 'HIGH') {
      this.logger.warn(
        `📧 Would send HIGH priority notification for ${type} alert`,
        { alert },
      );
    }

    // Log performance metrics for monitoring dashboards
    this.logPerformanceMetrics(alert);
  }

  /**
   * Log structured performance metrics for external monitoring
   * These logs can be ingested by monitoring systems like DataDog, New Relic, etc.
   */
  private logPerformanceMetrics(alert: PerformanceAlert): void {
    const performanceMetric = {
      timestamp: alert.metrics.timestamp.toISOString(),
      metric_type: 'database_performance',
      alert_type: alert.type,
      severity: alert.severity,
      execution_time_ms: alert.metrics.executionTime,
      threshold_ms: alert.threshold,
      organization_id: alert.metrics.organizationId,
      user_id: alert.metrics.userId,
      query_id: alert.metrics.queryId,
      environment: this.configService.get<string>('NODE_ENV', 'development'),
    };

    // Log as structured JSON for monitoring systems
    this.logger.log(
      `PERFORMANCE_METRIC: ${JSON.stringify(performanceMetric)}`,
      'PerformanceMetrics',
    );
  }

  /**
   * Sanitize SQL query for logging (remove sensitive data)
   */
  private sanitizeQuery(query: string): string {
    if (!query) return '';

    // Remove potential sensitive data patterns
    return query
      .replace(/password\s*=\s*'[^']*'/gi, "password='***'")
      .replace(/token\s*=\s*'[^']*'/gi, "token='***'")
      .replace(/secret\s*=\s*'[^']*'/gi, "secret='***'")
      .substring(0, 500); // Limit length
  }

  /**
   * Sanitize query parameters for logging
   */
  private sanitizeParameters(parameters?: unknown[]): unknown[] {
    if (!parameters) return [];

    return parameters.map((param, index) => {
      // If parameter looks like sensitive data, mask it
      if (typeof param === 'string') {
        if (
          param.includes('password') ||
          param.includes('token') ||
          param.includes('secret')
        ) {
          return '***';
        }
        // Limit string length
        return param.length > 100 ? param.substring(0, 100) + '...' : param;
      }

      return param;
    });
  }

  /**
   * Get alert statistics for monitoring
   */
  getAlertStatistics(): Record<string, unknown> {
    const stats: Record<string, unknown> = {};

    for (const [alertKey, count] of this.alertCounts.entries()) {
      stats[alertKey] = {
        count,
        lastAlert: this.lastAlertTime.get(alertKey)?.toISOString(),
      };
    }

    return {
      alertCounts: stats,
      rateLimit: this.alertRateLimit,
      totalAlertTypes: this.alertCounts.size,
    };
  }

  /**
   * Reset alert counters (useful for testing)
   */
  resetAlertCounters(): void {
    this.alertCounts.clear();
    this.lastAlertTime.clear();
  }
}
