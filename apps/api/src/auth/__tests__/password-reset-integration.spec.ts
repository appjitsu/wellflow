import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { AuthController } from '../auth.controller';
import { AuditLogService } from '../../application/services/audit-log.service';
import { EmailService } from '../../application/services/email.service';
import { OrganizationsService } from '../../organizations/organizations.service';
import { SuspiciousActivityDetectorService } from '../../application/services/suspicious-activity-detector.service';
import { AbilitiesFactory } from '../../authorization/abilities.factory';
import {
  AuditAction,
  AuditResourceType,
} from '../../domain/entities/audit-log.entity';
import { User, UserRole } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email';
import { Password } from '../../domain/value-objects/password';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { randomUUID } from 'crypto';

/**
 * Integration Tests for Password Reset Flow
 *
 * Tests the complete password reset workflow from forgot-password
 * to reset-password including token validation and security measures.
 */
describe('Password Reset Integration', () => {
  let authController: AuthController;
  let mockUserRepository: any;
  let mockPasswordHistoryRepository: any;
  let mockEmailService: any;
  let mockAuditLogService: any;
  let mockSuspiciousActivityDetector: any;

  let testUser: User;

  beforeEach(async () => {
    // Create test user
    testUser = new User(
      randomUUID(),
      randomUUID(),
      Email.create('test@example.com'),
      'Test',
      'User',
      UserRole.MANAGER,
      '+1234567890',
      (await Password.create('OldSecret123!')).getHashedValue(),
      true,
    );
    // Mock repositories and services
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };

    mockPasswordHistoryRepository = {
      getRecentPasswordHashes: jest.fn(),
      getPasswordHashesByUserId: jest.fn(),
      save: jest.fn(),
      cleanup: jest.fn(),
    };

    mockEmailService = {
      sendPasswordResetEmail: jest.fn(),
    };

    mockAuditLogService = {
      logSuccess: jest.fn(),
      logFailure: jest.fn(),
      logSecurityEvent: jest.fn(),
      logUserAction: jest.fn(),
    };

    mockSuspiciousActivityDetector = {
      analyzeLoginAttempt: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: 'UserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: 'PasswordHistoryRepository',
          useValue: mockPasswordHistoryRepository,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
        {
          provide: SuspiciousActivityDetectorService,
          useValue: mockSuspiciousActivityDetector,
        },
        {
          provide: AbilitiesFactory,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn(), verify: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: OrganizationsService,
          useValue: {},
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
  });

  describe('Complete Password Reset Flow', () => {
    it('should successfully complete forgot password → reset password flow', async () => {
      // Step 1: User requests password reset
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'test@example.com',
      };

      mockUserRepository.findByEmail.mockResolvedValue(testUser);
      mockUserRepository.save.mockResolvedValue(testUser);
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      // Execute forgot password
      await authController.forgotPassword(forgotPasswordDto);

      // Verify email service was called
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        testUser.getId(),
        testUser.getOrganizationId(),
        'test@example.com',
        'Test',
        'User',
        expect.any(String),
      );

      // Verify user was saved with reset token
      expect(mockUserRepository.save).toHaveBeenCalledWith(testUser);

      // Step 2: User resets password with token
      // Set up valid reset token on the user (simulating what the service does)
      const resetToken = 'valid-reset-token-for-test';
      const futureDate = new Date(Date.now() + 15 * 60 * 1000);
      testUser.setPasswordResetToken(resetToken, futureDate);

      const resetPasswordDto: ResetPasswordDto = {
        userId: testUser.getId(),
        token: resetToken,
        newPassword: 'NewSecureSecret123!',
        confirmPassword: 'NewSecureSecret123!',
      };

      // Mock password history (empty for this test)
      mockPasswordHistoryRepository.getPasswordHashesByUserId.mockResolvedValue(
        [],
      );
      mockPasswordHistoryRepository.save.mockResolvedValue(undefined);
      mockPasswordHistoryRepository.cleanup.mockResolvedValue(undefined);

      mockUserRepository.findById.mockResolvedValue(testUser);

      // Execute password reset
      const result = await authController.resetPassword(resetPasswordDto);

      // Verify successful response
      expect(result).toEqual({
        message:
          'Password has been reset successfully. You can now log in with your new password.',
        resetAt: expect.any(Date),
      });

      // Verify password history was saved
      expect(mockPasswordHistoryRepository.save).toHaveBeenCalled();

      // Verify audit logging
      expect(mockAuditLogService.logSuccess).toHaveBeenCalledWith(
        AuditAction.UPDATE,
        AuditResourceType.USER,
        testUser.getId(),
        {},
        expect.objectContaining({
          businessContext: expect.objectContaining({
            action: 'password_reset_completed',
            email: 'test@example.com',
          }),
        }),
      );
    });

    it('should reject password reset with invalid token', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        userId: testUser.getId(),
        token: 'invalid-token',
        newPassword: 'NewSecureSecret123!',
        confirmPassword: 'NewSecureSecret123!',
      };

      mockUserRepository.findById.mockResolvedValue(testUser);

      await expect(
        authController.resetPassword(resetPasswordDto),
      ).rejects.toThrow('Invalid or expired password reset token');
    });

    it('should reject password reset with expired token', async () => {
      // Set up user with expired token
      const expiredDate = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
      testUser.setPasswordResetToken('valid-token', expiredDate);

      const resetPasswordDto: ResetPasswordDto = {
        userId: testUser.getId(),
        token: 'valid-token',
        newPassword: 'NewSecureSecret123!',
        confirmPassword: 'NewSecureSecret123!',
      };

      mockUserRepository.findById.mockResolvedValue(testUser);

      await expect(
        authController.resetPassword(resetPasswordDto),
      ).rejects.toThrow('Invalid or expired password reset token');
    });

    it('should reject password that matches recent history', async () => {
      // Set up valid reset token
      const validToken = 'valid-reset-token';
      const futureDate = new Date(Date.now() + 15 * 60 * 1000);
      testUser.setPasswordResetToken(validToken, futureDate);

      const resetPasswordDto: ResetPasswordDto = {
        userId: testUser.getId(),
        token: validToken,
        newPassword: 'ReusedSecret123!',
        confirmPassword: 'ReusedSecret123!',
      };

      // Mock password history with the same password
      const reusedPasswordHash = await Password.create('ReusedSecret123!');
      mockPasswordHistoryRepository.getPasswordHashesByUserId.mockResolvedValue(
        [reusedPasswordHash.getHashedValue()],
      );

      mockUserRepository.findById.mockResolvedValue(testUser);

      await expect(
        authController.resetPassword(resetPasswordDto),
      ).rejects.toThrow(
        'Password cannot be the same as any of your last 5 passwords',
      );
    });

    it('should handle non-existent user in forgot password gracefully', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'nonexistent@example.com',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Should not throw error (security: don't reveal if email exists)
      const result = await authController.forgotPassword(forgotPasswordDto);

      expect(result).toEqual({
        message:
          'If an account with that email exists, a password reset link has been sent.',
        sentAt: expect.any(Date),
      });

      // Email service should not be called
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should validate password complexity in reset', async () => {
      const validToken = 'valid-reset-token';
      const futureDate = new Date(Date.now() + 15 * 60 * 1000);
      testUser.setPasswordResetToken(validToken, futureDate);

      const resetPasswordDto: ResetPasswordDto = {
        userId: testUser.getId(),
        token: validToken,
        newPassword: 'weak', // Weak password
        confirmPassword: 'weak',
      };

      mockUserRepository.findById.mockResolvedValue(testUser);
      mockPasswordHistoryRepository.getPasswordHashesByUserId.mockResolvedValue(
        [],
      );

      await expect(
        authController.resetPassword(resetPasswordDto),
      ).rejects.toThrow('Password must be at least 8 characters long');
    });

    it('should validate password confirmation match', async () => {
      const validToken = 'valid-reset-token';
      const futureDate = new Date(Date.now() + 15 * 60 * 1000);
      testUser.setPasswordResetToken(validToken, futureDate);

      const resetPasswordDto: ResetPasswordDto = {
        userId: testUser.getId(),
        token: validToken,
        newPassword: 'NewSecureSecret123!',
        confirmPassword: 'DifferentSecret123!',
      };

      mockUserRepository.findById.mockResolvedValue(testUser);

      await expect(
        authController.resetPassword(resetPasswordDto),
      ).rejects.toThrow('New password and confirmation do not match');
    });
  });

  describe('Security Measures', () => {
    it('should log security events for password reset attempts', async () => {
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'test@example.com',
      };

      mockUserRepository.findByEmail.mockResolvedValue(testUser);
      mockUserRepository.save.mockResolvedValue(testUser);
      mockEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      await authController.forgotPassword(forgotPasswordDto);

      expect(mockAuditLogService.logSuccess).toHaveBeenCalledWith(
        AuditAction.UPDATE,
        AuditResourceType.USER,
        testUser.getId(),
        {},
        expect.any(Object),
      );
    });

    it('should clear reset token after successful password reset', async () => {
      const validToken = 'valid-reset-token';
      const futureDate = new Date(Date.now() + 15 * 60 * 1000);
      testUser.setPasswordResetToken(validToken, futureDate);

      const resetPasswordDto: ResetPasswordDto = {
        userId: testUser.getId(),
        token: validToken,
        newPassword: 'NewSecureSecret123!',
        confirmPassword: 'NewSecureSecret123!',
      };

      mockUserRepository.findById.mockResolvedValue(testUser);
      mockPasswordHistoryRepository.getPasswordHashesByUserId.mockResolvedValue(
        [],
      );
      mockPasswordHistoryRepository.save.mockResolvedValue(undefined);
      mockPasswordHistoryRepository.cleanup.mockResolvedValue(undefined);

      await authController.resetPassword(resetPasswordDto);

      // Verify token was cleared
      expect(testUser.getPasswordResetToken()).toBeUndefined();
      expect(testUser.getPasswordResetExpiresAt()).toBeUndefined();
    });
  });
});
