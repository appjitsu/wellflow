import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { createClient } from 'redis';

// Mock the redis module
jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

describe('RedisService', () => {
  let service: RedisService;
  let configService: ConfigService;
  let mockRedisClient: any;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    // Create mock Redis client
    mockRedisClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      isOpen: true,
      get: jest.fn(),
      set: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      expire: jest.fn(),
      hGet: jest.fn(),
      hSet: jest.fn(),
      hGetAll: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockRedisClient);

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
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should create Redis client with default URL', async () => {
      // Mock the get method to return the default value when called
      mockConfigService.get.mockImplementation((key, defaultValue) => defaultValue);

      await service.onModuleInit();

      expect(createClient).toHaveBeenCalledWith({
        url: 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000,
        },
      });
      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    it('should create Redis client with custom URL', async () => {
      const customUrl = 'redis://custom-host:6380';
      mockConfigService.get.mockReturnValue(customUrl);

      await service.onModuleInit();

      expect(createClient).toHaveBeenCalledWith({
        url: customUrl,
        socket: {
          connectTimeout: 5000,
        },
      });
    });

    it('should set up event listeners', async () => {
      await service.onModuleInit();

      expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockRedisClient.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('should handle connection errors', async () => {
      const connectionError = new Error('Connection failed');
      mockRedisClient.connect.mockRejectedValue(connectionError);

      await expect(service.onModuleInit()).rejects.toThrow('Connection failed');
    });

    it('should log connection events', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await service.onModuleInit();

      // Simulate event callbacks
      const errorCallback = mockRedisClient.on.mock.calls.find(call => call[0] === 'error')[1];
      const connectCallback = mockRedisClient.on.mock.calls.find(call => call[0] === 'connect')[1];
      const disconnectCallback = mockRedisClient.on.mock.calls.find(call => call[0] === 'disconnect')[1];

      errorCallback(new Error('Test error'));
      connectCallback();
      disconnectCallback();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Redis Client Error:', expect.any(Error));
      expect(consoleSpy).toHaveBeenCalledWith('✅ Redis connected successfully');
      expect(consoleSpy).toHaveBeenCalledWith('🔌 Redis disconnected');

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('onModuleDestroy', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should disconnect Redis client when open', async () => {
      mockRedisClient.isOpen = true;
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.onModuleDestroy();

      expect(mockRedisClient.disconnect).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('🔌 Redis connection closed');

      consoleSpy.mockRestore();
    });

    it('should not disconnect when client is not open', async () => {
      mockRedisClient.isOpen = false;

      await service.onModuleDestroy();

      expect(mockRedisClient.disconnect).not.toHaveBeenCalled();
    });

    it('should handle null client gracefully', async () => {
      // Simulate client being null
      (service as any).client = null;

      await expect(service.onModuleDestroy()).resolves.not.toThrow();
    });
  });

  describe('getClient', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should return Redis client', () => {
      const client = service.getClient();
      expect(client).toBe(mockRedisClient);
    });
  });

  describe('cache operations', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    describe('get', () => {
      it('should get value from Redis', async () => {
        const testValue = 'test-value';
        mockRedisClient.get.mockResolvedValue(testValue);

        const result = await service.get('test-key');

        expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
        expect(result).toBe(testValue);
      });

      it('should return null for non-existent key', async () => {
        mockRedisClient.get.mockResolvedValue(null);

        const result = await service.get('non-existent');

        expect(result).toBeNull();
      });
    });

    describe('set', () => {
      it('should set value without TTL', async () => {
        await service.set('test-key', 'test-value');

        expect(mockRedisClient.set).toHaveBeenCalledWith('test-key', 'test-value');
        expect(mockRedisClient.setEx).not.toHaveBeenCalled();
      });

      it('should set value with TTL', async () => {
        await service.set('test-key', 'test-value', 3600);

        expect(mockRedisClient.setEx).toHaveBeenCalledWith('test-key', 3600, 'test-value');
        expect(mockRedisClient.set).not.toHaveBeenCalled();
      });
    });

    describe('del', () => {
      it('should delete key from Redis', async () => {
        mockRedisClient.del.mockResolvedValue(1);

        const result = await service.del('test-key');

        expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
        expect(result).toBe(1);
      });

      it('should return 0 for non-existent key', async () => {
        mockRedisClient.del.mockResolvedValue(0);

        const result = await service.del('non-existent');

        expect(result).toBe(0);
      });
    });

    describe('exists', () => {
      it('should check if key exists', async () => {
        mockRedisClient.exists.mockResolvedValue(1);

        const result = await service.exists('test-key');

        expect(mockRedisClient.exists).toHaveBeenCalledWith('test-key');
        expect(result).toBe(1);
      });

      it('should return 0 for non-existent key', async () => {
        mockRedisClient.exists.mockResolvedValue(0);

        const result = await service.exists('non-existent');

        expect(result).toBe(0);
      });
    });

    describe('expire', () => {
      it('should set expiration and return true on success', async () => {
        mockRedisClient.expire.mockResolvedValue(1);

        const result = await service.expire('test-key', 3600);

        expect(mockRedisClient.expire).toHaveBeenCalledWith('test-key', 3600);
        expect(result).toBe(true);
      });

      it('should return false when key does not exist', async () => {
        mockRedisClient.expire.mockResolvedValue(0);

        const result = await service.expire('non-existent', 3600);

        expect(result).toBe(false);
      });
    });
  });

  describe('hash operations', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    describe('hGet', () => {
      it('should get hash field value', async () => {
        const testValue = 'field-value';
        mockRedisClient.hGet.mockResolvedValue(testValue);

        const result = await service.hGet('hash-key', 'field');

        expect(mockRedisClient.hGet).toHaveBeenCalledWith('hash-key', 'field');
        expect(result).toBe(testValue);
      });

      it('should return undefined for non-existent field', async () => {
        mockRedisClient.hGet.mockResolvedValue(null);

        const result = await service.hGet('hash-key', 'non-existent');

        expect(result).toBeUndefined();
      });
    });

    describe('hSet', () => {
      it('should set hash field value', async () => {
        mockRedisClient.hSet.mockResolvedValue(1);

        const result = await service.hSet('hash-key', 'field', 'value');

        expect(mockRedisClient.hSet).toHaveBeenCalledWith('hash-key', 'field', 'value');
        expect(result).toBe(1);
      });
    });

    describe('hGetAll', () => {
      it('should get all hash fields', async () => {
        const hashData = { field1: 'value1', field2: 'value2' };
        mockRedisClient.hGetAll.mockResolvedValue(hashData);

        const result = await service.hGetAll('hash-key');

        expect(mockRedisClient.hGetAll).toHaveBeenCalledWith('hash-key');
        expect(result).toEqual(hashData);
      });

      it('should return empty object for non-existent hash', async () => {
        mockRedisClient.hGetAll.mockResolvedValue({});

        const result = await service.hGetAll('non-existent');

        expect(result).toEqual({});
      });
    });
  });

  describe('oil and gas specific scenarios', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should cache well production data', async () => {
      const wellId = 'well-123';
      const productionData = JSON.stringify({
        date: '2024-01-01',
        oilProduction: 150,
        gasProduction: 2500,
        waterProduction: 50,
      });

      await service.set(`well:${wellId}:production:2024-01-01`, productionData, 86400);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        `well:${wellId}:production:2024-01-01`,
        86400,
        productionData
      );
    });

    it('should cache operator permissions', async () => {
      const operatorId = 'op-456';
      const permissions = JSON.stringify(['VIEW_WELLS', 'UPDATE_PRODUCTION']);

      await service.hSet('operator:permissions', operatorId, permissions);

      expect(mockRedisClient.hSet).toHaveBeenCalledWith(
        'operator:permissions',
        operatorId,
        permissions
      );
    });

    it('should cache regulatory compliance status', async () => {
      const wellId = 'well-789';
      const complianceStatus = JSON.stringify({
        lastInspection: '2024-01-15',
        status: 'COMPLIANT',
        nextInspectionDue: '2024-07-15',
      });

      await service.set(`compliance:${wellId}`, complianceStatus, 3600);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        `compliance:${wellId}`,
        3600,
        complianceStatus
      );
    });

    it('should handle session data for field operators', async () => {
      const sessionId = 'sess_abc123';
      const sessionData = JSON.stringify({
        userId: 'user-123',
        role: 'FIELD_OPERATOR',
        currentWell: 'well-456',
        loginTime: new Date().toISOString(),
      });

      await service.set(`session:${sessionId}`, sessionData, 1800); // 30 minutes

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        `session:${sessionId}`,
        1800,
        sessionData
      );
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should handle Redis operation errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      await expect(service.get('test-key')).rejects.toThrow('Redis error');
    });

    it('should handle connection errors during operations', async () => {
      mockRedisClient.set.mockRejectedValue(new Error('Connection lost'));

      await expect(service.set('test-key', 'value')).rejects.toThrow('Connection lost');
    });

    it('should handle hash operation errors', async () => {
      mockRedisClient.hGet.mockRejectedValue(new Error('Hash error'));

      await expect(service.hGet('hash-key', 'field')).rejects.toThrow('Hash error');
    });
  });
});
