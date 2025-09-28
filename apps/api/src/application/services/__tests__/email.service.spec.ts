import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email.service';
import { JobQueueService } from '../../../jobs/services/job-queue.service';
import { JobPriority } from '../../../jobs/types/job.types';

describe('EmailService', () => {
  let service: EmailService;
  let mockJobQueueService: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockJobQueueService = {
      addEmailNotificationJob: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: JobQueueService,
          useValue: mockJobQueueService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmailVerification', () => {
    it('should send email verification successfully', async () => {
      mockConfigService.get.mockReturnValue('https://app.example.com');
      mockJobQueueService.addEmailNotificationJob.mockResolvedValue(undefined);

      await service.sendEmailVerification(
        'user-123',
        'org-456',
        'user@example.com',
        'John',
        'Doe',
        'verification-token-123',
      );

      expect(mockConfigService.get).toHaveBeenCalledWith(
        'APP_BASE_URL',
        'http://localhost:3000',
      );

      expect(mockJobQueueService.addEmailNotificationJob).toHaveBeenCalledWith(
        'email-verification-user-123',
        {
          emailType: 'email_verification',
          recipientEmail: 'user@example.com',
          recipientName: 'John Doe',
          organizationId: 'org-456',
          userId: 'user-123',
          timestamp: expect.any(Date),
          templateData: {
            firstName: 'John',
            lastName: 'Doe',
            verificationToken: 'verification-token-123',
            verificationUrl:
              'https://app.example.com/auth/verify-email/user-123?token=verification-token-123',
          },
        },
        {
          priority: JobPriority.HIGH,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      );
    });

    it('should use default base URL when config not set', async () => {
      mockConfigService.get.mockReturnValue('http://localhost:3000');
      mockJobQueueService.addEmailNotificationJob.mockResolvedValue(undefined);

      await service.sendEmailVerification(
        'user-123',
        'org-456',
        'user@example.com',
        'John',
        'Doe',
        'verification-token-123',
      );

      expect(mockConfigService.get).toHaveBeenCalledWith(
        'APP_BASE_URL',
        'http://localhost:3000',
      );

      expect(mockJobQueueService.addEmailNotificationJob).toHaveBeenCalledWith(
        'email-verification-user-123',
        expect.objectContaining({
          templateData: expect.objectContaining({
            verificationUrl:
              'http://localhost:3000/auth/verify-email/user-123?token=verification-token-123',
          }),
        }),
        expect.any(Object),
      );
    });

    it('should throw error when job queue fails', async () => {
      mockConfigService.get.mockReturnValue('https://app.example.com');
      mockJobQueueService.addEmailNotificationJob.mockRejectedValue(
        new Error('Queue error'),
      );

      await expect(
        service.sendEmailVerification(
          'user-123',
          'org-456',
          'user@example.com',
          'John',
          'Doe',
          'verification-token-123',
        ),
      ).rejects.toThrow('Failed to send verification email');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      mockJobQueueService.addEmailNotificationJob.mockResolvedValue(undefined);

      await service.sendWelcomeEmail(
        'user-123',
        'org-456',
        'user@example.com',
        'John',
        'Doe',
        'Test Organization',
      );

      expect(mockJobQueueService.addEmailNotificationJob).toHaveBeenCalledWith(
        'welcome-email-user-123',
        {
          emailType: 'welcome',
          recipientEmail: 'user@example.com',
          recipientName: 'John Doe',
          organizationId: 'org-456',
          userId: 'user-123',
          timestamp: expect.any(Date),
          templateData: {
            firstName: 'John',
            lastName: 'Doe',
            organizationName: 'Test Organization',
          },
        },
        {
          priority: JobPriority.HIGH,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      );
    });

    it('should send welcome email without organization name', async () => {
      mockJobQueueService.addEmailNotificationJob.mockResolvedValue(undefined);

      await service.sendWelcomeEmail(
        'user-123',
        'org-456',
        'user@example.com',
        'John',
        'Doe',
      );

      expect(mockJobQueueService.addEmailNotificationJob).toHaveBeenCalledWith(
        'welcome-email-user-123',
        expect.objectContaining({
          templateData: {
            firstName: 'John',
            lastName: 'Doe',
            organizationName: undefined,
          },
        }),
        expect.any(Object),
      );
    });

    it('should throw error when welcome email job queue fails', async () => {
      mockJobQueueService.addEmailNotificationJob.mockRejectedValue(
        new Error('Queue error'),
      );

      await expect(
        service.sendWelcomeEmail(
          'user-123',
          'org-456',
          'user@example.com',
          'John',
          'Doe',
        ),
      ).rejects.toThrow('Failed to send welcome email');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      mockConfigService.get.mockReturnValue('https://app.example.com');
      mockJobQueueService.addEmailNotificationJob.mockResolvedValue(undefined);

      await service.sendPasswordResetEmail(
        'user-123',
        'org-456',
        'user@example.com',
        'John',
        'Doe',
        'reset-token-123',
      );

      expect(mockConfigService.get).toHaveBeenCalledWith(
        'APP_BASE_URL',
        'http://localhost:3000',
      );

      expect(mockJobQueueService.addEmailNotificationJob).toHaveBeenCalledWith(
        'password-reset-user-123',
        {
          emailType: 'password_reset',
          recipientEmail: 'user@example.com',
          recipientName: 'John Doe',
          organizationId: 'org-456',
          userId: 'user-123',
          timestamp: expect.any(Date),
          templateData: {
            firstName: 'John',
            lastName: 'Doe',
            resetToken: 'reset-token-123',
            resetUrl:
              'https://app.example.com/auth/reset-password?token=reset-token-123&userId=user-123',
          },
        },
        {
          priority: JobPriority.HIGH,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      );
    });

    it('should throw error when password reset email job queue fails', async () => {
      mockConfigService.get.mockReturnValue('https://app.example.com');
      mockJobQueueService.addEmailNotificationJob.mockRejectedValue(
        new Error('Queue error'),
      );

      await expect(
        service.sendPasswordResetEmail(
          'user-123',
          'org-456',
          'user@example.com',
          'John',
          'Doe',
          'reset-token-123',
        ),
      ).rejects.toThrow('Failed to send password reset email');
    });
  });

  describe('resendEmailVerification', () => {
    it('should resend email verification using same logic as sendEmailVerification', async () => {
      mockConfigService.get.mockReturnValue('https://app.example.com');
      mockJobQueueService.addEmailNotificationJob.mockResolvedValue(undefined);

      await service.resendEmailVerification(
        'user-123',
        'org-456',
        'user@example.com',
        'John',
        'Doe',
        'verification-token-123',
      );

      expect(mockJobQueueService.addEmailNotificationJob).toHaveBeenCalledWith(
        'email-verification-user-123',
        expect.objectContaining({
          emailType: 'email_verification',
          recipientEmail: 'user@example.com',
          recipientName: 'John Doe',
        }),
        expect.any(Object),
      );
    });
  });
});
