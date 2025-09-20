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

    // Create database tables directly (temporary solution until migration files are properly copied)
    try {
      console.log('🔄 Creating database tables...');

      // Create users table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id serial PRIMARY KEY,
          email varchar(255) NOT NULL UNIQUE,
          name varchar(255) NOT NULL,
          created_at timestamp DEFAULT now() NOT NULL,
          updated_at timestamp DEFAULT now() NOT NULL
        );
      `);

      // Create posts table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS posts (
          id serial PRIMARY KEY,
          title varchar(255) NOT NULL,
          content text,
          author_id integer,
          published boolean DEFAULT false NOT NULL,
          created_at timestamp DEFAULT now() NOT NULL,
          updated_at timestamp DEFAULT now() NOT NULL
        );
      `);

      // Add foreign key constraint (check if it exists first)
      await this.pool.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'posts_author_id_users_id_fk'
          ) THEN
            ALTER TABLE posts
            ADD CONSTRAINT posts_author_id_users_id_fk
            FOREIGN KEY (author_id) REFERENCES users(id)
            ON DELETE SET NULL ON UPDATE CASCADE;
          END IF;
        END $$;
      `);

      console.log('✅ Database tables created successfully');
    } catch (error) {
      console.error('❌ Database table creation failed:', error);
      // Don't throw here - let the app start even if table creation fails
      console.warn(
        '⚠️ Application starting without tables - manual intervention may be required',
      );
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
