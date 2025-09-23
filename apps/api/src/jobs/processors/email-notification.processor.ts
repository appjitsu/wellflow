import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { randomBytes } from 'crypto';
import { BullMQConfigService } from '../config/bullmq-config.service';
import {
  JobType,
  EmailNotificationJobData,
  ComplianceReminderJobData,
  ProductionAlertJobData,
  SystemNotificationJobData,
  NotificationJobResult,
} from '../types/job.types';

const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

/**
 * Email Notification Processor
 *
 * Processes email notification jobs for oil & gas operations.
 * Handles compliance reminders, production alerts, and system notifications.
 *
 * Notification Types:
 * - Compliance reminders (Form PR due, permit renewals)
 * - Production alerts (low production, equipment failures)
 * - System notifications (maintenance, security alerts)
 */
@Injectable()
export class EmailNotificationProcessor implements OnModuleInit {
  private readonly logger = new Logger(EmailNotificationProcessor.name);
  private worker!: Worker;

  constructor(private readonly bullMQConfig: BullMQConfigService) {}

  async onModuleInit() {
    await this.initializeWorker();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async initializeWorker() {
    const queueConfig = this.bullMQConfig.getQueueConfig(
      JobType.EMAIL_NOTIFICATION,
    );

    this.worker = new Worker(
      JobType.EMAIL_NOTIFICATION,
      async (job: Job<EmailNotificationJobData>) => {
        return await this.processJob(job);
      },
      {
        connection: this.bullMQConfig.getRedisConnection(),
        ...queueConfig?.workerOptions,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(
        `Email notification job ${job.id} completed successfully`,
      );
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `Email notification job ${job?.id} failed: ${err.message}`,
      );
    });

    this.worker.on('error', (err) => {
      this.logger.error(`Email notification worker error: ${err.message}`);
    });

    // Register worker with config service
    this.bullMQConfig.registerWorker(JobType.EMAIL_NOTIFICATION, this.worker);

    this.logger.log('Email notification processor initialized');
  }

  private async processJob(
    job: Job<EmailNotificationJobData>,
  ): Promise<NotificationJobResult> {
    const startTime = Date.now();
    this.logger.log(`Processing email notification job ${job.id}: ${job.name}`);

    try {
      const { data } = job;
      let result: NotificationJobResult;

      // Update progress
      await job.updateProgress(10);

      // Route to specific notification handler based on data type
      if ('reminderType' in data && 'dueDate' in data) {
        result = await this.sendComplianceReminder(data, job);
      } else if ('alertType' in data && 'wellId' in data) {
        result = await this.sendProductionAlert(data, job);
      } else if ('notificationType' in data && 'message' in data) {
        result = await this.sendSystemNotification(data, job);
      } else {
        throw new Error('Unknown email notification job type');
      }

      result.processingTime = Date.now() - startTime;

      // Final progress update
      await job.updateProgress(100);

      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
      this.logger.error(
        `Email notification job ${job.id} failed: ${errorMessage}`,
      );

      return {
        success: false,
        message: `Email notification failed: ${errorMessage}`,
        errors: [errorMessage],
        processingTime,
        sentTo: [],
        failedRecipients: [],
      };
    }
  }

  private async sendComplianceReminder(
    data: ComplianceReminderJobData,
    job: Job,
  ): Promise<NotificationJobResult> {
    this.logger.log(`Sending compliance reminder: ${data.reminderType}`);

    await job.updateProgress(25);

    // Simulate email template preparation
    const emailTemplate = this.getComplianceReminderTemplate(data.reminderType);
    await this.simulateDelay(300);

    await job.updateProgress(50);

    // Simulate sending emails
    const sentTo: string[] = [];
    const failedRecipients: string[] = [];

    for (const email of data.recipientEmails) {
      try {
        await this.simulateEmailSend(email, emailTemplate);
        sentTo.push(email);
        this.logger.log(`Compliance reminder sent to ${email}`);
      } catch (error) {
        failedRecipients.push(email);
        const errorMessage =
          error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
        this.logger.error(
          `Failed to send compliance reminder to ${email}: ${errorMessage}`,
        );
      }

      // Update progress incrementally
      const progress =
        50 +
        ((sentTo.length + failedRecipients.length) /
          data.recipientEmails.length) *
          40;
      await job.updateProgress(Math.floor(progress));
    }

    await job.updateProgress(90);

    return {
      success: failedRecipients.length === 0,
      message: `Compliance reminder sent to ${sentTo.length} recipients, ${failedRecipients.length} failed`,
      sentTo,
      failedRecipients,
      messageId: `compliance-${Date.now()}`,
    };
  }

  private async sendProductionAlert(
    data: ProductionAlertJobData,
    job: Job,
  ): Promise<NotificationJobResult> {
    this.logger.log(
      `Sending production alert: ${data.alertType} for well ${data.wellId}`,
    );

    await job.updateProgress(25);

    // Simulate alert template preparation
    const emailTemplate = this.getProductionAlertTemplate(
      data.alertType,
      data.alertData,
    );
    await this.simulateDelay(200);

    await job.updateProgress(50);

    // Simulate sending emails
    const sentTo: string[] = [];
    const failedRecipients: string[] = [];

    for (const email of data.recipientEmails) {
      try {
        await this.simulateEmailSend(email, emailTemplate);
        sentTo.push(email);
        this.logger.log(`Production alert sent to ${email}`);
      } catch (error) {
        failedRecipients.push(email);
        const errorMessage =
          error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
        this.logger.error(
          `Failed to send production alert to ${email}: ${errorMessage}`,
        );
      }

      // Update progress incrementally
      const progress =
        50 +
        ((sentTo.length + failedRecipients.length) /
          data.recipientEmails.length) *
          40;
      await job.updateProgress(Math.floor(progress));
    }

    return {
      success: failedRecipients.length === 0,
      message: `Production alert sent to ${sentTo.length} recipients, ${failedRecipients.length} failed`,
      sentTo,
      failedRecipients,
      messageId: `alert-${data.wellId}-${Date.now()}`,
    };
  }

  private async sendSystemNotification(
    data: SystemNotificationJobData,
    job: Job,
  ): Promise<NotificationJobResult> {
    this.logger.log(`Sending system notification: ${data.notificationType}`);

    await job.updateProgress(25);

    // Simulate notification template preparation
    const emailTemplate = this.getSystemNotificationTemplate(
      data.notificationType || 'system_maintenance',
      data.message,
    );
    await this.simulateDelay(150);

    await job.updateProgress(50);

    // Simulate sending emails
    const sentTo: string[] = [];
    const failedRecipients: string[] = [];

    for (const email of data.recipientEmails) {
      try {
        await this.simulateEmailSend(email, emailTemplate);
        sentTo.push(email);
        this.logger.log(`System notification sent to ${email}`);
      } catch (error) {
        failedRecipients.push(email);
        const errorMessage =
          error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
        this.logger.error(
          `Failed to send system notification to ${email}: ${errorMessage}`,
        );
      }

      // Update progress incrementally
      const progress =
        50 +
        ((sentTo.length + failedRecipients.length) /
          data.recipientEmails.length) *
          40;
      await job.updateProgress(Math.floor(progress));
    }

    return {
      success: failedRecipients.length === 0,
      message: `System notification sent to ${sentTo.length} recipients, ${failedRecipients.length} failed`,
      sentTo,
      failedRecipients,
      messageId: `system-${Date.now()}`,
    };
  }

  private getComplianceReminderTemplate(reminderType: string): string {
    const templates = new Map([
      [
        'form_pr_due',
        'Form PR Report Due - Please submit your production report',
      ],
      [
        'jib_statement_due',
        'JIB Statement Due - Joint Interest Billing statement required',
      ],
      [
        'permit_renewal',
        'Permit Renewal Required - Your permit is expiring soon',
      ],
      ['inspection_due', 'Inspection Due - Schedule your required inspection'],
    ]);
    return templates.get(reminderType) || 'Compliance reminder';
  }

  private getProductionAlertTemplate(
    alertType: string,
    alertData: {
      currentValue?: number;
      expectedValue?: number;
      severity?: string;
      threshold?: number;
    },
  ): string {
    const templates: Record<string, string> = {
      low_production: `Low Production Alert - Current: ${alertData.currentValue ?? 'N/A'}, Expected: ${alertData.expectedValue ?? 'N/A'}`,
      equipment_failure: `Equipment Failure Alert - Severity: ${alertData.severity ?? 'N/A'}`,
      anomaly_detected: `Production Anomaly Detected - Threshold exceeded: ${alertData.threshold ?? 'N/A'}`,
    };
    // eslint-disable-next-line security/detect-object-injection
    return templates[alertType] || 'Production alert';
  }

  private getSystemNotificationTemplate(
    notificationType: string,
    message: string,
  ): string {
    return `System Notification (${notificationType}): ${message}`;
  }

  private async simulateEmailSend(
    _email: string,
    _template: string,
  ): Promise<void> {
    // Simulate email sending delay using crypto-secure random
    const delayRandom = randomBytes(4).readUInt32BE(0) / 0xffffffff;
    await this.simulateDelay(100 + delayRandom * 200);

    // Simulate occasional failures (5% failure rate) using crypto-secure random
    const failureRandom = randomBytes(4).readUInt32BE(0) / 0xffffffff;
    if (failureRandom < 0.05) {
      throw new Error('Email service temporarily unavailable');
    }
  }

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async close() {
    if (this.worker) {
      await this.worker.close();
      this.logger.log('Email notification processor closed');
    }
  }
}
