import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PoolConfig } from 'pg';

/**
 * Connection Pool Configuration Strategy Interface
 * Follows Strategy Pattern for different pool configurations
 */
export interface IConnectionPoolStrategy {
  getPoolConfig(): PoolConfig;
  getStrategyName(): string;
}

/**
 * Development Connection Pool Strategy
 * Optimized for development with lower resource usage
 */
@Injectable()
export class DevelopmentPoolStrategy implements IConnectionPoolStrategy {
  constructor(private readonly configService: ConfigService) {}

  getPoolConfig(): PoolConfig {
    return {
      // Connection limits - conservative for development
      min: 2, // Minimum connections to maintain
      max: 10, // Maximum connections in pool

      // Timeout configurations
      idleTimeoutMillis: 30000, // 30 seconds - close idle connections
      connectionTimeoutMillis: 5000, // 5 seconds - wait for connection

      // Connection lifecycle
      maxUses: 5000, // Rotate connections after 5000 uses

      // Keep-alive settings
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000, // 10 seconds

      // Statement timeout for development debugging
      statement_timeout: 30000, // 30 seconds
      query_timeout: 15000, // 15 seconds

      // Application name for monitoring
      application_name: 'wellflow-api-dev',
    };
  }

  getStrategyName(): string {
    return 'development';
  }
}

/**
 * Production Connection Pool Strategy
 * Optimized for high performance and concurrent requests
 * Meets KAN-33 requirements: <200ms API response, <50ms DB query
 */
@Injectable()
export class ProductionPoolStrategy implements IConnectionPoolStrategy {
  constructor(private readonly configService: ConfigService) {}

  getPoolConfig(): PoolConfig {
    return {
      // Connection limits - optimized for production load
      min: 5, // Maintain minimum connections for immediate availability
      max: 25, // Higher max for concurrent requests (increased from 20)

      // Aggressive timeout configurations for performance
      idleTimeoutMillis: 60000, // 60 seconds - keep connections longer
      connectionTimeoutMillis: 2000, // 2 seconds - fail fast for performance

      // Connection lifecycle optimization
      maxUses: 10000, // Higher reuse before rotation

      // Keep-alive for connection health
      keepAlive: true,
      keepAliveInitialDelayMillis: 5000, // 5 seconds

      // Aggressive timeouts for KAN-33 performance requirements
      statement_timeout: 10000, // 10 seconds max statement time
      query_timeout: 5000, // 5 seconds max query time (target <50ms)

      // Connection optimization
      application_name: 'wellflow-api-prod',

      // SSL configuration for production
      ssl: this.getSSLConfig(),
    };
  }

  private getSSLConfig(): {
    rejectUnauthorized: boolean;
    ca?: string;
    cert?: string;
    key?: string;
  } {
    const sslMode = this.configService.get<string>('DB_SSL_MODE', 'prefer');

    if (sslMode === 'disable') {
      return {
        rejectUnauthorized: false,
      };
    }

    return {
      rejectUnauthorized: this.configService.get<boolean>(
        'DB_SSL_REJECT_UNAUTHORIZED',
        true,
      ),
      ca: this.configService.get<string>('DB_SSL_CA'),
      cert: this.configService.get<string>('DB_SSL_CERT'),
      key: this.configService.get<string>('DB_SSL_KEY'),
    };
  }

  getStrategyName(): string {
    return 'production';
  }
}

/**
 * Test Connection Pool Strategy
 * Optimized for testing with minimal resource usage
 */
@Injectable()
export class TestPoolStrategy implements IConnectionPoolStrategy {
  getPoolConfig(): PoolConfig {
    return {
      // Minimal connections for testing
      min: 1,
      max: 5,

      // Fast timeouts for test speed
      idleTimeoutMillis: 5000, // 5 seconds
      connectionTimeoutMillis: 1000, // 1 second

      // Quick rotation for test isolation
      maxUses: 100,

      // Minimal keep-alive
      keepAlive: false,

      // Fast timeouts for tests
      statement_timeout: 5000, // 5 seconds
      query_timeout: 2000, // 2 seconds

      application_name: 'wellflow-api-test',
    };
  }

  getStrategyName(): string {
    return 'test';
  }
}

/**
 * Connection Pool Configuration Service
 * Follows Single Responsibility Principle - only handles pool configuration
 * Implements Strategy Pattern for different environments
 */
@Injectable()
export class ConnectionPoolConfigService {
  private readonly strategies: Map<string, IConnectionPoolStrategy>;

  constructor(
    private readonly configService: ConfigService,
    private readonly developmentStrategy: DevelopmentPoolStrategy,
    private readonly productionStrategy: ProductionPoolStrategy,
    private readonly testStrategy: TestPoolStrategy,
  ) {
    this.strategies = new Map([
      ['development', this.developmentStrategy],
      ['production', this.productionStrategy],
      ['test', this.testStrategy],
    ]);
  }

  /**
   * Get optimized pool configuration based on environment
   * Follows Open/Closed Principle - extensible for new strategies
   */
  getOptimizedPoolConfig(): PoolConfig {
    const environment = this.configService.get<string>(
      'NODE_ENV',
      'development',
    );
    const strategy =
      this.strategies.get(environment) || this.developmentStrategy;

    const baseConfig = strategy.getPoolConfig();

    // Add common configuration that applies to all environments
    const commonConfig: Partial<PoolConfig> = {
      // Database connection details
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5433),
      user: this.configService.get<string>('DB_USER', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_NAME', 'wellflow'),

      // Use DATABASE_URL if provided (Railway, Heroku, etc.)
      connectionString: this.configService.get<string>('DATABASE_URL'),
    };

    // Merge strategy config with common config
    return {
      ...baseConfig,
      ...commonConfig,
    };
  }

  /**
   * Get current strategy name for monitoring/logging
   */
  getCurrentStrategyName(): string {
    const environment = this.configService.get<string>(
      'NODE_ENV',
      'development',
    );
    const strategy =
      this.strategies.get(environment) || this.developmentStrategy;
    return strategy.getStrategyName();
  }

  /**
   * Validate pool configuration
   * Ensures configuration meets performance requirements
   */
  validatePoolConfig(config: PoolConfig): boolean {
    // Validate required fields
    if (!config.max || config.max < 1) {
      throw new Error('Pool max connections must be at least 1');
    }

    if (config.min && config.min > config.max) {
      throw new Error('Pool min connections cannot exceed max connections');
    }

    // Validate performance requirements for production
    const environment = this.configService.get<string>(
      'NODE_ENV',
      'development',
    );
    if (environment === 'production') {
      if (config.query_timeout && config.query_timeout > 10000) {
        console.warn(
          'Query timeout > 10s may not meet KAN-33 performance requirements',
        );
      }

      if (
        config.connectionTimeoutMillis &&
        config.connectionTimeoutMillis > 5000
      ) {
        console.warn(
          'Connection timeout > 5s may impact API response time requirements',
        );
      }
    }

    return true;
  }

  /**
   * Get pool health check configuration
   */
  getHealthCheckConfig() {
    return {
      testQuery: 'SELECT 1',
      testInterval: 30000, // 30 seconds
      maxRetries: 3,
      retryDelay: 1000, // 1 second
    };
  }
}
