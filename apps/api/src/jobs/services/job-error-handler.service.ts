import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { randomBytes } from 'crypto';
import { JobType } from '../types/job.types';

export interface ErrorHandlingConfig {
  maxRetries: number;
  backoffType: 'fixed' | 'exponential';
  baseDelay: number;
  maxDelay: number;
  jitter: boolean;
  deadLetterQueue: boolean;
  alertThreshold: number;
}

export interface JobError {
  jobId: string;
  queueName: string;
  jobName: string;
  error: Error;
  attemptNumber: number;
  timestamp: Date;
  jobData: unknown;
}

export interface ErrorSummary {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByJob: Record<string, number>;
  timeRange: {
    start: number;
    end: number;
  };
}

export interface ErrorStatistics {
  errorCount: number;
  lastError: Date | null;
  errorsByType: Record<string, number>;
}

/**
 * Job Error Handler Service
 *
 * Provides comprehensive error handling, retry logic, and dead letter queue
 * management for BullMQ jobs in the WellFlow system.
 *
 * Features:
 * - Configurable retry strategies
 * - Exponential backoff with jitter
 * - Dead letter queue management
 * - Error alerting and notifications
 * - Detailed error logging and metrics
 */
@Injectable()
export class JobErrorHandlerService {
  private readonly logger = new Logger(JobErrorHandlerService.name);

  // Error handling configurations by job type
  private readonly errorConfigs: Record<JobType, ErrorHandlingConfig> = {
    [JobType.DATA_VALIDATION]: {
      maxRetries: 3,
      backoffType: 'exponential',
      baseDelay: 2000,
      maxDelay: 30000,
      jitter: true,
      deadLetterQueue: true,
      alertThreshold: 5, // Alert after 5 failures in 1 hour
    },
    [JobType.REPORT_GENERATION]: {
      maxRetries: 2,
      backoffType: 'exponential',
      baseDelay: 5000,
      maxDelay: 60000,
      jitter: true,
      deadLetterQueue: true,
      alertThreshold: 3, // Alert after 3 failures in 1 hour
    },
    [JobType.EMAIL_NOTIFICATION]: {
      maxRetries: 5,
      backoffType: 'exponential',
      baseDelay: 1000,
      maxDelay: 15000,
      jitter: true,
      deadLetterQueue: true,
      alertThreshold: 10, // Alert after 10 failures in 1 hour
    },
  };

  // Track recent errors for alerting
  private recentErrors: Map<string, JobError[]> = new Map();

  /**
   * Handle job failure with appropriate retry logic
   */
  async handleJobFailure(job: Job, error: Error): Promise<void> {
    const queueName = job.queueName as JobType;

    // Validate queueName is a valid JobType to prevent object injection
    if (!Object.values(JobType).includes(queueName)) {
      this.logger.error(`Invalid queue name: ${queueName}`);
      return;
    }

    // eslint-disable-next-line security/detect-object-injection
    const config = this.errorConfigs[queueName];

    if (!config) {
      this.logger.error(`No error config found for queue: ${queueName}`);
      return;
    }

    const jobError: JobError = {
      jobId: job.id || 'unknown',
      queueName,
      jobName: job.name,
      error,
      attemptNumber: job.attemptsMade,
      timestamp: new Date(),
      jobData: this.sanitizeJobData(job.data),
    };

    // Log the error
    this.logJobError(jobError);

    // Track error for alerting
    this.trackError(jobError);

    // Check if we should retry
    if (job.attemptsMade < config.maxRetries) {
      this.scheduleRetry(job, config);
    } else {
      await this.handleMaxRetriesExceeded(job, jobError, config);
    }

    // Check if we need to send alerts
    await this.checkAlertThreshold(queueName, config);
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  calculateRetryDelay(
    attemptNumber: number,
    config: ErrorHandlingConfig,
  ): number {
    let delay: number;

    if (config.backoffType === 'exponential') {
      delay = Math.min(
        config.baseDelay * Math.pow(2, attemptNumber - 1),
        config.maxDelay,
      );
    } else {
      delay = config.baseDelay;
    }

    // Add jitter to prevent thundering herd
    if (config.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      // Use crypto-secure random for jitter calculation
      const randomValue = randomBytes(4).readUInt32BE(0) / 0xffffffff;
      delay += randomValue * jitterAmount - jitterAmount / 2;
    }

    return Math.floor(delay);
  }

  /**
   * Schedule job retry with calculated delay
   */
  private scheduleRetry(job: Job, config: ErrorHandlingConfig): void {
    const delay = this.calculateRetryDelay(job.attemptsMade + 1, config);

    this.logger.log(
      `Scheduling retry for job ${job.id} (${job.name}) in ${delay}ms (attempt ${job.attemptsMade + 1}/${config.maxRetries})`,
    );

    // The retry will be handled automatically by BullMQ based on job options
    // This method is for logging and custom retry logic if needed
  }

  /**
   * Handle jobs that have exceeded maximum retries
   */
  private async handleMaxRetriesExceeded(
    job: Job,
    jobError: JobError,
    config: ErrorHandlingConfig,
  ): Promise<void> {
    this.logger.error(
      `Job ${job.id} (${job.name}) exceeded maximum retries (${config.maxRetries})`,
    );

    if (config.deadLetterQueue) {
      await this.moveToDeadLetterQueue(job, jobError);
    }

    // Send immediate alert for critical failures
    await this.sendCriticalFailureAlert(jobError);
  }

  /**
   * Move failed job to dead letter queue
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  private async moveToDeadLetterQueue(
    job: Job,
    jobError: JobError,
  ): Promise<void> {
    // In a real implementation, you would move the job to a dead letter queue
    // For now, we'll log it as a dead letter
    this.logger.error(`Moving job ${job.id} to dead letter queue`, {
      jobId: job.id,
      queueName: job.queueName,
      jobName: job.name,
      finalError: jobError.error.message,
      attempts: job.attemptsMade,
      jobData: jobError.jobData,
    });

    // NOTE: Dead letter queue storage implementation is deferred to future iteration
    // Planned implementation: Redis list or database table for failed job persistence
    // Tracking issue: Create GitHub issue for DLQ implementation
  }

  /**
   * Track errors for alerting purposes
   */
  private trackError(jobError: JobError): void {
    const key = `${jobError.queueName}:errors`;
    const errors = this.recentErrors.get(key) || [];

    // Add new error
    errors.push(jobError);

    // Keep only errors from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrors = errors.filter((error) => error.timestamp > oneHourAgo);

    this.recentErrors.set(key, recentErrors);
  }

  /**
   * Check if error threshold is exceeded and send alerts
   */
  private async checkAlertThreshold(
    queueName: JobType,
    config: ErrorHandlingConfig,
  ): Promise<void> {
    const key = `${queueName}:errors`;
    const errors = this.recentErrors.get(key) || [];

    if (errors.length >= config.alertThreshold) {
      await this.sendErrorThresholdAlert(queueName, errors, config);
    }
  }

  /**
   * Send alert when error threshold is exceeded
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  private async sendErrorThresholdAlert(
    queueName: JobType,
    errors: JobError[],
    config: ErrorHandlingConfig,
  ): Promise<void> {
    this.logger.warn(
      `Error threshold exceeded for queue ${queueName}: ${errors.length} errors in the last hour (threshold: ${config.alertThreshold})`,
    );

    // NOTE: External alerting integration is deferred to future iteration
    // Planned integrations: Email, Slack, PagerDuty for threshold alerts
    // Current implementation logs alerts for monitoring system integration
    const errorSummary = this.generateErrorSummary(errors);

    this.logger.warn('Error threshold alert', {
      queueName,
      errorCount: errors.length,
      threshold: config.alertThreshold,
      timeWindow: '1 hour',
      errorSummary,
    });
  }

  /**
   * Send immediate alert for critical failures
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  private async sendCriticalFailureAlert(jobError: JobError): Promise<void> {
    this.logger.error('Critical job failure alert', {
      jobId: jobError.jobId,
      queueName: jobError.queueName,
      jobName: jobError.jobName,
      error: jobError.error.message,
      attempts: jobError.attemptNumber,
      timestamp: jobError.timestamp,
    });

    // NOTE: Critical failure alerting is deferred to future iteration
    // Planned implementation: Immediate notifications for max retry exceeded
  }

  /**
   * Generate error summary for alerts
   */
  private generateErrorSummary(errors: JobError[]): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsByJob: Record<string, number>;
    timeRange: { start: number; end: number };
  } {
    const errorsByTypeMap = new Map<string, number>();
    const errorsByJobMap = new Map<string, number>();

    // Use Maps to avoid object injection issues
    for (const error of errors) {
      const errorType = error.error.constructor.name;
      errorsByTypeMap.set(errorType, (errorsByTypeMap.get(errorType) || 0) + 1);

      const jobName = error.jobName;
      errorsByJobMap.set(jobName, (errorsByJobMap.get(jobName) || 0) + 1);
    }

    // Convert Maps to Records for return type compatibility
    const errorsByType = Object.fromEntries(errorsByTypeMap);
    const errorsByJob = Object.fromEntries(errorsByJobMap);

    return {
      totalErrors: errors.length,
      errorsByType,
      errorsByJob,
      timeRange: {
        start: Math.min(...errors.map((e) => e.timestamp.getTime())),
        end: Math.max(...errors.map((e) => e.timestamp.getTime())),
      },
    };
  }

  /**
   * Log job error with structured data
   */
  private logJobError(jobError: JobError): void {
    this.logger.error(`Job failed: ${jobError.jobName} (${jobError.jobId})`, {
      jobId: jobError.jobId,
      queueName: jobError.queueName,
      jobName: jobError.jobName,
      error: {
        name: jobError.error.name,
        message: jobError.error.message,
        stack: jobError.error.stack,
      },
      attemptNumber: jobError.attemptNumber,
      timestamp: jobError.timestamp,
      jobData: jobError.jobData,
    });
  }

  /**
   * Sanitize job data for logging (remove sensitive information)
   */
  private sanitizeJobData(data: unknown): unknown {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sanitized = { ...(data as Record<string, unknown>) };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey'];
    sensitiveFields.forEach((field) => {
      if (field in sanitized) {
        // eslint-disable-next-line security/detect-object-injection
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStatistics(): Record<
    string,
    {
      errorCount: number;
      lastError: Date | null;
      errorsByType: Record<string, number>;
    }
  > {
    const stats: Record<
      string,
      {
        errorCount: number;
        lastError: Date | null;
        errorsByType: Record<string, number>;
      }
    > = {};

    for (const [key, errors] of this.recentErrors.entries()) {
      const [queueName] = key.split(':');
      if (queueName) {
        // eslint-disable-next-line security/detect-object-injection
        stats[queueName] = {
          errorCount: errors.length,
          lastError:
            errors.length > 0
              ? (errors[errors.length - 1]?.timestamp ?? null)
              : null,
          errorsByType: (() => {
            const typeMap = new Map<string, number>();
            for (const error of errors) {
              const type = error.error.constructor.name;
              typeMap.set(type, (typeMap.get(type) || 0) + 1);
            }
            return Object.fromEntries(typeMap);
          })(),
        };
      }
    }

    return stats;
  }

  /**
   * Clear error history (useful for testing or maintenance)
   */
  clearErrorHistory(): void {
    this.recentErrors.clear();
    this.logger.log('Error history cleared');
  }
}
