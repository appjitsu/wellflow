import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient } from 'pg';
import { IDatabaseConnectionManager } from '../../application/interfaces/tenant-isolation-strategy.interface';

/**
 * Database connection service following Single Responsibility Principle
 * Only handles database connection management, not tenant context
 */
@Injectable()
export class DatabaseConnectionService
  implements IDatabaseConnectionManager, OnModuleInit, OnModuleDestroy
{
  private pool!: Pool;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.initializeConnection();
  }

  async onModuleDestroy(): Promise<void> {
    await this.closeConnection();
  }

  /**
   * Initialize database connection pool
   */
  private async initializeConnection(): Promise<void> {
    try {
      const connectionString = this.configService.get<string>('DATABASE_URL');

      if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is required');
      }

      this.pool = new Pool({
        connectionString,
        max: 20, // Maximum number of connections in the pool
        idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
        connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
        maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
      });

      // Test the connection
      await this.testConnection();
      this.isConnected = true;

      console.log('✅ Database connection pool initialized successfully');
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
