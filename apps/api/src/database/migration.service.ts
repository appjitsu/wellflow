import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from './schema';

@Injectable()
export class MigrationService {
  constructor(private configService: ConfigService) {}

  async runMigrations(): Promise<{ success: boolean; message: string }> {
    let pool: Pool | null = null;
    
    try {
      // Create a new connection pool for migrations
      pool = new Pool({
        host: this.configService.get<string>('DB_HOST', 'localhost'),
        port: this.configService.get<number>('DB_PORT', 5432),
        user: this.configService.get<string>('DB_USER', 'postgres'),
        password: this.configService.get<string>('DB_PASSWORD', 'password'),
        database: this.configService.get<string>('DB_NAME', 'wellflow'),
        max: 5, // Smaller pool for migrations
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      const db = drizzle(pool, { schema });

      console.log('🔄 Running database migrations...');
      
      // Run migrations from the migrations folder
      await migrate(db, { 
        migrationsFolder: './src/database/migrations',
        migrationsTable: '__drizzle_migrations'
      });

      console.log('✅ Database migrations completed successfully');
      
      return {
        success: true,
        message: 'Database migrations completed successfully'
      };
    } catch (error) {
      console.error('❌ Database migration failed:', error);
      
      return {
        success: false,
        message: `Database migration failed: ${error.message}`
      };
    } finally {
      if (pool) {
        await pool.end();
      }
    }
  }

  async checkMigrationStatus(): Promise<{ 
    success: boolean; 
    tablesExist: boolean; 
    migrationTable: boolean;
    message: string;
  }> {
    let pool: Pool | null = null;
    
    try {
      pool = new Pool({
        host: this.configService.get<string>('DB_HOST', 'localhost'),
        port: this.configService.get<number>('DB_PORT', 5432),
        user: this.configService.get<string>('DB_USER', 'postgres'),
        password: this.configService.get<string>('DB_PASSWORD', 'password'),
        database: this.configService.get<string>('DB_NAME', 'wellflow'),
        max: 2,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      // Check if users table exists
      const usersTableResult = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        );
      `);
      
      const tablesExist = usersTableResult.rows[0].exists;

      // Check if migration table exists
      const migrationTableResult = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '__drizzle_migrations'
        );
      `);
      
      const migrationTable = migrationTableResult.rows[0].exists;

      return {
        success: true,
        tablesExist,
        migrationTable,
        message: `Tables exist: ${tablesExist}, Migration table exists: ${migrationTable}`
      };
    } catch (error) {
      console.error('❌ Migration status check failed:', error);
      
      return {
        success: false,
        tablesExist: false,
        migrationTable: false,
        message: `Migration status check failed: ${error.message}`
      };
    } finally {
      if (pool) {
        await pool.end();
      }
    }
  }
}
