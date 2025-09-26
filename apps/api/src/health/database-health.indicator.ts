import { Injectable, Inject } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../database/schema';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();

      // Test basic connectivity
      await this.db.execute(sql`SELECT 1 as health_check`);

      // Test connection pool stats
      const poolStats: unknown = await this.db.execute(
        sql`SELECT count(*) as connection_count FROM pg_stat_activity WHERE datname = current_database()`,
      );

      const responseTime = Date.now() - startTime;
      const connectionCount =
        Array.isArray(poolStats) && poolStats[0]
          ? (poolStats[0] as { connection_count?: number }).connection_count ||
            0
          : 0;

      return this.getStatus(key, true, {
        responseTime,
        connectionCount,
        database: 'wellflow',
        status: 'connected',
      });
    } catch (error) {
      return this.getStatus(key, false, {
        error:
          error instanceof Error ? error.message : 'Unknown database error',
        database: 'wellflow',
        status: 'disconnected',
      });
    }
  }
}
