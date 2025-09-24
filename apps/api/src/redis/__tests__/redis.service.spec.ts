import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis.service';

// Mock Redis client with modern API
const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  keys: jest.fn(),
  flushAll: jest.fn(),
  ping: jest.fn(),
  quit: jest.fn(),
  on: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  hGet: jest.fn(),
  hSet: jest.fn(),
  hDel: jest.fn(),
  hGetAll: jest.fn(),
  lPush: jest.fn(),
  rPush: jest.fn(),
  lPop: jest.fn(),
  rPop: jest.fn(),
  lLen: jest.fn(),
  sAdd: jest.fn(),
  sRem: jest.fn(),
  sMembers: jest.fn(),
  sIsMember: jest.fn(),
};

// Mock the redis module
jest.mock('redis', () => ({
  createClient: jest.fn(() => mockRedisClient),
}));

const mockConfigService = {
  get: jest.fn(),
};

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup config service mock
    mockConfigService.get.mockReturnValue('redis://localhost:6379');

    // Setup Redis client mock to be connected
    mockRedisClient.connect.mockResolvedValue(undefined);
    mockRedisClient.ping.mockResolvedValue('PONG');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    await service.onModuleInit(); // Initialize the Redis client
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Basic Operations', () => {
    it('should set and get string values', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.get.mockResolvedValue('test-value');

      await service.set('test-key', 'test-value');
      const result = await service.get('test-key');

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        'test-value',
      );
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe('test-value');
    });

    it('should set values with expiration', async () => {
      mockRedisClient.setEx.mockResolvedValue('OK');

      await service.setWithExpiry('test-key', 'test-value', 3600);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test-key',
        3600,
        'test-value',
      );
    });

    it('should delete keys', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      const result = await service.delete('test-key');

      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
      expect(result).toBe(1);
    });

    it('should check if key exists', async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await service.exists('test-key');

      expect(mockRedisClient.exists).toHaveBeenCalledWith('test-key');
      expect(result).toBe(1);
    });

    it('should get TTL for key', async () => {
      mockRedisClient.ttl.mockResolvedValue(3600);

      const result = await service.getTTL('test-key');

      expect(mockRedisClient.ttl).toHaveBeenCalledWith('test-key');
      expect(result).toBe(3600);
    });
  });

  describe('JSON Operations', () => {
    it('should set and get JSON objects', async () => {
      const testObject = { name: 'test', value: 123 };
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testObject));

      await service.setJSON('test-key', testObject);
      const result = await service.getJSON('test-key');

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(testObject),
      );
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(testObject);
    });

    it('should handle invalid JSON gracefully', async () => {
      mockRedisClient.get.mockResolvedValue('invalid json');

      const result = await service.getJSON('test-key');

      expect(result).toBeNull();
    });

    it('should set JSON with expiration', async () => {
      const testObject = { name: 'test' };
      mockRedisClient.setEx.mockResolvedValue('OK');

      await service.setJSONWithExpiry('test-key', testObject, 1800);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test-key',
        1800,
        JSON.stringify(testObject),
      );
    });
  });

  describe('Hash Operations', () => {
    it('should set and get hash fields', async () => {
      mockRedisClient.hSet.mockResolvedValue(1);
      mockRedisClient.hGet.mockResolvedValue('field-value');

      await service.hset('hash-key', 'field', 'field-value');
      const result = await service.hget('hash-key', 'field');

      expect(mockRedisClient.hSet).toHaveBeenCalledWith(
        'hash-key',
        'field',
        'field-value',
      );
      expect(mockRedisClient.hGet).toHaveBeenCalledWith('hash-key', 'field');
      expect(result).toBe('field-value');
    });

    it('should get all hash fields', async () => {
      const hashData = { field1: 'value1', field2: 'value2' };
      mockRedisClient.hGetAll.mockResolvedValue(hashData);

      const result = await service.hgetall('hash-key');

      expect(mockRedisClient.hGetAll).toHaveBeenCalledWith('hash-key');
      expect(result).toEqual(hashData);
    });

    it('should delete hash fields', async () => {
      mockRedisClient.hDel.mockResolvedValue(1);

      const result = await service.hdel('hash-key', 'field');

      expect(mockRedisClient.hDel).toHaveBeenCalledWith('hash-key', 'field');
      expect(result).toBe(1);
    });
  });

  describe('List Operations', () => {
    it('should push and pop from lists', async () => {
      mockRedisClient.lPush.mockResolvedValue(1);
      mockRedisClient.rPop.mockResolvedValue('list-item');

      await service.lpush('list-key', 'list-item');
      const result = await service.rpop('list-key');

      expect(mockRedisClient.lPush).toHaveBeenCalledWith(
        'list-key',
        'list-item',
      );
      expect(mockRedisClient.rPop).toHaveBeenCalledWith('list-key');
      expect(result).toBe('list-item');
    });

    it('should get list length', async () => {
      mockRedisClient.lLen.mockResolvedValue(5);

      const result = await service.llen('list-key');

      expect(mockRedisClient.lLen).toHaveBeenCalledWith('list-key');
      expect(result).toBe(5);
    });
  });

  describe('Set Operations', () => {
    it('should add and remove set members', async () => {
      mockRedisClient.sAdd.mockResolvedValue(1);
      mockRedisClient.sRem.mockResolvedValue(1);

      await service.sadd('set-key', 'member');
      const removeResult = await service.srem('set-key', 'member');

      expect(mockRedisClient.sAdd).toHaveBeenCalledWith('set-key', 'member');
      expect(mockRedisClient.sRem).toHaveBeenCalledWith('set-key', 'member');
      expect(removeResult).toBe(1);
    });

    it('should check set membership', async () => {
      mockRedisClient.sIsMember.mockResolvedValue(1);

      const result = await service.sismember('set-key', 'member');

      expect(mockRedisClient.sIsMember).toHaveBeenCalledWith(
        'set-key',
        'member',
      );
      expect(result).toBe(true);
    });

    it('should get all set members', async () => {
      const members = ['member1', 'member2', 'member3'];
      mockRedisClient.sMembers.mockResolvedValue(members);

      const result = await service.smembers('set-key');

      expect(mockRedisClient.sMembers).toHaveBeenCalledWith('set-key');
      expect(result).toEqual(members);
    });
  });

  describe('Connection Management', () => {
    it('should ping Redis server', async () => {
      mockRedisClient.ping.mockResolvedValue('PONG');

      const result = await service.ping();

      expect(mockRedisClient.ping).toHaveBeenCalled();
      expect(result).toBe('PONG');
    });

    it('should handle connection errors', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Connection failed'));

      await expect(service.get('test-key')).rejects.toThrow(
        'Connection failed',
      );
    });

    it('should disconnect gracefully', async () => {
      mockRedisClient.disconnect.mockResolvedValue(undefined);

      await service.disconnect();

      expect(mockRedisClient.disconnect).toHaveBeenCalled();
    });
  });

  describe('Caching Patterns', () => {
    it('should implement cache-aside pattern', async () => {
      mockRedisClient.get.mockResolvedValue(null); // Cache miss
      mockRedisClient.setEx.mockResolvedValue('OK');

      const cacheKey = 'user:123';
      const userData = { id: 123, name: 'John Doe' };

      // Simulate cache miss and set
      const cachedData = await service.getJSON(cacheKey);
      expect(cachedData).toBeNull();

      await service.setJSONWithExpiry(cacheKey, userData, 3600);
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        cacheKey,
        3600,
        JSON.stringify(userData),
      );
    });

    it('should handle cache invalidation', async () => {
      mockRedisClient.del.mockResolvedValue(1);
      mockRedisClient.keys.mockResolvedValue(['user:123', 'user:456']);

      // Invalidate specific key
      await service.delete('user:123');
      expect(mockRedisClient.del).toHaveBeenCalledWith('user:123');

      // Invalidate pattern
      const keys = await service.keys('user:*');
      expect(mockRedisClient.keys).toHaveBeenCalledWith('user:*');
      expect(keys).toEqual(['user:123', 'user:456']);
    });
  });

  describe('Multi-tenant Support', () => {
    it('should support tenant-prefixed keys', async () => {
      const tenantId = 'org-123';
      const key = 'user:456';
      const prefixedKey = `${tenantId}:${key}`;
      mockRedisClient.set.mockResolvedValue('OK');

      await service.setTenantKey(tenantId, key, 'value');

      expect(mockRedisClient.set).toHaveBeenCalledWith(prefixedKey, 'value');
    });

    it('should get tenant-prefixed keys', async () => {
      const tenantId = 'org-123';
      const key = 'user:456';
      const prefixedKey = `${tenantId}:${key}`;
      mockRedisClient.get.mockResolvedValue('tenant-value');

      const result = await service.getTenantKey(tenantId, key);

      expect(mockRedisClient.get).toHaveBeenCalledWith(prefixedKey);
      expect(result).toBe('tenant-value');
    });

    it('should delete all tenant keys', async () => {
      const tenantId = 'org-123';
      mockRedisClient.keys.mockResolvedValue([
        'org-123:user:1',
        'org-123:user:2',
      ]);
      mockRedisClient.del.mockResolvedValue(2);

      const result = await service.deleteTenantKeys(tenantId);

      expect(mockRedisClient.keys).toHaveBeenCalledWith(`${tenantId}:*`);
      expect(mockRedisClient.del).toHaveBeenCalledWith([
        'org-123:user:1',
        'org-123:user:2',
      ]);
      expect(result).toBe(2);
    });
  });

  describe('Performance and Monitoring', () => {
    it('should measure operation performance', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      const startTime = Date.now();
      await service.set('perf-key', 'perf-value');
      const endTime = Date.now();

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'perf-key',
        'perf-value',
      );
      expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly
    });

    it('should handle bulk operations efficiently', async () => {
      const keys = Array.from({ length: 10 }, (_, i) => `key:${i}`);
      mockRedisClient.del.mockResolvedValue(10);

      const startTime = Date.now();
      const result = await service.deleteMultiple(keys);
      const endTime = Date.now();

      expect(mockRedisClient.del).toHaveBeenCalledWith(keys);
      expect(result).toBe(10);
      expect(endTime - startTime).toBeLessThan(200); // Bulk operation should be efficient
    });
  });
});
