import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PoolClient } from 'pg';
import * as schema from '../../database/schema';
import { DatabaseConnectionService } from '../tenant/database-connection.service';
import {
  ITenantAwareDatabase,
  ITenantAwareTransaction,
} from '../../application/interfaces/tenant-isolation-strategy.interface';
import { TenantContext } from '../../domain/value-objects/tenant-context.vo';

const RESET_ROLE_SQL = 'RESET ROLE';

/**
 * Drizzle ORM service following Single Responsibility Principle
 * Only handles ORM operations, delegates connection management
 */
@Injectable()
export class DrizzleDatabaseService
  implements ITenantAwareDatabase, OnModuleInit, OnModuleDestroy
{
  private db!: NodePgDatabase<typeof schema>;

  constructor(
    private readonly databaseConnectionService: DatabaseConnectionService,
  ) {}

  onModuleInit(): void {
    // Initialize Drizzle with the connection pool
    const pool = this.databaseConnectionService.getConnectionPool();
    this.db = drizzle(pool, { schema });

    console.log('✅ Drizzle ORM initialized successfully');
  }

  onModuleDestroy(): void {
    // Connection cleanup is handled by DatabaseConnectionService
    console.log('🔌 Drizzle ORM service destroyed');
  }

  /**
   * Get the Drizzle database instance
   */
  getDb(): NodePgDatabase<typeof schema> {
    if (!this.db) {
      throw new Error('Drizzle database not initialized');
    }
    return this.db;
  }

  /**
   * Get the underlying database connection
   */
  getConnection(): NodePgDatabase<typeof schema> {
    return this.getDb();
  }

  /**
   * Execute a raw query with automatic tenant filtering
   * Note: This bypasses Drizzle's type safety - use with caution
   */
  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const pool = this.databaseConnectionService.getConnectionPool();
    const result = await pool.query(sql, params);
    return result.rows as T[];
  }

  /**
   * Execute a query within a specific tenant context
   */
  async queryInTenantContext<T>(
    context: TenantContext,
    sql: string,
    params?: unknown[],
  ): Promise<T[]> {
    const pool = this.databaseConnectionService.getConnectionPool();

    // Use a transaction to ensure context isolation
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Set tenant context
      await client.query('SET ROLE application_role');
      await client.query('SELECT set_config($1, $2, true)', [
        'app.current_organization_id',
        context.organizationId,
      ]);

      // Execute query
      const result = await client.query(sql, params);

      await client.query('COMMIT');
      return result.rows as T[];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Reset context
      await client.query(RESET_ROLE_SQL);
      client.release();
    }
  }

  /**
   * Begin a transaction with tenant context
   */
  async beginTransaction(): Promise<ITenantAwareTransaction> {
    const pool = this.databaseConnectionService.getConnectionPool();
    const client = await pool.connect();

    await client.query('BEGIN');

    return new TenantAwareTransaction(client);
  }

  /**
   * Execute multiple operations in a transaction
   */
  async executeTransaction<T>(
    operation: (db: NodePgDatabase<typeof schema>) => Promise<T>,
  ): Promise<T> {
    return this.databaseConnectionService.executeTransaction(async (client) => {
      const transactionDb = drizzle(client, { schema });
      return operation(transactionDb);
    });
  }

  /**
   * Execute operation with tenant context in transaction
   */
  async executeInTenantTransaction<T>(
    context: TenantContext,
    operation: (db: NodePgDatabase<typeof schema>) => Promise<T>,
  ): Promise<T> {
    return this.databaseConnectionService.executeTransaction(async (client) => {
      // Set tenant context
      await client.query('SET ROLE application_role');
      await client.query('SELECT set_config($1, $2, true)', [
        'app.current_organization_id',
        context.organizationId,
      ]);

      try {
        const transactionDb = drizzle(client, { schema });
        return await operation(transactionDb);
      } finally {
        // Reset context
        await client.query(RESET_ROLE_SQL);
      }
    });
  }

  /**
   * Health check for the database service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    drizzleInitialized: boolean;
    connectionHealth: Awaited<
      ReturnType<DatabaseConnectionService['healthCheck']>
    >;
  }> {
    const connectionHealth = await this.databaseConnectionService.healthCheck();

    return {
      status:
        this.db && connectionHealth.status === 'healthy'
          ? 'healthy'
          : 'unhealthy',
      drizzleInitialized: !!this.db,
      connectionHealth,
    };
  }
}

/**
 * Implementation of tenant-aware transaction
 */
class TenantAwareTransaction implements ITenantAwareTransaction {
  private tenantContext: TenantContext | null = null;

  constructor(private readonly client: PoolClient) {}

  /**
   * Set tenant context for this transaction
   */
  async setTenantContext(context: TenantContext): Promise<void> {
    await this.client.query('SET ROLE application_role');
    await this.client.query('SELECT set_config($1, $2, true)', [
      'app.current_organization_id',
      context.organizationId,
    ]);
    this.tenantContext = context;
  }

  /**
   * Execute a query within the transaction and tenant context
   */
  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const result = await this.client.query(sql, params);
    return result.rows as T[];
  }

  /**
   * Commit the transaction
   */
  async commit(): Promise<void> {
    try {
      await this.client.query('COMMIT');
    } finally {
      await this.client.query(RESET_ROLE_SQL);
      this.client.release();
    }
  }

  /**
   * Rollback the transaction
   */
  async rollback(): Promise<void> {
    try {
      await this.client.query('ROLLBACK');
    } finally {
      await this.client.query(RESET_ROLE_SQL);
      this.client.release();
    }
  }

  /**
   * Get the tenant context for this transaction
   */
  getTenantContext(): TenantContext | null {
    return this.tenantContext;
  }
}
