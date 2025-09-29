import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { CacheService } from './cache.service';
import { MemoryCacheService } from './memory-cache.service';
import { RedisCacheService } from './redis-cache.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MemoryCacheService,
      useFactory: (configService: ConfigService) => {
        const maxSize = configService.get<number>('CACHE_MAX_SIZE', 1000);
        const defaultTTL = configService.get<number>('CACHE_DEFAULT_TTL', 300);
        return new MemoryCacheService(maxSize, defaultTTL);
      },
      inject: [ConfigService],
    },
    {
      provide: 'REDIS_CONNECTION',
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>(
          'REDIS_URL',
          'redis://localhost:6379',
        );

        const redis = new Redis(redisUrl, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          lazyConnect: true,
        });

        redis.on('error', (err) => {
          console.error('Rate Limiting Redis Connection Error:', err);
        });

        redis.on('connect', () => {
          console.log('✅ Rate Limiting Redis connected successfully');
        });

        try {
          await redis.connect();
          return redis;
        } catch (error) {
          console.error('❌ Rate Limiting Redis connection failed:', error);
          // Return null to allow graceful degradation
          return null;
        }
      },
      inject: [ConfigService],
    },
    CacheService,
    RedisCacheService,
  ],
  exports: [
    CacheService,
    MemoryCacheService,
    RedisCacheService,
    'REDIS_CONNECTION',
  ],
})
export class CacheModule {}
