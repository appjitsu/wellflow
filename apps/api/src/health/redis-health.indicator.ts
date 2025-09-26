import { Injectable, Inject } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Redis } from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(
    @Inject('REDIS_CONNECTION')
    private readonly redis: Redis,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();

      // Test basic connectivity
      const pingResult = await this.redis.ping();

      // Get Redis info
      const info = await this.redis.info();
      const memory = await this.redis.info('memory');

      const responseTime = Date.now() - startTime;

      // Parse version from info
      const version = info.match(/redis_version:([^\r\n]+)/)?.[1] || 'unknown';

      // Parse memory usage
      const usedMemory = memory.match(/used_memory:([^\r\n]+)/)?.[1] || '0';
      const maxMemory = memory.match(/maxmemory:([^\r\n]+)/)?.[1] || '0';

      const memoryUsagePercent =
        maxMemory !== '0'
          ? Math.round((parseInt(usedMemory) / parseInt(maxMemory)) * 100)
          : 0;

      return this.getStatus(key, true, {
        responseTime,
        ping: pingResult,
        version,
        memoryUsagePercent,
        usedMemory: parseInt(usedMemory),
        maxMemory: parseInt(maxMemory),
        connections: await this.redis.dbsize(),
        status: 'connected',
      });
    } catch (error) {
      return this.getStatus(key, false, {
        error: error.message,
        status: 'disconnected',
      });
    }
  }
}
