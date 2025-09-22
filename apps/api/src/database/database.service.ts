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
    if (this.pool) {
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
}
