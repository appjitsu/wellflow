import { Test, TestingModule } from '@nestjs/testing';
import { IPReputationService } from '../ip-reputation.service';
import { ExternalThreatIntelligenceService } from '../external-threat-intelligence';
import { Redis } from 'ioredis';

describe('IPReputationService', () => {
  let service: IPReputationService;
  let mockRedis: jest.Mocked<Redis>;
  let mockExternalThreatIntelligence: jest.Mocked<ExternalThreatIntelligenceService>;

  beforeEach(async () => {
    mockRedis = {
      zadd: jest.fn(),
      zremrangebyscore: jest.fn(),
      expire: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      zrangebyscore: jest.fn(),
    } as any;

    mockExternalThreatIntelligence = {
      hasAvailableServices: jest.fn().mockReturnValue(false),
      analyzeIP: jest.fn(),
      convertToReputationFactors: jest.fn().mockReturnValue([]),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IPReputationService,
        {
          provide: 'REDIS_CONNECTION',
          useValue: mockRedis,
        },
        {
          provide: ExternalThreatIntelligenceService,
          useValue: mockExternalThreatIntelligence,
        },
      ],
    }).compile();

    service = module.get<IPReputationService>(IPReputationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getIPReputation', () => {
    it('should return cached reputation if fresh', async () => {
      const cachedReputation = {
        ipAddress: '192.168.1.1',
        score: 25,
        riskLevel: 'low',
        factors: [],
        lastUpdated: new Date().toISOString(),
        firstSeen: new Date().toISOString(),
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(cachedReputation));

      const result = await service.getIPReputation('192.168.1.1');

      expect(result.score).toBe(25);
      expect(result.riskLevel).toBe('low');
    });

    it('should calculate new reputation if not cached', async () => {
      mockRedis.get.mockResolvedValue(null); // No cached data
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.set.mockResolvedValue('OK');

      const result = await service.getIPReputation('192.168.1.1');

      expect(result).toBeDefined();
      expect(result.ipAddress).toBe('192.168.1.1');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.getIPReputation('192.168.1.1');

      expect(result.score).toBe(50); // Default neutral score
      expect(result.riskLevel).toBe('medium');
    });
  });

  describe('updateIPReputation', () => {
    it('should record request activity', async () => {
      mockRedis.zadd.mockResolvedValue(1);
      mockRedis.zremrangebyscore.mockResolvedValue(0);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.del.mockResolvedValue(1);

      await service.updateIPReputation('192.168.1.1', {
        type: 'request',
        endpoint: '/api/test',
        userAgent: 'Mozilla/5.0',
        statusCode: 200,
      });

      expect(mockRedis.zadd).toHaveBeenCalled();
      expect(mockRedis.expire).toHaveBeenCalled();
    });

    it('should record authentication failures', async () => {
      mockRedis.zadd.mockResolvedValue(1);
      mockRedis.zremrangebyscore.mockResolvedValue(0);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.del.mockResolvedValue(1);

      await service.updateIPReputation('192.168.1.1', {
        type: 'auth_failure',
        endpoint: '/auth/login',
        userAgent: 'Mozilla/5.0',
        statusCode: 401,
      });

      expect(mockRedis.zadd).toHaveBeenCalled();
    });

    it('should handle Redis unavailability', async () => {
      const serviceWithoutRedis = new IPReputationService(
        null,
        mockExternalThreatIntelligence,
      );

      // Should not throw error
      await expect(
        serviceWithoutRedis.updateIPReputation('192.168.1.1', {
          type: 'request',
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('shouldBlockIP', () => {
    it('should block IP with critical reputation', async () => {
      // Mock all Redis calls in order:
      // 1. getCachedReputation - return null (no cached data)
      mockRedis.get.mockResolvedValueOnce(null);
      // 2. checkWhitelist - return null (not whitelisted)
      mockRedis.get.mockResolvedValueOnce(null);
      // 3. checkBlacklist - return blacklist data (this gives +40 impact)
      mockRedis.get.mockResolvedValueOnce(
        JSON.stringify({
          reason: 'Malicious activity',
          addedBy: 'admin',
          addedAt: new Date().toISOString(),
        }),
      );
      // 4. analyzeBehaviorPatterns - return empty activities
      mockRedis.zrangebyscore.mockResolvedValueOnce([]);
      // 5. getFirstSeenDate - return null (will use current date)
      mockRedis.get.mockResolvedValueOnce(null);
      // 6. cacheReputation - cache the result
      mockRedis.setex.mockResolvedValueOnce('OK');

      const result = await service.shouldBlockIP('192.168.1.1');

      expect(result.shouldBlock).toBe(true);
      expect(result.reason).toContain('Critical reputation score');
    });

    it('should not block IP with low reputation', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.set.mockResolvedValue('OK');

      const result = await service.shouldBlockIP('192.168.1.1');

      expect(result.shouldBlock).toBe(false);
      expect(result.reputation.riskLevel).toBe('medium'); // Default neutral
    });
  });

  describe('getRateLimitMultiplier', () => {
    it('should return correct multiplier for each risk level', () => {
      const criticalReputation = {
        ipAddress: '192.168.1.1',
        score: 90,
        riskLevel: 'critical' as const,
        factors: [],
        lastUpdated: new Date(),
        firstSeen: new Date(),
      };

      const highReputation = {
        ...criticalReputation,
        riskLevel: 'high' as const,
      };
      const mediumReputation = {
        ...criticalReputation,
        riskLevel: 'medium' as const,
      };
      const lowReputation = {
        ...criticalReputation,
        riskLevel: 'low' as const,
      };

      expect(service.getRateLimitMultiplier(criticalReputation)).toBe(0.1);
      expect(service.getRateLimitMultiplier(highReputation)).toBe(0.3);
      expect(service.getRateLimitMultiplier(mediumReputation)).toBe(0.7);
      expect(service.getRateLimitMultiplier(lowReputation)).toBe(1.0);
    });
  });

  describe('whitelistIP', () => {
    it('should whitelist IP successfully', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.del.mockResolvedValue(1);

      await service.whitelistIP(
        '192.168.1.1',
        'Trusted source',
        'admin@example.com',
      );

      expect(mockRedis.set).toHaveBeenCalledWith(
        'ip:whitelist:192.168.1.1',
        expect.stringContaining('Trusted source'),
      );
    });

    it('should handle Redis errors', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis error'));

      // Should not throw
      await expect(
        service.whitelistIP('192.168.1.1', 'Trusted', 'admin'),
      ).resolves.not.toThrow();
    });
  });

  describe('blacklistIP', () => {
    it('should blacklist IP successfully', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.del.mockResolvedValue(1);

      await service.blacklistIP(
        '192.168.1.1',
        'Malicious activity',
        'admin@example.com',
      );

      expect(mockRedis.set).toHaveBeenCalledWith(
        'ip:blacklist:192.168.1.1',
        expect.stringContaining('Malicious activity'),
      );
    });
  });

  describe('getIPStats', () => {
    it('should return IP statistics', async () => {
      const highRiskReputation = {
        riskLevel: 'high',
        score: 75,
      };

      const lowRiskReputation = {
        riskLevel: 'low',
        score: 20,
      };

      mockRedis.keys
        .mockResolvedValueOnce(['ip:whitelist:1', 'ip:whitelist:2']) // 2 whitelisted
        .mockResolvedValueOnce(['ip:blacklist:1']) // 1 blacklisted
        .mockResolvedValueOnce(['ip:reputation:1', 'ip:reputation:2']); // 2 tracked

      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(highRiskReputation))
        .mockResolvedValueOnce(JSON.stringify(lowRiskReputation));

      const stats = await service.getIPStats();

      expect(stats.whitelistedIPs).toBe(2);
      expect(stats.blacklistedIPs).toBe(1);
      expect(stats.totalTrackedIPs).toBe(2);
      expect(stats.highRiskIPs).toBe(1);
    });

    it('should return zero stats when Redis is unavailable', async () => {
      const serviceWithoutRedis = new IPReputationService(
        null,
        mockExternalThreatIntelligence,
      );

      const stats = await serviceWithoutRedis.getIPStats();

      expect(stats.totalTrackedIPs).toBe(0);
      expect(stats.whitelistedIPs).toBe(0);
      expect(stats.blacklistedIPs).toBe(0);
      expect(stats.highRiskIPs).toBe(0);
    });
  });

  describe('behavior analysis', () => {
    it('should detect authentication failures', async () => {
      mockRedis.get.mockResolvedValue(null); // No cached reputation
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.set.mockResolvedValue('OK');

      // Mock activity data showing auth failures
      const authFailureActivities = Array(10)
        .fill(0)
        .map((_, i) =>
          JSON.stringify({
            type: 'auth_failure',
            timestamp: new Date(Date.now() - i * 1000).toISOString(),
          }),
        );

      mockRedis.zrangebyscore.mockResolvedValue(authFailureActivities);

      const reputation = await service.getIPReputation('192.168.1.1');

      expect(reputation.factors.some((f) => f.type === 'failed_auth')).toBe(
        true,
      );
      expect(reputation.score).toBeGreaterThan(50); // Should increase score due to failures
    });

    it('should detect rate limit violations', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.set.mockResolvedValue('OK');

      const rateLimitViolations = Array(5)
        .fill(0)
        .map((_, i) =>
          JSON.stringify({
            type: 'rate_limit_violation',
            timestamp: new Date(Date.now() - i * 1000).toISOString(),
          }),
        );

      mockRedis.zrangebyscore.mockResolvedValue(rateLimitViolations);

      const reputation = await service.getIPReputation('192.168.1.1');

      expect(
        reputation.factors.some((f) => f.type === 'rate_limit_violations'),
      ).toBe(true);
    });
  });

  describe('reputation scoring', () => {
    it('should calculate correct risk levels', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.set.mockResolvedValue('OK');

      // Test neutral case
      mockRedis.get.mockClear();
      mockRedis.get.mockResolvedValue(null);
      const neutralRep = await service.getIPReputation('192.168.1.1');
      expect(neutralRep.riskLevel).toBe('medium');

      // Test whitelist case
      mockRedis.get.mockClear();
      mockRedis.get.mockImplementation((key: string) => {
        if (key.startsWith('ip:whitelist:')) {
          return Promise.resolve(
            JSON.stringify({
              reason: 'Trusted',
              addedBy: 'admin',
              addedAt: new Date().toISOString(),
            }),
          );
        }
        return Promise.resolve(null);
      });
      const whitelistRep = await service.getIPReputation('192.168.1.2');
      expect(whitelistRep.riskLevel).toBe('low');

      // Test blacklist case
      mockRedis.get.mockClear();
      mockRedis.get.mockImplementation((key: string) => {
        if (key.startsWith('ip:blacklist:')) {
          return Promise.resolve(
            JSON.stringify({
              reason: 'Malicious',
              addedBy: 'admin',
              addedAt: new Date().toISOString(),
            }),
          );
        }
        return Promise.resolve(null);
      });
      const blacklistRep = await service.getIPReputation('192.168.1.3');
      expect(blacklistRep.riskLevel).toBe('critical');
    });
  });

  describe('error handling', () => {
    it('should handle malformed cached data', async () => {
      mockRedis.get.mockResolvedValue('invalid-json');

      const result = await service.getIPReputation('192.168.1.1');

      expect(result.score).toBe(50); // Should fall back to default
    });

    it('should handle Redis connection issues', async () => {
      mockRedis.get.mockRejectedValue(new Error('Connection failed'));

      const result = await service.getIPReputation('192.168.1.1');

      expect(result).toBeDefined();
      expect(result.ipAddress).toBe('192.168.1.1');
    });
  });
});
