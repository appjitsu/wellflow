import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Application Configuration Service
 *
 * Centralized configuration management for WellFlow API
 * Provides type-safe access to environment variables with defaults
 *
 * Security: Eliminates direct process.env access throughout the application
 * Compliance: Supports oil & gas industry configuration requirements
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Application Configuration
   */
  get port(): number {
    return this.configService.get<number>('PORT', 3001);
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get apiUrl(): string {
    return this.configService.get<string>('API_URL', '');
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  /**
   * Database Configuration
   */
  get dbHost(): string {
    return this.configService.get<string>('DB_HOST', 'localhost');
  }

  get dbPort(): number {
    return this.configService.get<number>('DB_PORT', 5433);
  }

  get dbUser(): string {
    return this.configService.get<string>('DB_USER', 'postgres');
  }

  get dbPassword(): string {
    return this.configService.get<string>('DB_PASSWORD', 'password');
  }

  get dbName(): string {
    return this.configService.get<string>('DB_NAME', 'wellflow');
  }

  /**
   * Redis Configuration
   */
  get redisUrl(): string {
    return this.configService.get<string>(
      'REDIS_URL',
      'redis://localhost:6379',
    );
  }

  /**
   * LogRocket Configuration
   */
  get logRocketAppId(): string | undefined {
    return this.configService.get<string>('LOGROCKET_APP_ID');
  }

  get logRocketApiKey(): string | undefined {
    return this.configService.get<string>('LOGROCKET_API_KEY');
  }

  get logRocketEnabled(): boolean {
    return !!this.logRocketAppId && (this.isProduction || this.isDevelopment);
  }

  /**
   * Sentry Configuration
   */
  get sentryDsn(): string | undefined {
    return this.configService.get<string>('SENTRY_DSN');
  }

  get sentryEnvironment(): string {
    return this.configService.get<string>('SENTRY_ENVIRONMENT', this.nodeEnv);
  }

  get sentryEnabled(): boolean {
    return !!this.sentryDsn;
  }

  /**
   * Security Configuration
   */
  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET', 'wellflow-dev-secret');
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN', '24h');
  }

  /**
   * Rate Limiting Configuration
   */
  get rateLimitTtl(): number {
    return this.configService.get<number>('RATE_LIMIT_TTL', 60000); // 1 minute
  }

  get rateLimitMax(): number {
    return this.configService.get<number>('RATE_LIMIT_MAX', 60);
  }

  /**
   * CORS Configuration
   */
  get corsOrigins(): string[] {
    const origins = this.configService.get<string>('CORS_ORIGINS', '');
    return origins
      ? origins
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean)
      : [
          'http://localhost:3000',
          'https://localhost:3000',
          'http://localhost:3001',
          'https://localhost:3001',
        ];
  }

  /**
   * HTTPS Configuration
   */
  get httpsEnabled(): boolean {
    return this.configService.get<boolean>('HTTPS_ENABLED', false);
  }

  get sslKeyPath(): string | undefined {
    return this.configService.get<string>('SSL_KEY_PATH');
  }

  get sslCertPath(): string | undefined {
    return this.configService.get<string>('SSL_CERT_PATH');
  }

  /**
   * Host Configuration
   */
  get host(): string {
    return this.configService.get<string>('HOST', 'localhost');
  }

  /**
   * Get a raw configuration value with optional default
   * Use this for dynamic or less common configuration values
   */
  get<T = string>(key: string, defaultValue?: T): T | undefined {
    return defaultValue !== undefined
      ? this.configService.get<T>(key, defaultValue)
      : this.configService.get<T>(key);
  }

  /**
   * Get a required configuration value (throws if not found)
   */
  getOrThrow<T = string>(key: string): T {
    return this.configService.getOrThrow<T>(key);
  }
}
