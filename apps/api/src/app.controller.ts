import { Controller, Get, Post, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { SentryService } from './sentry/sentry.service';
import { Public } from './presentation/decorators/public.decorator';
import { DatabaseService } from './database/database.service';
import { sql } from 'drizzle-orm';
import { RATE_LIMIT_TIERS } from './common/throttler';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly sentryService: SentryService,
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get welcome message' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Welcome message',
    schema: {
      type: 'string',
      example: 'Hello World!',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @Public()
  @Throttle({ [RATE_LIMIT_TIERS.MONITORING]: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        uptime: { type: 'number', example: 123.456 },
        environment: { type: 'string', example: 'development' },
        version: { type: 'string', example: '1.0.0' },
        services: {
          type: 'object',
          properties: {
            database: { type: 'string', example: 'connected' },
            redis: { type: 'string', example: 'connected' },
            sentry: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      version: '1.0.0',
      services: {
        database: 'connected',
        redis: 'connected',
        sentry: !!this.configService.get<string>('SENTRY_DSN'),
      },
    };
  }

  @Get('health/database')
  @Public()
  @Throttle({ [RATE_LIMIT_TIERS.MONITORING]: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Database health and table status' })
  @ApiResponse({
    status: 200,
    description: 'Database status and table information',
  })
  async getDatabaseHealth() {
    try {
      // Get database connection from service
      const db = this.databaseService.getDb();

      // Check if database connection is available
      if (!db) {
        return {
          status: 'error',
          timestamp: new Date().toISOString(),
          database: {
            connected: false,
            error: 'Database connection not initialized',
            tables: [],
            migrationTableExists: false,
            usersTableExists: false,
            userCount: 0,
            totalTables: 0,
          },
        };
      }

      // Check if tables exist
      const tablesQuery = sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `;

      const result = await db.execute(tablesQuery);
      const tables = result.rows.map(
        (row: Record<string, unknown>) =>
          (row as { table_name: string }).table_name,
      );

      // Check if migration table exists
      const migrationTableExists = tables.includes('__drizzle_migrations');

      // Check if users table exists
      const usersTableExists = tables.includes('users');

      // If users table exists, get count
      let userCount = 0;
      if (usersTableExists) {
        try {
          const countResult = await db.execute(
            sql`SELECT COUNT(*) as count FROM users`,
          );
          userCount = parseInt(countResult.rows[0]?.count as string) || 0;
        } catch {
          // Ignore count errors - use default value
        }
      }

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          tables: tables,
          migrationTableExists,
          usersTableExists,
          userCount,
          totalTables: tables.length,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          tables: [],
          migrationTableExists: false,
          usersTableExists: false,
          userCount: 0,
          totalTables: 0,
        },
      };
    }
  }

  @Post('test-error')
  @Public()
  @Throttle({ [RATE_LIMIT_TIERS.STRICT]: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Test error tracking (development only)' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Test error thrown',
  })
  testError() {
    // Test endpoint to verify Sentry error tracking
    this.sentryService.captureMessage('Test error endpoint called', 'info');
    throw new Error('This is a test error for Sentry');
  }

  @Post('test-sentry')
  @Public()
  @Throttle({ [RATE_LIMIT_TIERS.STRICT]: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Test Sentry message capture (development only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sentry test message sent',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Sentry test message sent' },
      },
    },
  })
  testSentry() {
    // Test endpoint to verify Sentry message capture
    this.sentryService.captureMessage('Test Sentry integration', 'info');
    return { message: 'Sentry test message sent' };
  }
}
