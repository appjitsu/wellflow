import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: RedisClientType;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = createClient({
      url: this.configService.get<string>(
        'REDIS_URL',
        'redis://localhost:6379',
      ),
      socket: {
        connectTimeout: 5000,
      },
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    this.client.on('disconnect', () => {
      console.log('🔌 Redis disconnected');
    });

    try {
      await this.client.connect();
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.client && this.client.isReady) {
      await this.client.quit();
      console.log('🔌 Redis connection closed');
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  // Convenience methods
  async get(key: string): Promise<string | null> {
    const result = await this.client.get(key);
    return typeof result === 'string' ? result : null;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async setWithExpiry(key: string, value: string, ttl: number): Promise<void> {
    await this.client.setEx(key, ttl, value);
  }

  async delete(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  async getTTL(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.client.expire(key, seconds);
    return result === 1;
  }

  // JSON operations
  async setJSON(key: string, value: any): Promise<void> {
    await this.client.set(key, JSON.stringify(value));
  }

  async getJSON<T = any>(key: string): Promise<T | null> {
    const result = await this.client.get(key);
    if (!result || typeof result !== 'string') return null;

    try {
      return JSON.parse(result);
    } catch {
      return null;
    }
  }

  async setJSONWithExpiry(key: string, value: any, ttl: number): Promise<void> {
    await this.client.setEx(key, ttl, JSON.stringify(value));
  }

  // Hash operations
  async hget(key: string, field: string): Promise<string | null> {
    const result = await this.client.hGet(key, field);
    return typeof result === 'string' ? result : null;
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return await this.client.hSet(key, field, value);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.client.hGetAll(key);
  }

  async hdel(key: string, field: string): Promise<number> {
    return await this.client.hDel(key, field);
  }

  // List operations
  async lpush(key: string, value: string): Promise<number> {
    return await this.client.lPush(key, value);
  }

  async rpush(key: string, value: string): Promise<number> {
    return await this.client.rPush(key, value);
  }

  async lpop(key: string): Promise<string | null> {
    const result = await this.client.lPop(key);
    return typeof result === 'string' ? result : null;
  }

  async rpop(key: string): Promise<string | null> {
    const result = await this.client.rPop(key);
    return typeof result === 'string' ? result : null;
  }

  async llen(key: string): Promise<number> {
    return await this.client.lLen(key);
  }

  // Set operations
  async sadd(key: string, member: string): Promise<number> {
    return await this.client.sAdd(key, member);
  }

  async srem(key: string, member: string): Promise<number> {
    return await this.client.sRem(key, member);
  }

  async smembers(key: string): Promise<string[]> {
    return await this.client.sMembers(key);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.client.sIsMember(key, member);
    return result === 1;
  }

  // Connection management
  async ping(): Promise<string> {
    return await this.client.ping();
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  async flushall(): Promise<string> {
    return await this.client.flushAll();
  }

  async hGet(key: string, field: string): Promise<string | undefined> {
    const result = await this.client.hGet(key, field);
    return typeof result === 'string' ? result : undefined;
  }

  async hSet(key: string, field: string, value: string): Promise<number> {
    return await this.client.hSet(key, field, value);
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    return await this.client.hGetAll(key);
  }

  // Multi-key operations
  async deleteMultiple(keys: string[]): Promise<number> {
    return await this.client.del(keys);
  }

  // Tenant-specific operations
  async setTenantKey(
    tenantId: string,
    key: string,
    value: string,
  ): Promise<void> {
    const tenantKey = `${tenantId}:${key}`;
    await this.client.set(tenantKey, value);
  }

  async getTenantKey(tenantId: string, key: string): Promise<string | null> {
    const tenantKey = `${tenantId}:${key}`;
    const result = await this.client.get(tenantKey);
    return typeof result === 'string' ? result : null;
  }

  async deleteTenantKeys(tenantId: string): Promise<number> {
    const pattern = `${tenantId}:*`;
    const keys = await this.client.keys(pattern);
    if (keys.length === 0) return 0;
    return await this.client.del(keys);
  }

  // Connection management
  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }
}
