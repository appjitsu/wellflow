import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient } from 'pg';
import { IDatabaseConnectionManager } from '../../application/interfaces/tenant-isolation-strategy.interface';
import { ConnectionPoolConfigService } from '../database/connection-pool-config.service';

/**
 * Database connection service following Single Responsibility Principle
 * Only handles database connection management, not tenant context
 * Enhanced with optimized connection pooling for KAN-33 performance requirements
 */
@Injectable()
export class DatabaseConnectionService
  implements IDatabaseConnectionManager, OnModuleInit, OnModuleDestroy
{
  private pool!: Pool;
  private isConnected = false;
  private poolMetrics = {
    totalConnections: 0,
    idleConnections: 0,
    waitingClients: 0,
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly poolConfigService: ConnectionPoolConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.initializeConnection();
  }

  async onModuleDestroy(): Promise<void> {
    await this.closeConnection();
  }

  /**
   * Initialize database connection pool with optimized configuration
   * Uses Strategy pattern for environment-specific optimization
   */
  private async initializeConnection(): Promise<void> {
    try {
      // Get optimized pool configuration based on environment
      const poolConfig = this.poolConfigService.getOptimizedPoolConfig();

      // Validate configuration meets performance requirements
      this.poolConfigService.validatePoolConfig(poolConfig);

      // Create pool with optimized configuration
      this.pool = new Pool(poolConfig);

      // Set up pool event listeners for monitoring
      this.setupPoolEventListeners();

      // Test the connection
      await this.testConnection();
      this.isConnected = true;

      const strategyName = this.poolConfigService.getCurrentStrategyName();
      console.log(
        `✅ Database connection pool initialized successfully with ${strategyName} strategy`,
      );
      console.log(
        `📊 Pool config: min=${poolConfig.min}, max=${poolConfig.max}, timeout=${poolConfig.connectionTimeoutMillis}ms`,
      );
    } catch (error) {
      console.error('❌ Failed to initialize database connection:', error);
      throw error;
    }
  }

  /**
   * Get the database connection pool
   */
  getConnection(): Pool {
    if (!this.pool) {
      throw new Error('Database connection not initialized');
    }
    return this.pool;
  }

  /**
   * Get the connection pool (alias for getConnection for clarity)
   */
  getConnectionPool(): Pool {
    return this.getConnection();
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.pool) {
        return false;
      }

      const client = await this.pool.connect();
      try {
        await client.query('SELECT 1');
        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Set up pool event listeners for performance monitoring
   * Implements Observer pattern for pool health monitoring
   */
  private setupPoolEventListeners(): void {
    if (!this.pool) return;

    // Monitor connection events
    this.pool.on('connect', (_client) => {
      this.poolMetrics.totalConnections++;
      console.log(
        `🔗 New database connection established (total: ${this.poolMetrics.totalConnections})`,
      );
    });

    this.pool.on('acquire', (_client) => {
      this.poolMetrics.idleConnections--;
      console.log(
        `📤 Connection acquired from pool (idle: ${this.poolMetrics.idleConnections})`,
      );
    });

    this.pool.on('release', (_client) => {
      this.poolMetrics.idleConnections++;
      console.log(
        `📥 Connection released to pool (idle: ${this.poolMetrics.idleConnections})`,
      );
    });

    this.pool.on('remove', (_client) => {
      this.poolMetrics.totalConnections--;
      console.log(
        `🗑️ Connection removed from pool (total: ${this.poolMetrics.totalConnections})`,
      );
    });

    this.pool.on('error', (err, _client) => {
      console.error('❌ Database pool error:', err);
    });
  }

  /**
   * Get current pool metrics for monitoring
   * Supports performance monitoring requirements
   */
  getPoolMetrics() {
    if (!this.pool) {
      return { error: 'Pool not initialized' };
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      maxConnections: this.pool.options.max,
      minConnections: this.pool.options.min,
      ...this.poolMetrics,
    };
  }

  /**
   * Close database connection
   */
  async closeConnection(): Promise<void> {
    if (this.pool && !this.pool.ended) {
      try {
        await this.pool.end();
        this.isConnected = false;
        console.log('🔌 Database connection pool closed');
      } catch (error) {
        console.error('Error closing database connection:', error);
        throw error;
      }
    }
  }

  /**
   * Get connection status
   */
  isConnectionActive(): boolean {
    return this.isConnected && this.pool && !this.pool.ended;
  }

  /**
   * Get connection pool statistics
   */
  getConnectionStats(): {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  } {
    if (!this.pool) {
      return { totalCount: 0, idleCount: 0, waitingCount: 0 };
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  /**
   * Execute a raw query (use with caution)
   * This method should only be used by infrastructure layer components
   */
  async executeRawQuery<T = unknown>(
    sql: string,
    params?: unknown[],
  ): Promise<T[]> {
    if (!this.pool) {
      throw new Error('Database connection not initialized');
    }

    try {
      const result = await this.pool.query(sql, params);
      return result.rows as T[];
    } catch (error) {
      console.error('Raw query execution failed:', error);
      throw error;
    }
  }

  /**
   * Execute query with a specific client (for transactions)
   */
  async executeWithClient<T>(
    operation: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    if (!this.pool) {
      throw new Error('Database connection not initialized');
    }

    const client = await this.pool.connect();
    try {
      return await operation(client);
    } finally {
      client.release();
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async executeTransaction<T>(
    operations: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    return this.executeWithClient(async (client) => {
      try {
        await client.query('BEGIN');
        const result = await operations(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });
  }

  /**
   * Health check for monitoring
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    connectionStats: {
      totalCount: number;
      idleCount: number;
      waitingCount: number;
    };
    lastChecked: Date;
  }> {
    const isHealthy = await this.testConnection();

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      connectionStats: this.getConnectionStats(),
      lastChecked: new Date(),
    };
  }
}
