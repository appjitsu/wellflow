import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '../domain/entities/user.entity';

import { JwtPayload, AuthenticatedUser } from './strategies/jwt.strategy';
import { AuditLogService } from '../application/services/audit-log.service';
import {
  AuditAction,
  AuditResourceType,
} from '../domain/entities/audit-log.entity';

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
  organizationId: string;
  role: UserRole;
  phone?: string;
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
  constructor(
    @Inject('AuthUserRepository')
    private readonly userRepository: AuthUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLogService: AuditLogService,
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

    // Create new user using domain entity
    const user = await User.create(
      registerData.organizationId,
      registerData.email,
      registerData.firstName,
      registerData.lastName,
      registerData.role,
      registerData.password,
      registerData.phone,
    );

    // Save user
    const savedUser = await this.userRepository.save(user);

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

    if (!user) {
      // Log failed login attempt (user not found)
      await this.auditLogService.logFailure(
        AuditAction.LOGIN,
        AuditResourceType.USER,
        'unknown',
        'User not found',
        {},
        {
          businessContext: { email },
          ipAddress,
          userAgent,
        },
      );
      return null;
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
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
          },
          ipAddress,
          userAgent,
        },
      );
      throw new UnauthorizedException(
        'Account is temporarily locked due to multiple failed login attempts',
      );
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
  generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const payload: JwtPayload = {
      sub: user.getId(),
      email: user.getEmail().getValue(),
      organizationId: user.getOrganizationId(),
      role: user.getRole(),
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });

    // Generate refresh token (longer expiry)
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return { accessToken, refreshToken };
  }

  /**
   * Login user and return tokens
   */
  async login(user: AuthenticatedUser): Promise<LoginResponse> {
    // Get full user entity for token generation
    const fullUser = await this.userRepository.findById(user.id);
    if (!fullUser) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = this.generateTokens(fullUser);
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
   * Verify email with token
   */
  async verifyEmail(userId: string, token: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    user.verifyEmail(token);
    await this.userRepository.save(user);

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
}
