import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { AuthUserRepositoryImpl } from './infrastructure/auth-user.repository';
import { PasswordHistoryRepositoryImpl } from './infrastructure/password-history.repository';
import { TokenBlacklistRepositoryImpl } from './infrastructure/token-blacklist.repository';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { AuditLogService } from '../application/services/audit-log.service';
import { EmailService } from '../application/services/email.service';
import { SuspiciousActivityDetectorService } from '../application/services/suspicious-activity-detector.service';
import { JobsModule } from '../jobs/jobs.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { RepositoryModule } from '../infrastructure/repositories/repository.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { RateLimitingModule } from '../common/rate-limiting/rate-limiting.module';
import { MonitoringModule } from '../monitoring/monitoring.module';

/**
 * Authentication Module
 *
 * Provides comprehensive authentication services following established patterns:
 * - Strategy pattern integration (JwtStrategy, LocalStrategy)
 * - Repository pattern for data access
 * - Dependency injection with string tokens
 * - Integration with existing audit logging
 *
 * This module integrates seamlessly with:
 * - Existing JwtAuthGuard (apps/api/src/presentation/guards/jwt-auth.guard.ts)
 * - CASL authorization system
 * - Multi-tenant architecture
 * - Audit logging system
 */
@Module({
  imports: [
    // Passport configuration
    PassportModule.register({
      defaultStrategy: 'jwt',
      session: false, // Stateless JWT authentication
    }),

    // JWT configuration
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
          algorithm: 'HS256', // Explicit algorithm for security
          issuer: configService.get<string>('JWT_ISSUER', 'wellflow-api'),
          audience: configService.get<string>(
            'JWT_AUDIENCE',
            'wellflow-client',
          ),
        },
      }),
      inject: [ConfigService],
    }),

    // Required modules
    ConfigModule,
    DatabaseModule, // For database access
    RepositoryModule, // For AuditLogRepository
    AuthorizationModule, // For AbilitiesFactory
    JobsModule, // For email notifications
    OrganizationsModule, // For organization creation
    RateLimitingModule, // For enhanced rate limiting
    MonitoringModule, // For metrics service
  ],

  providers: [
    // Core authentication service
    AuthService,

    // Passport strategies (following Strategy pattern)
    JwtStrategy,
    LocalStrategy,

    // Repository implementation (following Repository pattern)
    {
      provide: 'UserRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new AuthUserRepositoryImpl(databaseService);
      },
      inject: [DatabaseService],
    },

    // Password history repository
    {
      provide: 'PasswordHistoryRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new PasswordHistoryRepositoryImpl(databaseService);
      },
      inject: [DatabaseService],
    },

    // Token blacklist repository
    {
      provide: 'TokenBlacklistRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new TokenBlacklistRepositoryImpl(databaseService);
      },
      inject: [DatabaseService],
    },

    // Token blacklist service
    {
      provide: 'TokenBlacklistService',
      useFactory: (
        tokenBlacklistRepository: TokenBlacklistRepositoryImpl,
        jwtService: JwtService,
        auditLogService: AuditLogService,
      ) => {
        return new TokenBlacklistService(
          tokenBlacklistRepository,
          jwtService,
          auditLogService,
        );
      },
      inject: ['TokenBlacklistRepository', JwtService, AuditLogService],
    },

    // Audit logging service (existing service)
    AuditLogService,

    // Email service for authentication workflows
    EmailService,

    // Suspicious activity detection service
    SuspiciousActivityDetectorService,
  ],

  controllers: [AuthController],

  exports: [
    // Export services for use in other modules
    AuthService,
    JwtStrategy,
    LocalStrategy,
    'TokenBlacklistService',

    // Export for testing and integration
    'UserRepository',
    'TokenBlacklistRepository',
  ],
})
export class AuthModule {
  /**
   * Module configuration validation
   * Ensures required environment variables are set
   */
  constructor(private readonly configService: ConfigService) {
    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    const requiredEnvVars = [
      'JWT_SECRET',
      'JWT_EXPIRES_IN',
      'JWT_REFRESH_EXPIRES_IN',
    ];

    // Note: JWT_REMEMBER_ME_EXPIRES_IN is optional and defaults to 30d if not set

    const missingVars = requiredEnvVars.filter(
      (varName) => !this.configService.get<string>(varName),
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables for AuthModule: ${missingVars.join(', ')}`,
      );
    }

    // Validate JWT secret strength
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (jwtSecret && jwtSecret.length < 32) {
      console.warn(
        'JWT_SECRET should be at least 32 characters long for security',
      );
    }
  }
}
