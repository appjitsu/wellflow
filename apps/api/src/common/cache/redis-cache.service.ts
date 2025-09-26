import { Injectable, Inject, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ICache, CacheOptions, CacheStats } from './cache.interface';

@Injectable()
export class RedisCacheService implements ICache {
  private readonly logger = new Logger(RedisCacheService.name);
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
  };

  constructor(
    @Inject('REDIS_CONNECTION')
    private readonly redis: Redis | null,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) {
      this.stats.misses++;
      return null;
    }

    try {
      const value = await this.redis.get(key);

      if (!value) {
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;

      // Try to parse JSON, fallback to raw value
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      this.logger.error(`Failed to get cache key ${key}:`, error);
      this.stats.misses++;
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {},
  ): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      const serializedValue = JSON.stringify(value);
      const ttl = options.ttl || 3600; // 1 hour default

      await this.redis.setex(key, ttl, serializedValue);
      this.stats.sets++;

      // Store tags if provided
      if (options.tags && options.tags.length > 0) {
        const tagKey = `tag:${key}`;
        await this.redis.sadd(tagKey, ...options.tags);
        await this.redis.expire(tagKey, ttl);
      }
    } catch (error) {
      this.logger.error(`Failed to set cache key ${key}:`, error);
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.redis) {
      return false;
    }

    try {
      const result = await this.redis.del(key);
      const deleted = result > 0;

      if (deleted) {
        this.stats.deletes++;

        // Also remove tag associations
        const tagKey = `tag:${key}`;
        await this.redis.del(tagKey);
      }

      return deleted;
    } catch (error) {
      this.logger.error(`Failed to delete cache key ${key}:`, error);
      return false;
    }
  }

  async clear(): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      // This is dangerous - only use in testing
      await this.redis.flushdb();
      this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0, evictions: 0 };
    } catch (error) {
      this.logger.error('Failed to clear cache:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    if (!this.redis) {
      return false;
    }

    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error(`Failed to check cache key ${key}:`, error);
      return false;
    }
  }

  async getStats(): Promise<CacheStats> {
    if (!this.redis) {
      return {
        ...this.stats,
        hitRate: 0,
        totalSize: 0,
        entryCount: 0,
      };
    }

    try {
      const info = await this.redis.info();
      const stats = await this.redis.info('stats');

      // Parse Redis stats
      const keyspaceHits = this.parseRedisStat(stats, 'keyspace_hits');
      const keyspaceMisses = this.parseRedisStat(stats, 'keyspace_misses');
      const totalRequests = keyspaceHits + keyspaceMisses;
      const hitRate = totalRequests > 0 ? keyspaceHits / totalRequests : 0;

      const usedMemory = this.parseRedisStat(info, 'used_memory');
      const dbSize = await this.redis.dbsize();

      return {
        ...this.stats,
        hitRate,
        totalSize: usedMemory,
        entryCount: dbSize,
      };
    } catch (error) {
      this.logger.error('Failed to get Redis stats:', error);
      return {
        ...this.stats,
        hitRate: 0,
        totalSize: 0,
        entryCount: 0,
      };
    }
  }

  async invalidateByTag(tag: string): Promise<number> {
    if (!this.redis) {
      return 0;
    }

    try {
      // Find all keys with this tag
      const tagKeys = await this.redis.keys(`tag:*`);
      let deletedCount = 0;

      for (const tagKey of tagKeys) {
        const isMember = await this.redis.sismember(tagKey, tag);
        if (isMember) {
          // Extract the actual cache key
          const cacheKey = tagKey.replace('tag:', '');

          // Delete the cache entry
          const deleted = await this.redis.del(cacheKey);
          if (deleted) {
            deletedCount++;
            this.stats.deletes++;
          }

          // Remove from tag set
          await this.redis.srem(tagKey, tag);
        }
      }

      return deletedCount;
    } catch (error) {
      this.logger.error(`Failed to invalidate by tag ${tag}:`, error);
      return 0;
    }
  }

  async invalidateByPattern(pattern: string): Promise<number> {
    if (!this.redis) {
      return 0;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;

      const deleted = await this.redis.del(...keys);
      this.stats.deletes += deleted;

      return deleted;
    } catch (error) {
      this.logger.error(`Failed to invalidate by pattern ${pattern}:`, error);
      return 0;
    }
  }

  private parseRedisStat(info: string, key: string): number {
    // Use indexOf instead of regex to avoid security issues
    const searchKey = key + ':';
    const startIndex = info.indexOf(searchKey);
    if (startIndex === -1) return 0;

    const valueStart = startIndex + searchKey.length;
    const lineEnd = info.indexOf('\r', valueStart);
    const actualEnd = lineEnd === -1 ? info.indexOf('\n', valueStart) : lineEnd;

    if (actualEnd === -1) {
      return parseInt(info.substring(valueStart)) || 0;
    }

    return parseInt(info.substring(valueStart, actualEnd)) || 0;
  }
}
