import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { ICache, CacheOptions, CacheStats } from './cache.interface';
import { MemoryCacheService } from './memory-cache.service';
import { RedisCacheService } from './redis-cache.service';

export interface MultiLevelCacheOptions extends CacheOptions {
  useMemoryCache?: boolean;
  useRedisCache?: boolean;
  memoryTTL?: number;
  redisTTL?: number;
  cacheStrategy?: 'memory-first' | 'redis-first' | 'parallel';
}

@Injectable()
export class CacheService implements ICache {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Optional() private readonly memoryCache?: MemoryCacheService,
    @Optional() private readonly redisCache?: RedisCacheService,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first (faster)
    if (this.memoryCache) {
      const memoryResult = await this.memoryCache.get<T>(key);
      if (memoryResult !== null) {
        return memoryResult;
      }
    }

    // Try Redis cache
    if (this.redisCache) {
      const redisResult = await this.redisCache.get<T>(key);
      if (redisResult !== null) {
        // Populate memory cache for future requests
        if (this.memoryCache) {
          await this.memoryCache.set(key, redisResult, { ttl: 300 }); // 5 minutes in memory
        }
        return redisResult;
      }
    }

    return null;
  }

  async set<T>(
    key: string,
    value: T,
    options: MultiLevelCacheOptions = {},
  ): Promise<void> {
    const {
      useMemoryCache = true,
      useRedisCache = true,
      memoryTTL = 300, // 5 minutes
      redisTTL = 3600, // 1 hour
      ...cacheOptions
    } = options;

    // Set in both caches in parallel
    const promises: Promise<void>[] = [];

    if (useMemoryCache && this.memoryCache) {
      promises.push(
        this.memoryCache.set(key, value, {
          ...cacheOptions,
          ttl: memoryTTL,
        }),
      );
    }

    if (useRedisCache && this.redisCache) {
      promises.push(
        this.redisCache.set(key, value, {
          ...cacheOptions,
          ttl: redisTTL,
        }),
      );
    }

    await Promise.allSettled(promises);
  }

  async delete(key: string): Promise<boolean> {
    const promises: Promise<boolean>[] = [];

    if (this.memoryCache) {
      promises.push(this.memoryCache.delete(key));
    }

    if (this.redisCache) {
      promises.push(this.redisCache.delete(key));
    }

    const results = await Promise.allSettled(promises);
    return results.some(
      (result) => result.status === 'fulfilled' && result.value,
    );
  }

  async clear(): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.memoryCache) {
      promises.push(this.memoryCache.clear());
    }

    if (this.redisCache) {
      promises.push(this.redisCache.clear());
    }

    await Promise.allSettled(promises);
  }

  async has(key: string): Promise<boolean> {
    // Check memory cache first
    if (this.memoryCache) {
      const memoryHas = await this.memoryCache.has(key);
      if (memoryHas) return true;
    }

    // Check Redis cache
    if (this.redisCache) {
      return await this.redisCache.has(key);
    }

    return false;
  }

  async getStats(): Promise<CacheStats> {
    const [memoryStats, redisStats] = await Promise.allSettled([
      this.memoryCache?.getStats(),
      this.redisCache?.getStats(),
    ]);

    const memory =
      memoryStats.status === 'fulfilled' ? memoryStats.value : null;
    const redis = redisStats.status === 'fulfilled' ? redisStats.value : null;

    // Combine stats
    return {
      hits: (memory?.hits || 0) + (redis?.hits || 0),
      misses: (memory?.misses || 0) + (redis?.misses || 0),
      sets: (memory?.sets || 0) + (redis?.sets || 0),
      deletes: (memory?.deletes || 0) + (redis?.deletes || 0),
      evictions: (memory?.evictions || 0) + (redis?.evictions || 0),
      hitRate: this.calculateCombinedHitRate(memory, redis),
      totalSize: (memory?.totalSize || 0) + (redis?.totalSize || 0),
      entryCount: (memory?.entryCount || 0) + (redis?.entryCount || 0),
    };
  }

  async invalidateByTag(tag: string): Promise<number> {
    const promises: Promise<number>[] = [];

    if (this.memoryCache) {
      promises.push(this.memoryCache.invalidateByTag(tag));
    }

    if (this.redisCache) {
      promises.push(this.redisCache.invalidateByTag(tag));
    }

    const results = await Promise.allSettled(promises);
    return results.reduce((total, result) => {
      return total + (result.status === 'fulfilled' ? result.value : 0);
    }, 0);
  }

  async invalidateByPattern(pattern: string): Promise<number> {
    const promises: Promise<number>[] = [];

    if (this.memoryCache) {
      promises.push(this.memoryCache.invalidateByPattern(pattern));
    }

    if (this.redisCache) {
      promises.push(this.redisCache.invalidateByPattern(pattern));
    }

    const results = await Promise.allSettled(promises);
    return results.reduce((total, result) => {
      return total + (result.status === 'fulfilled' ? result.value : 0);
    }, 0);
  }

  // Advanced caching methods

  /**
   * Get with cache warming - fetches from source if not cached
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: MultiLevelCacheOptions = {},
  ): Promise<T> {
    let value = await this.get<T>(key);

    if (value === null) {
      this.logger.debug(`Cache miss for key: ${key}, fetching from source`);
      value = await fetcher();

      // Cache the result
      await this.set(key, value, options);
    }

    return value;
  }

  /**
   * Set with conditional logic
   */
  async setIfNotExists<T>(
    key: string,
    value: T,
    options: MultiLevelCacheOptions = {},
  ): Promise<boolean> {
    const exists = await this.has(key);
    if (!exists) {
      await this.set(key, value, options);
      return true;
    }
    return false;
  }

  /**
   * Atomic increment operation
   */
  async increment(key: string, amount: number = 1): Promise<number | null> {
    // Redis supports atomic increment
    if (this.redisCache) {
      try {
        const result = await this.redisCache['redis'].incrby(key, amount);
        // Update memory cache
        if (this.memoryCache) {
          await this.memoryCache.set(key, result, { ttl: 60 }); // Short TTL for counters
        }
        return result;
      } catch (error) {
        this.logger.error(`Failed to increment cache key ${key}:`, error);
      }
    }

    // Fallback to memory-only increment
    if (this.memoryCache) {
      const current = (await this.memoryCache.get<number>(key)) || 0;
      const newValue = current + amount;
      await this.memoryCache.set(key, newValue, { ttl: 60 });
      return newValue;
    }

    return null;
  }

  /**
   * Cache with TTL extension on access
   */
  async getWithSlidingExpiration<T>(
    key: string,
    ttlSeconds: number = 300,
  ): Promise<T | null> {
    const value = await this.get<T>(key);

    if (value !== null) {
      // Extend TTL in Redis
      if (this.redisCache) {
        try {
          await this.redisCache['redis'].expire(key, ttlSeconds);
        } catch (error) {
          this.logger.warn(`Failed to extend TTL for key ${key}:`, error);
        }
      }

      // Update memory cache TTL
      if (this.memoryCache) {
        await this.memoryCache.set(key, value, {
          ttl: Math.min(ttlSeconds, 300),
        });
      }
    }

    return value;
  }

  /**
   * Batch operations
   */
  async getMany<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();

    // Get from both caches in parallel
    const promises = keys.map(async (key) => {
      const value = await this.get<T>(key);
      if (value !== null) {
        results.set(key, value);
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  async setMany(
    entries: Array<{ key: string; value: any; options?: CacheOptions }>,
  ): Promise<void> {
    const promises = entries.map(({ key, value, options }) =>
      this.set(key, value, options),
    );

    await Promise.allSettled(promises);
  }

  private calculateCombinedHitRate(
    memory: CacheStats | null,
    redis: CacheStats | null,
  ): number {
    const totalHits = (memory?.hits || 0) + (redis?.hits || 0);
    const totalMisses = (memory?.misses || 0) + (redis?.misses || 0);
    const totalRequests = totalHits + totalMisses;

    return totalRequests > 0 ? totalHits / totalRequests : 0;
  }
}
