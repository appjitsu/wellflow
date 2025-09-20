import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from './schema';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  public db: NodePgDatabase<typeof schema>;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.pool = new Pool({
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      user: this.configService.get<string>('DB_USER', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD', 'password'),
      database: this.configService.get<string>('DB_NAME', 'wellflow'),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.db = drizzle(this.pool, { schema });

    // Test the connection
    try {
      await this.pool.query('SELECT 1');
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }

    // Run migrations after successful connection
    try {
      console.log('🔄 Running database migrations...');

      // Use different paths for development vs production
      const migrationsFolder = process.env.NODE_ENV === 'production'
        ? './dist/src/database/migrations'
        : './src/database/migrations';

      await migrate(this.db, {
        migrationsFolder,
        migrationsTable: '__drizzle_migrations'
      });

      console.log('✅ Database migrations completed successfully');
    } catch (error) {
      console.error('❌ Database migration failed:', error);
      // Don't throw here - let the app start even if migrations fail
      // This allows manual intervention if needed
      console.warn('⚠️ Application starting without migrations - manual intervention may be required');
    }
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
}
