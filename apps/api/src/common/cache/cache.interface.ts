export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  expiresAt?: Date;
  metadata?: {
    hits: number;
    lastAccessed: Date;
    createdAt: Date;
    size: number;
  };
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for cache invalidation
  priority?: 'low' | 'medium' | 'high'; // Eviction priority
  compress?: boolean; // Whether to compress the value
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  hitRate: number;
  totalSize: number;
  entryCount: number;
}

export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  getStats(): Promise<CacheStats>;
  invalidateByTag(tag: string): Promise<number>;
  invalidateByPattern(pattern: string): Promise<number>;
}
