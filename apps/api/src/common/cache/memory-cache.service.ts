import { Injectable, Logger } from '@nestjs/common';
import {
  ICache,
  CacheEntry,
  CacheOptions,
  CacheStats,
} from './cache.interface';

@Injectable()
export class MemoryCacheService implements ICache {
  private readonly logger = new Logger(MemoryCacheService.name);
  private cache = new Map<string, CacheEntry>();
  private tagIndex = new Map<string, Set<string>>(); // tag -> keys
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
  };

  private readonly maxSize: number;
  private readonly defaultTTL: number;

  constructor(maxSize = 1000, defaultTTL = 300) {
    // 1000 entries, 5 minutes default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;

    // Start cleanup interval
    setInterval(() => this.cleanup(), 60000); // Clean every minute
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      await this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update metadata
    if (entry.metadata) {
      entry.metadata.hits++;
      entry.metadata.lastAccessed = new Date();
    }

    this.stats.hits++;
    return entry.value as T;
  }

  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {},
  ): Promise<void> {
    const ttl = options.ttl || this.defaultTTL;
    const expiresAt = ttl > 0 ? new Date(Date.now() + ttl * 1000) : undefined;

    const entry: CacheEntry<T> = {
      key,
      value,
      expiresAt,
      metadata: {
        hits: 0,
        lastAccessed: new Date(),
        createdAt: new Date(),
        size: this.calculateSize(value),
      },
    };

    // Check if we need to evict entries
    if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
      await this.evictEntries();
    }

    this.cache.set(key, entry);
    this.stats.sets++;

    // Update tag index
    if (options.tags) {
      options.tags.forEach((tag) => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)?.add(key);
      });
    }
  }

  async delete(key: string): Promise<boolean> {
    const existed = this.cache.delete(key);
    if (existed) {
      this.stats.deletes++;

      // Remove from tag index
      this.tagIndex.forEach((keys, tag) => {
        keys.delete(key);
        if (keys.size === 0) {
          this.tagIndex.delete(tag);
        }
      });
    }
    return Promise.resolve(existed);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.tagIndex.clear();
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0, evictions: 0 };
    return Promise.resolve();
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      await this.delete(key);
      return false;
    }

    return true;
  }

  async getStats(): Promise<CacheStats> {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    let totalSize = 0;
    this.cache.forEach((entry) => {
      totalSize += entry.metadata?.size || 0;
    });

    return Promise.resolve({
      ...this.stats,
      hitRate,
      totalSize,
      entryCount: this.cache.size,
    });
  }

  async invalidateByTag(tag: string): Promise<number> {
    const keys = this.tagIndex.get(tag);
    if (!keys) return 0;

    let deletedCount = 0;
    for (const key of keys) {
      if (await this.delete(key)) {
        deletedCount++;
      }
    }

    this.tagIndex.delete(tag);
    return deletedCount;
  }

  async invalidateByPattern(pattern: string): Promise<number> {
    // Use simple string matching instead of regex to avoid security issues
    let deletedCount = 0;
    for (const [key] of this.cache) {
      if (this.matchesPattern(key, pattern)) {
        if (await this.delete(key)) {
          deletedCount++;
        }
      }
    }
    return deletedCount;
  }

  private matchesPattern(key: string, pattern: string): boolean {
    // Simple pattern matching: support * as wildcard
    const patternParts = pattern.split('*');
    let lastIndex = 0;

    for (const part of patternParts) {
      if (part === '') continue;
      const index = key.indexOf(part, lastIndex);
      if (index === -1) {
        return false;
      }
      lastIndex = index + part.length;
    }

    return true;
  }

  private async evictEntries(): Promise<void> {
    // Simple LRU eviction - remove least recently accessed entries
    const entries = Array.from(this.cache.entries());

    // Sort by last accessed (oldest first)
    entries.sort(([, a], [, b]) => {
      const aTime = a.metadata?.lastAccessed?.getTime() || 0;
      const bTime = b.metadata?.lastAccessed?.getTime() || 0;
      return aTime - bTime;
    });

    // Remove oldest entries until we're under the limit
    const toRemove = Math.max(1, this.cache.size - this.maxSize + 100); // Remove 100 extra for buffer

    const entriesToRemove = entries.slice(0, toRemove);
    for (const entry of entriesToRemove) {
      if (entry && Array.isArray(entry) && entry.length > 0) {
        const keyValue = entry[0];
        if (typeof keyValue === 'string') {
          await this.delete(keyValue);
          this.stats.evictions++;
        }
      }
    }

    this.logger.debug(`Evicted ${toRemove} entries from memory cache`);
  }

  private cleanup(): void {
    const now = new Date();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (entry.expiresAt && entry.expiresAt < now) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach((key) => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      this.logger.debug(`Cleaned up ${expiredKeys.length} expired entries`);
    }
  }

  private calculateSize(value: unknown): number {
    try {
      // Rough estimation of memory usage
      const jsonString = JSON.stringify(value);
      return Buffer.byteLength(jsonString, 'utf8');
    } catch {
      return 0;
    }
  }
}
