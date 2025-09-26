import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
      useFactory: () => {
        // For now, return null to make RedisCacheService optional
        // This can be replaced with actual Redis connection later
        return null;
      },
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
