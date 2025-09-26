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
      const versionMatch = /redis_version:([^\r\n]+)/.exec(info);
      const version = versionMatch?.[1] || 'unknown';

      // Parse memory usage
      const usedMemoryMatch = /used_memory:([^\r\n]+)/.exec(memory);
      const usedMemory = usedMemoryMatch?.[1] || '0';
      const maxMemoryMatch = /maxmemory:([^\r\n]+)/.exec(memory);
      const maxMemory = maxMemoryMatch?.[1] || '0';

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
        error: error instanceof Error ? error.message : 'Unknown Redis error',
        status: 'disconnected',
      });
    }
  }
}
