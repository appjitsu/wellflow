import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import {
  QueryBuilderFactory,
  QueryUtils,
} from '../infrastructure/database/query-builder';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool!: Pool;
  public db!: NodePgDatabase<typeof schema>;
  public queryBuilder!: QueryBuilderFactory;
  public queryUtils!: QueryUtils;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.pool = new Pool({
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      user: this.configService.get<string>('DB_USER', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_NAME', 'wellflow'),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.db = drizzle(this.pool, { schema });

    // Initialize query builders and utilities
    this.queryBuilder = new QueryBuilderFactory(this.db);
    this.queryUtils = new QueryUtils(this.db);

    // Test the connection
    try {
      await this.pool.query('SELECT 1');
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }

    // Note: Database tables will be created via Drizzle migrations
    // Run: pnpm drizzle-kit generate && pnpm drizzle-kit migrate
    console.log(
      '✅ Database service initialized - use migrations to create tables',
    );
  }

  async onModuleDestroy() {
    if (this.pool && !this.pool.ended) {
      await this.pool.end();
      console.log('🔌 Database connection closed');
    }
  }

  getDb() {
    return this.db;
  }

  getQueryBuilder() {
    return this.queryBuilder;
  }

  getQueryUtils() {
    return this.queryUtils;
  }

  /**
   * Set the current organization context for Row Level Security
   * This sets the PostgreSQL session variable that RLS policies use
   * and switches to the application_role to enable RLS
   */
  async setOrganizationContext(organizationId: string): Promise<void> {
    try {
      // Switch to application_role to enable RLS policies
      await this.pool.query('SET ROLE application_role');

      // Set the organization context
      await this.pool.query('SELECT set_config($1, $2, false)', [
        'app.current_organization_id',
        organizationId,
      ]);
    } catch (error) {
      console.error('Failed to set organization context:', error);
      throw new Error('Failed to set organization context for RLS');
    }
  }

  /**
   * Clear the current organization context and reset to default role
   */
  async clearOrganizationContext(): Promise<void> {
    try {
      // Clear the organization context
      await this.pool.query('SELECT set_config($1, $2, false)', [
        'app.current_organization_id',
        '',
      ]);

      // Reset to default role (postgres)
      await this.pool.query('RESET ROLE');
    } catch (error) {
      console.error('Failed to clear organization context:', error);
      throw new Error('Failed to clear organization context');
    }
  }

  /**
   * Get the current organization context from session
   */
  async getCurrentOrganizationId(): Promise<string | null> {
    try {
      const result = await this.pool.query(
        'SELECT current_setting($1, true) as org_id',
        ['app.current_organization_id'],
      );
      const row = result.rows[0] as { org_id?: string } | undefined;
      return row?.org_id || null;
    } catch (error) {
      console.error('Failed to get current organization context:', error);
      return null;
    }
  }

  /**
   * Execute a function within a specific organization context
   * This ensures RLS policies are applied correctly for the duration of the operation
   */
  async withOrganizationContext<T>(
    organizationId: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    await this.setOrganizationContext(organizationId);
    try {
      return await operation();
    } finally {
      await this.clearOrganizationContext();
    }
  }

  /**
   * Get a database connection with organization context pre-set
   * Useful for operations that need to maintain context across multiple queries
   */
  async getContextualDb(
    organizationId: string,
  ): Promise<NodePgDatabase<typeof schema>> {
    await this.setOrganizationContext(organizationId);
    return this.db;
  }
}
