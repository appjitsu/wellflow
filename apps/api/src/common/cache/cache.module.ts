import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';
import { MemoryCacheService } from './memory-cache.service';
import { RedisCacheService } from './redis-cache.service';

@Global()
@Module({
  providers: [
    CacheService,
    MemoryCacheService,
    RedisCacheService,
  ],
  exports: [
    CacheService,
    MemoryCacheService,
    RedisCacheService,
  ],
})
export class CacheModule {}
