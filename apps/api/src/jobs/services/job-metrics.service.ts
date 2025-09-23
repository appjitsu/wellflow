import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JobType } from '../types/job.types';

export interface JobMetrics {
  jobId: string;
  queueName: string;
  jobName: string;
  jobType: JobType;
  status: 'started' | 'completed' | 'failed' | 'stalled' | 'delayed';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  attemptNumber: number;
  memoryUsage?: number;
  cpuUsage?: number;
  errorMessage?: string;
  organizationId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface QueueMetrics {
  queueName: string;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  activeJobs: number;
  waitingJobs: number;
  delayedJobs: number;
  averageDuration: number;
  successRate: number;
  lastUpdated: Date;
}

export interface SystemMetrics {
  totalQueues: number;
  totalJobs: number;
  totalCompletedJobs: number;
  totalFailedJobs: number;
  overallSuccessRate: number;
  averageJobDuration: number;
  peakJobsPerHour: number;
  systemUptime: number;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: Date;
}

/**
 * Job Metrics Service
 *
 * Collects, aggregates, and reports metrics for BullMQ job processing
 * in the WellFlow system. Integrates with Sentry for error tracking
 * and provides structured logging for monitoring and analytics.
 *
 * Features:
 * - Real-time job metrics collection
 * - Queue performance monitoring
 * - System-wide analytics
 * - Sentry integration for error tracking
 * - Structured logging for observability
 * - Performance trend analysis
 */
@Injectable()
export class JobMetricsService {
  private readonly logger = new Logger(JobMetricsService.name);

  // In-memory metrics storage (in production, use Redis or database)
  private jobMetrics: Map<string, JobMetrics> = new Map();
  private queueMetrics: Map<string, QueueMetrics> = new Map();
  private systemStartTime: Date = new Date();

  /**
   * Record job start metrics
   */
  recordJobStart(job: Job): void {
    if (!job || !job.id) {
      this.logger.warn('Cannot record metrics for invalid job');
      return;
    }

    const metrics: JobMetrics = {
      jobId: job.id,
      queueName: job.queueName,
      jobName: job.name,
      jobType: job.queueName as JobType,
      status: 'started',
      startTime: new Date(),
      attemptNumber: job.attemptsMade + 1,
      memoryUsage: this.getMemoryUsage(),
      organizationId: (job.data as Record<string, unknown> | undefined)
        ?.organizationId as string | undefined,
      userId: (job.data as Record<string, unknown> | undefined)?.userId as
        | string
        | undefined,
      metadata: {
        priority: job.opts?.priority,
        delay: job.opts?.delay,
        attempts: job.opts?.attempts,
      },
    };

    this.jobMetrics.set(job.id, metrics);

    this.logger.log(`Job started: ${job.name} (${job.id})`, {
      jobId: job.id,
      queueName: job.queueName,
      jobName: job.name,
      attemptNumber: metrics.attemptNumber,
      organizationId: metrics.organizationId,
      userId: metrics.userId,
    });

    // Update queue metrics
    this.updateQueueMetrics(job.queueName, 'started');
  }

  /**
   * Record job completion metrics
   */
  recordJobComplete(job: Job, result?: unknown): void {
    const jobId = job.id;
    if (!jobId) return;

    const existingMetrics = this.jobMetrics.get(jobId);
    if (!existingMetrics) {
      this.logger.warn(`No start metrics found for completed job: ${job.id}`);
      return;
    }

    const endTime = new Date();
    const duration = Math.max(
      1,
      endTime.getTime() - existingMetrics.startTime.getTime(),
    ); // Ensure minimum 1ms

    const completedMetrics: JobMetrics = {
      ...existingMetrics,
      status: 'completed',
      endTime,
      duration,
      memoryUsage: this.getMemoryUsage(),
      metadata: {
        ...existingMetrics.metadata,
        result: this.sanitizeResult(result),
      },
    };

    this.jobMetrics.set(jobId, completedMetrics);

    this.logger.log(`Job completed: ${job.name} (${job.id})`, {
      jobId: job.id,
      queueName: job.queueName,
      jobName: job.name,
      duration,
      attemptNumber: completedMetrics.attemptNumber,
      organizationId: completedMetrics.organizationId,
      userId: completedMetrics.userId,
      success: true,
    });

    // Update queue metrics
    this.updateQueueMetrics(job.queueName, 'completed', duration);

    // Send metrics to external services
    this.sendMetricsToSentry(completedMetrics, 'completed');
  }

  /**
   * Record job failure metrics
   */
  recordJobFailure(job: Job, error: Error): void {
    const jobId = job.id;
    if (!jobId) return;

    const existingMetrics = this.jobMetrics.get(jobId);
    if (!existingMetrics) {
      this.logger.warn(`No start metrics found for failed job: ${job.id}`);
      return;
    }

    const endTime = new Date();
    const duration = endTime.getTime() - existingMetrics.startTime.getTime();

    const failedMetrics: JobMetrics = {
      ...existingMetrics,
      status: 'failed',
      endTime,
      duration,
      errorMessage: error.message,
      memoryUsage: this.getMemoryUsage(),
      metadata: {
        ...existingMetrics.metadata,
        errorName: error.name,
        errorStack: error.stack,
      },
    };

    this.jobMetrics.set(jobId, failedMetrics);

    this.logger.error(`Job failed: ${job.name} (${job.id})`, {
      jobId: job.id,
      queueName: job.queueName,
      jobName: job.name,
      duration,
      attemptNumber: failedMetrics.attemptNumber,
      error: error.message,
      organizationId: failedMetrics.organizationId,
      userId: failedMetrics.userId,
      success: false,
    });

    // Update queue metrics
    this.updateQueueMetrics(job.queueName, 'failed', duration);

    // Send error metrics to Sentry
    this.sendMetricsToSentry(failedMetrics, 'failed', error);
  }

  /**
   * Get metrics for a specific job
   */
  getJobMetrics(jobId: string): JobMetrics | undefined {
    return this.jobMetrics.get(jobId);
  }

  /**
   * Get metrics for a specific queue
   */
  getQueueMetrics(queueName: string): QueueMetrics | undefined {
    return this.queueMetrics.get(queueName);
  }

  /**
   * Get all queue metrics
   */
  getAllQueueMetrics(): QueueMetrics[] {
    return Array.from(this.queueMetrics.values());
  }

  /**
   * Get system-wide metrics
   */
  getSystemMetrics(): SystemMetrics {
    const allJobs = Array.from(this.jobMetrics.values());
    const completedJobs = allJobs.filter((job) => job.status === 'completed');
    const failedJobs = allJobs.filter((job) => job.status === 'failed');

    const totalDuration = completedJobs.reduce(
      (sum, job) => sum + (job.duration || 0),
      0,
    );
    const averageDuration =
      completedJobs.length > 0 ? totalDuration / completedJobs.length : 0;

    const successRate =
      allJobs.length > 0
        ? (completedJobs.length / (completedJobs.length + failedJobs.length)) *
          100
        : 0;

    return {
      totalQueues: this.queueMetrics.size,
      totalJobs: allJobs.length,
      totalCompletedJobs: completedJobs.length,
      totalFailedJobs: failedJobs.length,
      overallSuccessRate: successRate,
      averageJobDuration: averageDuration,
      peakJobsPerHour: this.calculatePeakJobsPerHour(),
      systemUptime: Date.now() - this.systemStartTime.getTime(),
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCpuUsage(),
      timestamp: new Date(),
    };
  }

  /**
   * Get job metrics by time range
   */
  getJobMetricsByTimeRange(startTime: Date, endTime: Date): JobMetrics[] {
    return Array.from(this.jobMetrics.values()).filter(
      (metrics) =>
        metrics.startTime >= startTime && metrics.startTime <= endTime,
    );
  }

  /**
   * Get job metrics by organization
   */
  getJobMetricsByOrganization(organizationId: string): JobMetrics[] {
    return Array.from(this.jobMetrics.values()).filter(
      (metrics) => metrics.organizationId === organizationId,
    );
  }

  /**
   * Clear old metrics (cleanup)
   */
  clearOldMetrics(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    let removedCount = 0;

    for (const [jobId, metrics] of this.jobMetrics.entries()) {
      if (metrics.startTime < cutoffTime) {
        this.jobMetrics.delete(jobId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.log(
        `Cleared ${removedCount} old job metrics (older than ${olderThanHours} hours)`,
      );
    }
  }

  /**
   * Update queue-level metrics
   */
  private updateQueueMetrics(
    queueName: string,
    event: string,
    duration?: number,
  ): void {
    let queueMetrics = this.queueMetrics.get(queueName);

    if (!queueMetrics) {
      queueMetrics = {
        queueName,
        totalJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        activeJobs: 0,
        waitingJobs: 0,
        delayedJobs: 0,
        averageDuration: 0,
        successRate: 0,
        lastUpdated: new Date(),
      };
    }

    switch (event) {
      case 'started':
        queueMetrics.totalJobs++;
        queueMetrics.activeJobs++;
        break;
      case 'completed':
        queueMetrics.completedJobs++;
        queueMetrics.activeJobs = Math.max(0, queueMetrics.activeJobs - 1);
        if (duration) {
          queueMetrics.averageDuration =
            (queueMetrics.averageDuration * (queueMetrics.completedJobs - 1) +
              duration) /
            queueMetrics.completedJobs;
        }
        break;
      case 'failed':
        queueMetrics.failedJobs++;
        queueMetrics.activeJobs = Math.max(0, queueMetrics.activeJobs - 1);
        break;
    }

    // Calculate success rate
    const totalFinished = queueMetrics.completedJobs + queueMetrics.failedJobs;
    queueMetrics.successRate =
      totalFinished > 0
        ? (queueMetrics.completedJobs / totalFinished) * 100
        : 0;

    queueMetrics.lastUpdated = new Date();
    this.queueMetrics.set(queueName, queueMetrics);
  }

  /**
   * Send metrics to Sentry for monitoring
   */
  private sendMetricsToSentry(
    metrics: JobMetrics,
    event: string,
    error?: Error,
  ): void {
    try {
      // Future: Integrate with actual Sentry SDK
      // This is a placeholder for Sentry integration
      const sentryData = {
        event,
        jobId: metrics.jobId,
        queueName: metrics.queueName,
        jobName: metrics.jobName,
        duration: metrics.duration,
        attemptNumber: metrics.attemptNumber,
        organizationId: metrics.organizationId,
        userId: metrics.userId,
        timestamp: new Date().toISOString(),
      };

      if (error) {
        // Sentry.captureException(error, { extra: sentryData });
        this.logger.debug('Would send error to Sentry', {
          error: error.message,
          ...sentryData,
        });
      } else {
        // Sentry.addBreadcrumb({ message: `Job ${event}`, data: sentryData });
        this.logger.debug('Would send breadcrumb to Sentry', sentryData);
      }
    } catch (sentryError) {
      this.logger.error('Failed to send metrics to Sentry:', sentryError);
    }
  }

  /**
   * Calculate peak jobs per hour
   */
  private calculatePeakJobsPerHour(): number {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentJobs = Array.from(this.jobMetrics.values()).filter(
      (metrics) => metrics.startTime >= oneHourAgo,
    );

    return recentJobs.length;
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    const memUsage = process.memoryUsage();
    return Math.round(memUsage.heapUsed / 1024 / 1024); // MB
  }

  /**
   * Get current CPU usage (placeholder)
   */
  private getCpuUsage(): number {
    // Future: Implement actual CPU usage calculation
    return 0;
  }

  /**
   * Sanitize job result for logging
   */
  private sanitizeResult(result: unknown): unknown {
    if (!result || typeof result !== 'object') {
      return result;
    }

    // Remove sensitive data from result
    const sanitized = { ...(result as Record<string, unknown>) };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey'];

    sensitiveFields.forEach((field) => {
      if (field in sanitized) {
        // eslint-disable-next-line security/detect-object-injection
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
