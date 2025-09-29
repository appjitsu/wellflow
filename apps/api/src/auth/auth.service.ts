import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '../domain/entities/user.entity';
import { AuthToken } from '../domain/value-objects/auth-token';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { TokenType } from '../domain/entities/token-blacklist.entity';

import { JwtPayload, AuthenticatedUser } from './strategies/jwt.strategy';
import { AuditLogService } from '../application/services/audit-log.service';
import {
  AuditAction,
  AuditResourceType,
} from '../domain/entities/audit-log.entity';
import { EmailService } from '../application/services/email.service';
import {
  SuspiciousActivityDetectorService,
  LoginAttemptContext,
} from '../application/services/suspicious-activity-detector.service';
import type { PasswordHistoryRepository } from '../domain/repositories/password-history.repository.interface';
import { PasswordHistory } from '../domain/entities/password-history.entity';
import {
  OrganizationsService,
  CreateOrganizationDto,
} from '../organizations/organizations.service';

// Constants
const USER_NOT_FOUND_MESSAGE = 'User not found';

/**
 * User Repository Interface
 * Defines the contract for user data access
 */
export interface AuthUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
  existsByEmail(email: string): Promise<boolean>;
}

/**
 * Registration Data Transfer Object
 */
export interface RegisterUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
  role: UserRole;
  phone?: string;
  // Organization creation fields
  createOrganization?: boolean;
  organizationName?: string;
  organizationContactEmail?: string;
  organizationContactPhone?: string;
}

/**
 * Login Response Interface
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: string;
    isEmailVerified: boolean;
    lastLoginAt?: Date;
  };
  expiresIn: number;
}

/**
 * Authentication Service
 * Handles user authentication, registration, and token management
 *
 * Follows SOLID principles and integrates with existing patterns:
 * - Uses Repository pattern for data access
 * - Uses Domain entities for business logic
 * - Uses AuditLogService for security logging
 * - Follows established DI patterns with string tokens
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject('UserRepository')
    private readonly userRepository: AuthUserRepository,
    @Inject('PasswordHistoryRepository')
    private readonly passwordHistoryRepository: PasswordHistoryRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLogService: AuditLogService,
    private readonly emailService: EmailService,
    private readonly organizationsService: OrganizationsService,
    private readonly suspiciousActivityDetector: SuspiciousActivityDetectorService,
    @Inject('TokenBlacklistService')
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  /**
   * Register a new user
   */
  async register(registerData: RegisterUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(
      registerData.email,
    );
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    let organizationId = registerData.organizationId;

    // Create organization if requested
    if (registerData.createOrganization) {
      if (!registerData.organizationName) {
        throw new ConflictException(
          'Organization name is required when creating a new organization',
        );
      }

      const organizationDto: CreateOrganizationDto = {
        name: registerData.organizationName,
        contactEmail: registerData.organizationContactEmail,
        contactPhone: registerData.organizationContactPhone,
      };

      const newOrganization =
        await this.organizationsService.createOrganization(organizationDto);
      organizationId = newOrganization.id;

      // Log organization creation
      await this.auditLogService.logSuccess(
        AuditAction.CREATE,
        AuditResourceType.ORGANIZATION,
        newOrganization.id,
        {
          newValues: {
            name: newOrganization.name,
            contactEmail: newOrganization.email,
            contactPhone: newOrganization.phone,
          },
        },
      );
    }

    if (!organizationId) {
      throw new ConflictException('Organization ID is required');
    }

    // Create new user using domain entity
    const user = await User.create(
      organizationId,
      registerData.email,
      registerData.firstName,
      registerData.lastName,
      registerData.role,
      registerData.password,
      registerData.phone,
    );

    // Save user
    const savedUser = await this.userRepository.save(user);

    // Send email verification
    await this.emailService.sendEmailVerification(
      savedUser.getId(),
      savedUser.getOrganizationId(),
      savedUser.getEmail().getValue(),
      savedUser.getFirstName(),
      savedUser.getLastName(),
      savedUser.getEmailVerificationToken() || '',
    );

    // Log registration event
    await this.auditLogService.logSuccess(
      AuditAction.CREATE,
      AuditResourceType.USER,
      savedUser.getId(),
      {
        newValues: {
          email: savedUser.getEmail().getValue(),
          role: savedUser.getRole(),
          organizationId: savedUser.getOrganizationId(),
        },
      },
    );

    return savedUser;
  }

  /**
   * Validate user credentials for login
   * Handles account lockout and failed attempt tracking
   */
  async validateUserCredentials(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);

    // Analyze for suspicious activity before proceeding
    const loginContext: LoginAttemptContext = {
      userId: user?.getId(),
      email,
      ipAddress,
      userAgent,
      timestamp: new Date(),
      success: false, // Will be updated later if successful
      failedAttempts: user?.getFailedLoginAttempts(),
      isAccountLocked: user?.isAccountLocked(),
    };

    const suspiciousActivity =
      await this.suspiciousActivityDetector.analyzeLoginAttempt(loginContext);

    if (
      suspiciousActivity.isSuspicious &&
      suspiciousActivity.riskLevel === 'CRITICAL'
    ) {
      // For critical risk, deny access immediately
      await this.auditLogService.logFailure(
        AuditAction.LOGIN,
        AuditResourceType.USER,
        user?.getId() || 'unknown',
        'Login blocked due to critical suspicious activity',
        {},
        {
          businessContext: {
            email,
            suspiciousActivity: true,
            riskLevel: suspiciousActivity.riskLevel,
            reasons: suspiciousActivity.reasons,
          },
          ipAddress,
          userAgent,
        },
      );
      throw new UnauthorizedException(
        'Access temporarily restricted due to suspicious activity',
      );
    }

    if (!user) {
      // Log failed login attempt (user not found)
      await this.auditLogService.logFailure(
        AuditAction.LOGIN,
        AuditResourceType.USER,
        'unknown',
        USER_NOT_FOUND_MESSAGE,
        {},
        {
          businessContext: { email },
          ipAddress,
          userAgent,
        },
      );
      return null;
    }

    // Check if account is locked (this will auto-unlock if expired)
    if (user.isAccountLocked()) {
      const lockoutDuration = user.getLockedUntil();
      const lockoutMessage = lockoutDuration
        ? `Account is temporarily locked until ${lockoutDuration.toISOString()}. This is lockout #${user.getLockoutCount()}.`
        : 'Account is temporarily locked due to multiple failed login attempts';

      await this.auditLogService.logFailure(
        AuditAction.LOGIN,
        AuditResourceType.USER,
        user.getId(),
        'Account locked',
        {},
        {
          businessContext: {
            email,
            failedAttempts: user.getFailedLoginAttempts(),
            lockoutCount: user.getLockoutCount(),
            lockedUntil: lockoutDuration,
          },
          ipAddress,
          userAgent,
        },
      );
      throw new UnauthorizedException(lockoutMessage);
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      // Record failed login attempt
      user.recordFailedLoginAttempt(ipAddress, userAgent);
      await this.userRepository.save(user);

      await this.auditLogService.logFailure(
        AuditAction.LOGIN,
        AuditResourceType.USER,
        user.getId(),
        'Invalid password',
        {},
        {
          businessContext: {
            email,
            failedAttempts: user.getFailedLoginAttempts(),
            isLocked: user.isAccountLocked(),
          },
          ipAddress,
          userAgent,
        },
      );

      return null;
    }

    // Record successful login
    user.recordSuccessfulLogin(ipAddress, userAgent);
    await this.userRepository.save(user);

    await this.auditLogService.logSuccess(
      AuditAction.LOGIN,
      AuditResourceType.USER,
      user.getId(),
      {},
      {
        businessContext: { email },
        ipAddress,
        userAgent,
      },
    );

    return user;
  }

  /**
   * Validate user by ID (for JWT strategy)
   */
  async validateUserById(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }

  /**
   * Generate JWT tokens for authenticated user
   */
  generateTokens(
    user: User,
    rememberMe: boolean = false,
  ): { accessToken: string; refreshToken: string } {
    const payload: JwtPayload = {
      sub: user.getId(),
      email: user.getEmail().getValue(),
      organizationId: user.getOrganizationId(),
      role: user.getRole(),
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });

    // Generate refresh token with extended expiry for remember me
    const refreshTokenExpiry = rememberMe
      ? this.configService.get<string>('JWT_REMEMBER_ME_EXPIRES_IN', '30d')
      : this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshTokenExpiry,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Login user and return tokens
   */
  async login(
    user: AuthenticatedUser,
    rememberMe: boolean = false,
  ): Promise<LoginResponse> {
    // Get full user entity for token generation
    const fullUser = await this.userRepository.findById(user.id);
    if (!fullUser) {
      throw new UnauthorizedException(USER_NOT_FOUND_MESSAGE);
    }

    const tokens = this.generateTokens(fullUser, rememberMe);
    const expiresIn = this.parseExpirationTime(
      this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role,
        organizationId: user.organizationId,
        isEmailVerified: user.isEmailVerified || false,
        lastLoginAt: user.lastLoginAt,
      },
      expiresIn,
    };
  }

  /**
   * Logout user and blacklist tokens
   */
  async logout(
    accessToken: string,
    refreshToken?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      // Blacklist the access token
      await this.tokenBlacklistService.blacklistToken(
        accessToken,
        TokenType.ACCESS,
        undefined, // Use default logout reason
        ipAddress,
        userAgent,
      );

      // Blacklist the refresh token if provided
      if (refreshToken) {
        await this.tokenBlacklistService.blacklistToken(
          refreshToken,
          TokenType.REFRESH,
          undefined, // Use default logout reason
          ipAddress,
          userAgent,
        );
      }

      this.logger.log('User logged out successfully with token blacklisting');
    } catch (error) {
      this.logger.error('Error during logout:', error);
      // Don't throw error for logout - it should always succeed from user perspective
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(userId: string, token: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException(USER_NOT_FOUND_MESSAGE);
    }

    user.verifyEmail(token);
    await this.userRepository.save(user);

    // Send welcome email after successful verification
    await this.emailService.sendWelcomeEmail(
      user.getId(),
      user.getOrganizationId(),
      user.getEmail().getValue(),
      user.getFirstName(),
      user.getLastName(),
    );

    await this.auditLogService.logSuccess(
      AuditAction.UPDATE,
      AuditResourceType.USER,
      user.getId(),
      {},
      {
        businessContext: {
          action: 'email_verified',
          email: user.getEmail().getValue(),
        },
      },
    );
  }

  /**
   * Resend email verification token
   */
  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException(USER_NOT_FOUND_MESSAGE);
    }

    if (user.isEmailVerified()) {
      throw new ConflictException('Email is already verified');
    }

    // Generate new verification token
    const verificationToken = AuthToken.createEmailVerificationToken();
    user.updateEmailVerificationToken(
      verificationToken.getValue(),
      verificationToken.getExpiresAt(),
    );

    await this.userRepository.save(user);

    // Send verification email
    await this.emailService.resendEmailVerification(
      user.getId(),
      user.getOrganizationId(),
      user.getEmail().getValue(),
      user.getFirstName(),
      user.getLastName(),
      user.getEmailVerificationToken() || '',
    );

    await this.auditLogService.logSuccess(
      AuditAction.UPDATE,
      AuditResourceType.USER,
      user.getId(),
      {},
      {
        businessContext: {
          action: 'email_verification_resent',
          email: user.getEmail().getValue(),
        },
      },
    );
  }

  /**
   * Parse JWT expiration time string to seconds
   */
  private parseExpirationTime(expiresIn: string): number {
    const regex = /^(\d+)([smhd])$/;
    const match = regex.exec(expiresIn);
    if (!match || match.length < 3 || !match[1] || !match[2]) {
      return 900; // Default 15 minutes
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        return 900;
    }
  }

  /**
   * Unlock user account (Admin only)
   * Manually unlock a locked user account
   */
  async unlockUserAccount(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException(USER_NOT_FOUND_MESSAGE);
    }

    if (!user.isAccountLocked()) {
      return; // Account is not locked, nothing to do
    }

    user.unlockAccount();
    await this.userRepository.save(user);

    await this.auditLogService.logSuccess(
      AuditAction.UPDATE,
      AuditResourceType.USER,
      user.getId(),
      {},
      {
        businessContext: {
          action: 'account_unlocked_manually',
          email: user.getEmail().getValue(),
          previousFailedAttempts: user.getFailedLoginAttempts(),
        },
      },
    );
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.validatePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      await this.auditLogService.logFailure(
        AuditAction.UPDATE,
        AuditResourceType.USER,
        userId,
        'Invalid current password provided for password change',
        {},
      );
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is different from current
    const isSamePassword = await user.validatePassword(newPassword);
    if (isSamePassword) {
      throw new ConflictException(
        'New password must be different from current password',
      );
    }

    // Update password
    await user.changePassword(newPassword);
    await this.userRepository.save(user);

    // Log successful password change
    await this.auditLogService.logSuccess(
      AuditAction.UPDATE,
      AuditResourceType.USER,
      userId,
      {},
      {
        businessContext: {
          action: 'password_changed',
          email: user.getEmail().getValue(),
        },
      },
    );
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify the refresh token with proper typing
      const payload: JwtPayload = this.jwtService.verify(refreshToken);

      // Validate payload structure
      if (!payload.sub || !payload.email || !payload.organizationId) {
        throw new UnauthorizedException('Invalid refresh token payload');
      }

      // Get user to ensure they still exist and are active
      const user = await this.userRepository.findById(payload.sub);
      if (!user || !user.isAccountActive()) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Generate new tokens (refresh token rotation for security)
      const tokens = this.generateTokens(user, true); // Assume remember me for refresh

      await this.auditLogService.logSuccess(
        AuditAction.LOGIN,
        AuditResourceType.USER,
        user.getId(),
        {},
        {
          businessContext: {
            action: 'token_refreshed',
            email: user.getEmail().getValue(),
          },
        },
      );

      return tokens;
    } catch {
      await this.auditLogService.logFailure(
        AuditAction.LOGIN,
        AuditResourceType.USER,
        'unknown',
        'Invalid refresh token',
        {},
        {
          businessContext: { action: 'token_refresh_failed' },
        },
      );
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Initiate password reset process
   * Sends password reset email if user exists
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      // Don't reveal if user exists or not for security
      await this.auditLogService.logFailure(
        AuditAction.UPDATE,
        AuditResourceType.USER,
        'unknown',
        'Password reset requested for non-existent user',
        {},
        {
          businessContext: { email, action: 'forgot_password' },
        },
      );
      return; // Return success even if user doesn't exist
    }

    // Generate password reset token
    const resetToken = AuthToken.createPasswordResetToken();
    user.setPasswordResetToken(
      resetToken.getValue(),
      resetToken.getExpiresAt(),
    );

    await this.userRepository.save(user);

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(
      user.getId(),
      user.getOrganizationId(),
      user.getEmail().getValue(),
      user.getFirstName(),
      user.getLastName(),
      resetToken.getValue(),
    );

    // Log successful password reset request
    await this.auditLogService.logSuccess(
      AuditAction.UPDATE,
      AuditResourceType.USER,
      user.getId(),
      {},
      {
        businessContext: {
          action: 'password_reset_requested',
          email: user.getEmail().getValue(),
        },
      },
    );
  }

  /**
   * Reset password using token
   * Validates token and updates password with history check
   */
  async resetPassword(
    userId: string,
    token: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND_MESSAGE);
    }

    // Validate reset token
    if (!user.validatePasswordResetToken(token)) {
      await this.auditLogService.logFailure(
        AuditAction.UPDATE,
        AuditResourceType.USER,
        userId,
        'Invalid or expired password reset token',
        {},
        {
          businessContext: {
            action: 'password_reset_failed',
            email: user.getEmail().getValue(),
            reason: 'invalid_token',
          },
        },
      );
      throw new BadRequestException('Invalid or expired password reset token');
    }

    // Get password history for validation
    const passwordHistory = await this.getPasswordHistoryHashes(userId);

    // Update password with history validation
    await user.changePasswordWithHistory(newPassword, passwordHistory);

    // Clear password reset token
    user.clearPasswordResetToken();

    await this.userRepository.save(user);

    // Add new password to history
    const passwordHash = user.getPasswordHash();
    if (passwordHash) {
      await this.addPasswordToHistory(userId, passwordHash);
    }

    // Log successful password reset
    await this.auditLogService.logSuccess(
      AuditAction.UPDATE,
      AuditResourceType.USER,
      userId,
      {},
      {
        businessContext: {
          action: 'password_reset_completed',
          email: user.getEmail().getValue(),
        },
      },
    );
  }

  /**
   * Get password history hashes for a user
   */
  private async getPasswordHistoryHashes(userId: string): Promise<string[]> {
    try {
      return await this.passwordHistoryRepository.getPasswordHashesByUserId(
        userId,
        5,
      );
    } catch (error) {
      this.logger.error('Error getting password history hashes:', error);
      return []; // Return empty array on error to allow password change
    }
  }

  /**
   * Add password to history
   */
  private async addPasswordToHistory(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    try {
      const passwordHistoryEntry = PasswordHistory.create(userId, passwordHash);
      await this.passwordHistoryRepository.save(passwordHistoryEntry);
    } catch (error) {
      this.logger.error('Error adding password to history:', error);
      // Don't throw error here as it's not critical for the password change operation
    }
  }
}
