import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobQueueService } from '../../jobs/services/job-queue.service';
import { UserAuthEmailJobData, JobPriority } from '../../jobs/types/job.types';

/**
 * Email Service
 * Handles sending emails for user authentication workflows
 *
 * Integrates with the job queue system for reliable email delivery
 * Supports email verification, welcome emails, and password reset
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly jobQueueService: JobQueueService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send email verification email
   */
  async sendEmailVerification(
    userId: string,
    organizationId: string,
    email: string,
    firstName: string,
    lastName: string,
    verificationToken: string,
  ): Promise<void> {
    const baseUrl = this.configService.get<string>(
      'APP_BASE_URL',
      'http://localhost:3000',
    );
    const verificationUrl = `${baseUrl}/auth/verify-email/${userId}?token=${verificationToken}`;

    const emailData: UserAuthEmailJobData = {
      emailType: 'email_verification',
      recipientEmail: email,
      recipientName: `${firstName} ${lastName}`,
      organizationId,
      userId,
      timestamp: new Date(),
      templateData: {
        firstName,
        lastName,
        verificationToken,
        verificationUrl,
      },
    };

    try {
      await this.jobQueueService.addEmailNotificationJob(
        `email-verification-${userId}`,
        emailData,
        {
          priority: JobPriority.HIGH,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      );

      this.logger.log(`Email verification queued for ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to queue email verification for ${email}:`,
        error,
      );
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send welcome email after successful verification
   */
  async sendWelcomeEmail(
    userId: string,
    organizationId: string,
    email: string,
    firstName: string,
    lastName: string,
    organizationName?: string,
  ): Promise<void> {
    const emailData: UserAuthEmailJobData = {
      emailType: 'welcome',
      recipientEmail: email,
      recipientName: `${firstName} ${lastName}`,
      organizationId,
      userId,
      timestamp: new Date(),
      templateData: {
        firstName,
        lastName,
        organizationName,
      },
    };

    try {
      await this.jobQueueService.addEmailNotificationJob(
        `welcome-email-${userId}`,
        emailData,
        {
          priority: JobPriority.HIGH,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      );

      this.logger.log(`Welcome email queued for ${email}`);
    } catch (error) {
      this.logger.error(`Failed to queue welcome email for ${email}:`, error);
      throw new Error('Failed to send welcome email');
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    userId: string,
    organizationId: string,
    email: string,
    firstName: string,
    lastName: string,
    resetToken: string,
  ): Promise<void> {
    const baseUrl = this.configService.get<string>(
      'APP_BASE_URL',
      'http://localhost:3000',
    );
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}&userId=${userId}`;

    const emailData: UserAuthEmailJobData = {
      emailType: 'password_reset',
      recipientEmail: email,
      recipientName: `${firstName} ${lastName}`,
      organizationId,
      userId,
      timestamp: new Date(),
      templateData: {
        firstName,
        lastName,
        resetToken,
        resetUrl,
      },
    };

    try {
      await this.jobQueueService.addEmailNotificationJob(
        `password-reset-${userId}`,
        emailData,
        {
          priority: JobPriority.HIGH,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      );

      this.logger.log(`Password reset email queued for ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to queue password reset email for ${email}:`,
        error,
      );
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(
    userId: string,
    organizationId: string,
    email: string,
    firstName: string,
    lastName: string,
    verificationToken: string,
  ): Promise<void> {
    // Use the same logic as sendEmailVerification but with different job name
    await this.sendEmailVerification(
      userId,
      organizationId,
      email,
      firstName,
      lastName,
      verificationToken,
    );

    this.logger.log(`Email verification resent for ${email}`);
  }
}
