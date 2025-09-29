import { Test, TestingModule } from '@nestjs/testing';
import { BypassTokenService } from '../bypass-token.service';
import { Redis } from 'ioredis';

describe('BypassTokenService', () => {
  let service: BypassTokenService;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(async () => {
    mockRedis = {
      setex: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      ttl: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BypassTokenService,
        {
          provide: 'REDIS_CONNECTION',
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<BypassTokenService>(BypassTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBypassToken', () => {
    it('should create a bypass token successfully', async () => {
      mockRedis.setex.mockResolvedValue('OK');

      const request = {
        reason: 'Emergency maintenance',
        createdBy: 'admin@example.com',
        durationMs: 60 * 60 * 1000, // 1 hour
        maxUsage: 50,
      };

      const token = await service.createBypassToken(request);

      expect(token).toBeDefined();
      expect(token.token).toBeDefined();
      expect(token.hashedToken).toBeDefined();
      expect(token.reason).toBe(request.reason);
      expect(token.createdBy).toBe(request.createdBy);
      expect(token.maxUsage).toBe(request.maxUsage);
      expect(token.usageCount).toBe(0);
      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it('should create token with default values', async () => {
      mockRedis.setex.mockResolvedValue('OK');

      const request = {
        reason: 'Emergency',
        createdBy: 'admin@example.com',
      };

      const token = await service.createBypassToken(request);

      expect(token.maxUsage).toBe(100); // Default value
      expect(token.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should create token with IP restrictions', async () => {
      mockRedis.setex.mockResolvedValue('OK');

      const request = {
        reason: 'Emergency',
        createdBy: 'admin@example.com',
        ipRestrictions: ['192.168.1.1', '10.0.0.1'],
      };

      const token = await service.createBypassToken(request);

      expect(token.ipRestrictions).toEqual(['192.168.1.1', '10.0.0.1']);
    });

    it('should handle Redis errors', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis error'));

      const request = {
        reason: 'Emergency',
        createdBy: 'admin@example.com',
      };

      await expect(service.createBypassToken(request)).rejects.toThrow(
        'Failed to create bypass token',
      );
    });
  });

  describe('validateAndUseToken', () => {
    const mockTokenData = {
      hashedToken: 'hashed-token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: 'admin@example.com',
      usageCount: 5,
      maxUsage: 100,
      reason: 'Emergency',
    };

    it('should validate and use token successfully', async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(mockTokenData));
      mockRedis.get.mockResolvedValueOnce(
        JSON.stringify({ ...mockTokenData, usageCount: 6 }),
      );
      mockRedis.ttl.mockResolvedValue(3600);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await service.validateAndUseToken(
        'valid-token',
        '192.168.1.1',
      );

      expect(result.isValid).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.token?.usageCount).toBe(6);
    });

    it('should reject empty token', async () => {
      const result = await service.validateAndUseToken('', '192.168.1.1');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Token is required');
    });

    it('should reject invalid token', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await service.validateAndUseToken(
        'invalid-token',
        '192.168.1.1',
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Token not found or invalid');
    });

    it('should reject expired token', async () => {
      const expiredTokenData = {
        ...mockTokenData,
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(expiredTokenData));

      const result = await service.validateAndUseToken(
        'expired-token',
        '192.168.1.1',
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Token has expired');
    });

    it('should reject token with exceeded usage limit', async () => {
      const exhaustedTokenData = {
        ...mockTokenData,
        usageCount: 100,
        maxUsage: 100,
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(exhaustedTokenData));

      const result = await service.validateAndUseToken(
        'exhausted-token',
        '192.168.1.1',
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Token usage limit exceeded');
    });

    it('should enforce IP restrictions', async () => {
      const restrictedTokenData = {
        ...mockTokenData,
        ipRestrictions: ['10.0.0.1', '10.0.0.2'],
      };
      mockRedis.get.mockResolvedValue(JSON.stringify(restrictedTokenData));

      const result = await service.validateAndUseToken(
        'restricted-token',
        '192.168.1.1',
      );

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('IP address not authorized for this token');
    });

    it('should allow access with correct IP restriction', async () => {
      const restrictedTokenData = {
        ...mockTokenData,
        ipRestrictions: ['192.168.1.1', '10.0.0.1'],
      };
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(restrictedTokenData));
      mockRedis.get.mockResolvedValueOnce(
        JSON.stringify({ ...restrictedTokenData, usageCount: 6 }),
      );
      mockRedis.ttl.mockResolvedValue(3600);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await service.validateAndUseToken(
        'restricted-token',
        '192.168.1.1',
      );

      expect(result.isValid).toBe(true);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.validateAndUseToken('token', '192.168.1.1');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Token validation failed');
    });
  });

  describe('revokeToken', () => {
    it('should revoke token successfully', async () => {
      mockRedis.del.mockResolvedValue(1);

      const result = await service.revokeToken(
        'token-to-revoke',
        'admin@example.com',
      );

      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalled();
    });

    it('should return false if token not found', async () => {
      mockRedis.del.mockResolvedValue(0);

      const result = await service.revokeToken(
        'non-existent-token',
        'admin@example.com',
      );

      expect(result).toBe(false);
    });

    it('should handle Redis errors', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));

      const result = await service.revokeToken('token', 'admin@example.com');

      expect(result).toBe(false);
    });
  });

  describe('listUserTokens', () => {
    it('should list user tokens', async () => {
      const tokenData1 = {
        hashedToken: 'hash1',
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: 'user@example.com',
        usageCount: 5,
        maxUsage: 100,
        reason: 'Emergency 1',
      };

      const tokenData2 = {
        hashedToken: 'hash2',
        expiresAt: new Date(Date.now() + 120000).toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: 'user@example.com',
        usageCount: 10,
        maxUsage: 50,
        reason: 'Emergency 2',
      };

      mockRedis.keys.mockResolvedValue([
        'bypass:token:hash1',
        'bypass:token:hash2',
      ]);
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(tokenData1))
        .mockResolvedValueOnce(JSON.stringify(tokenData2));

      const tokens = await service.listUserTokens('user@example.com');

      expect(tokens).toHaveLength(2);
      expect(tokens[0].reason).toBe('Emergency 1');
      expect(tokens[1].reason).toBe('Emergency 2');
      // Ensure token field is not included
      expect((tokens[0] as any).token).toBeUndefined();
    });

    it('should filter out expired tokens', async () => {
      const expiredTokenData = {
        hashedToken: 'hash1',
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
        createdAt: new Date().toISOString(),
        createdBy: 'user@example.com',
        usageCount: 5,
        maxUsage: 100,
        reason: 'Expired',
      };

      mockRedis.keys.mockResolvedValue(['bypass:token:hash1']);
      mockRedis.get.mockResolvedValue(JSON.stringify(expiredTokenData));

      const tokens = await service.listUserTokens('user@example.com');

      expect(tokens).toHaveLength(0);
    });

    it('should return empty array when Redis is unavailable', async () => {
      const serviceWithoutRedis = new BypassTokenService(null);

      const tokens =
        await serviceWithoutRedis.listUserTokens('user@example.com');

      expect(tokens).toEqual([]);
    });
  });

  describe('getTokenStats', () => {
    it('should return token statistics', async () => {
      const activeToken = {
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        usageCount: 10,
      };

      const expiredToken = {
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        usageCount: 5,
      };

      mockRedis.keys.mockResolvedValue(['bypass:token:1', 'bypass:token:2']);
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(activeToken))
        .mockResolvedValueOnce(JSON.stringify(expiredToken));

      const stats = await service.getTokenStats();

      expect(stats.activeTokens).toBe(1);
      expect(stats.expiredTokens).toBe(1);
      expect(stats.totalUsage).toBe(15); // 10 + 5
    });

    it('should return zero stats when Redis is unavailable', async () => {
      const serviceWithoutRedis = new BypassTokenService(null);

      const stats = await serviceWithoutRedis.getTokenStats();

      expect(stats.activeTokens).toBe(0);
      expect(stats.expiredTokens).toBe(0);
      expect(stats.totalUsage).toBe(0);
    });
  });

  describe('token security', () => {
    it('should generate unique tokens', async () => {
      mockRedis.setex.mockResolvedValue('OK');

      const request = {
        reason: 'Test',
        createdBy: 'admin@example.com',
      };

      const token1 = await service.createBypassToken(request);
      const token2 = await service.createBypassToken(request);

      expect(token1.token).not.toBe(token2.token);
      expect(token1.hashedToken).not.toBe(token2.hashedToken);
    });

    it('should hash tokens consistently', async () => {
      mockRedis.setex.mockResolvedValue('OK');

      const request = {
        reason: 'Test',
        createdBy: 'admin@example.com',
      };

      const token = await service.createBypassToken(request);

      // The same token should produce the same hash
      const service2 = new BypassTokenService(mockRedis);
      const hash1 = (service as any).hashToken(token.token);
      const hash2 = (service2 as any).hashToken(token.token);

      expect(hash1).toBe(hash2);
      expect(hash1).toBe(token.hashedToken);
    });
  });
});
