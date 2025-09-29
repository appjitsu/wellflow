import { Test, TestingModule } from '@nestjs/testing';
import {
  EnhancedRateLimiterService,
  UserTier,
} from '../enhanced-rate-limiter.service';
import { DDoSProtectionService } from '../ddos-protection.service';
import { IPReputationService } from '../ip-reputation.service';
import { BypassTokenService } from '../bypass-token.service';
import { RateLimitMonitoringService } from '../rate-limit-monitoring.service';

describe('EnhancedRateLimiterService', () => {
  let service: EnhancedRateLimiterService;
  let mockDDoSService: jest.Mocked<DDoSProtectionService>;
  let mockIPReputationService: jest.Mocked<IPReputationService>;
  let mockBypassTokenService: jest.Mocked<BypassTokenService>;
  let mockMonitoringService: jest.Mocked<RateLimitMonitoringService>;

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    mget: jest.fn(),
    mset: jest.fn(),
    zcount: jest.fn(),
    zadd: jest.fn(),
    zremrangebyscore: jest.fn(),
  };

  beforeEach(async () => {
    mockDDoSService = {
      isIPBlocked: jest.fn(),
      analyzeRequest: jest.fn(),
      applyMitigation: jest.fn(),
    } as any;

    mockIPReputationService = {
      updateIPReputation: jest.fn(),
      getIPReputation: jest.fn(),
      getRateLimitMultiplier: jest.fn(),
      shouldBlockIP: jest.fn(),
    } as any;

    mockBypassTokenService = {
      validateAndUseToken: jest.fn(),
    } as any;

    mockMonitoringService = {
      recordBypassTokenUsage: jest.fn(),
      recordRateLimitEvent: jest.fn(),
      recordDDoSDetection: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnhancedRateLimiterService,
        {
          provide: 'REDIS_CONNECTION',
          useValue: mockRedis,
        },
        {
          provide: DDoSProtectionService,
          useValue: mockDDoSService,
        },
        {
          provide: IPReputationService,
          useValue: mockIPReputationService,
        },
        {
          provide: BypassTokenService,
          useValue: mockBypassTokenService,
        },
        {
          provide: RateLimitMonitoringService,
          useValue: mockMonitoringService,
        },
      ],
    }).compile();

    service = module.get<EnhancedRateLimiterService>(
      EnhancedRateLimiterService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkRateLimit with enhanced features', () => {
    beforeEach(() => {
      // Reset all mocks
      jest.clearAllMocks();

      // Default mock implementations
      mockDDoSService.isIPBlocked.mockResolvedValue(false);
      mockDDoSService.analyzeRequest.mockResolvedValue({
        isAttack: false,
        patterns: [],
        riskScore: 10,
        ipAddress: '192.168.1.1',
        timestamp: new Date(),
      });

      mockIPReputationService.getIPReputation.mockResolvedValue({
        ipAddress: '192.168.1.1',
        score: 50,
        riskLevel: 'medium',
        factors: [],
        lastUpdated: new Date(),
        firstSeen: new Date(),
      });

      mockIPReputationService.getRateLimitMultiplier.mockReturnValue(1.0);
      mockIPReputationService.shouldBlockIP.mockResolvedValue({
        shouldBlock: false,
        reason: '',
        reputation: {} as any,
      });

      mockBypassTokenService.validateAndUseToken.mockResolvedValue({
        isValid: false,
        reason: 'No token provided',
      });

      // Mock Redis operations
      mockRedis.zcount.mockResolvedValue(5);
      mockRedis.zadd.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
    });

    it('should allow request with valid bypass token', async () => {
      mockBypassTokenService.validateAndUseToken.mockResolvedValue({
        isValid: true,
        token: {
          hashedToken: 'hash',
          expiresAt: new Date(),
          createdAt: new Date(),
          createdBy: 'admin',
          usageCount: 1,
          maxUsage: 100,
          reason: 'Emergency',
        },
      });

      const result = await service.checkRateLimit(
        'user123',
        UserTier.FREE,
        '/api/test',
        'GET',
        '192.168.1.1',
        'Mozilla/5.0',
        'bypass-token',
      );

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(999999);
      expect(mockMonitoringService.recordBypassTokenUsage).toHaveBeenCalled();
    });

    it('should block request from blocked IP', async () => {
      mockDDoSService.isIPBlocked.mockResolvedValue(true);

      const result = await service.checkRateLimit(
        'user123',
        UserTier.FREE,
        '/api/test',
        'GET',
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBe(15 * 60); // 15 minutes
      expect(mockMonitoringService.recordRateLimitEvent).toHaveBeenCalledWith(
        'blocked',
        '192.168.1.1',
        { reason: 'IP blocked by DDoS protection' },
      );
    });

    it('should block request detected as DDoS attack', async () => {
      mockDDoSService.analyzeRequest.mockResolvedValue({
        isAttack: true,
        patterns: [
          {
            type: 'volumetric',
            severity: 'high',
            confidence: 0.9,
            indicators: ['High request volume'],
            recommendedAction: 'block',
          },
        ],
        riskScore: 85,
        ipAddress: '192.168.1.1',
        timestamp: new Date(),
      });

      const result = await service.checkRateLimit(
        'user123',
        UserTier.FREE,
        '/api/test',
        'GET',
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(result.allowed).toBe(false);
      expect(mockDDoSService.applyMitigation).toHaveBeenCalled();
      expect(mockMonitoringService.recordDDoSDetection).toHaveBeenCalled();
    });

    it('should block request from high-risk IP', async () => {
      mockIPReputationService.shouldBlockIP.mockResolvedValue({
        shouldBlock: true,
        reason: 'High risk IP',
        reputation: {
          ipAddress: '192.168.1.1',
          score: 85,
          riskLevel: 'critical',
          factors: [],
          lastUpdated: new Date(),
          firstSeen: new Date(),
        },
      });

      const result = await service.checkRateLimit(
        'user123',
        UserTier.FREE,
        '/api/test',
        'GET',
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBe(60 * 60); // 1 hour
    });

    it('should update IP reputation on request', async () => {
      await service.checkRateLimit(
        'user123',
        UserTier.FREE,
        '/api/test',
        'GET',
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(mockIPReputationService.updateIPReputation).toHaveBeenCalledWith(
        '192.168.1.1',
        {
          type: 'request',
          endpoint: '/api/test',
          userAgent: 'Mozilla/5.0',
          statusCode: 200,
        },
      );
    });

    it('should handle missing IP address gracefully', async () => {
      const result = await service.checkRateLimit(
        'user123',
        UserTier.FREE,
        '/api/test',
        'GET',
      );

      expect(result).toBeDefined();
      expect(mockDDoSService.isIPBlocked).not.toHaveBeenCalled();
      expect(mockIPReputationService.updateIPReputation).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      mockDDoSService.isIPBlocked.mockRejectedValue(new Error('Service error'));

      const result = await service.checkRateLimit(
        'user123',
        UserTier.FREE,
        '/api/test',
        'GET',
        '192.168.1.1',
        'Mozilla/5.0',
      );

      // Should still process the request despite service errors
      expect(result).toBeDefined();
    });
  });
});
