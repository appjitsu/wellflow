import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = createClient({
      url: this.configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
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
    if (this.client && this.client.isOpen) {
      await this.client.disconnect();
      console.log('🔌 Redis connection closed');
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  // Convenience methods
  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.client.expire(key, seconds);
    return result === 1;
  }

  async hGet(key: string, field: string): Promise<string | undefined> {
    const result = await this.client.hGet(key, field);
    return result ?? undefined;
  }

  async hSet(key: string, field: string, value: string): Promise<number> {
    return await this.client.hSet(key, field, value);
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    return await this.client.hGetAll(key);
  }
}
