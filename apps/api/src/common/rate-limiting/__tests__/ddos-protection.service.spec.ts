import { Test, TestingModule } from '@nestjs/testing';
import { DDoSProtectionService } from '../ddos-protection.service';
import { Redis } from 'ioredis';

describe('DDoSProtectionService', () => {
  let service: DDoSProtectionService;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(async () => {
    mockRedis = {
      zcount: jest.fn(),
      zadd: jest.fn(),
      expire: jest.fn(),
      zremrangebyscore: jest.fn(),
      exists: jest.fn(),
      keys: jest.fn(),
      setex: jest.fn(),
      get: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DDoSProtectionService,
        {
          provide: 'REDIS_CONNECTION',
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<DDoSProtectionService>(DDoSProtectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeRequest', () => {
    it('should detect volumetric attack', async () => {
      // Mock high request count
      mockRedis.zcount.mockResolvedValueOnce(150); // requests per minute
      mockRedis.zcount.mockResolvedValueOnce(2000); // requests per hour

      const result = await service.analyzeRequest(
        '192.168.1.1',
        '/api/test',
        'GET',
        'Mozilla/5.0',
        200,
        100,
      );

      expect(result.isAttack).toBe(true);
      expect(result.riskScore).toBeGreaterThan(50);
      expect(result.patterns).toHaveLength(1);
      expect(result.patterns[0].type).toBe('volumetric');
    });

    it('should detect protocol attack with suspicious user agent', async () => {
      mockRedis.zcount.mockResolvedValue(10); // Low request count

      const result = await service.analyzeRequest(
        '192.168.1.1',
        '/api/test',
        'GET',
        'sqlmap/1.0', // Suspicious user agent
        400,
        100,
      );

      expect(result.isAttack).toBe(false); // Single pattern might not trigger attack
      expect(result.patterns.length).toBeGreaterThan(0);
      expect(result.patterns[0].type).toBe('protocol');
    });

    it('should detect application layer attack', async () => {
      mockRedis.zcount.mockResolvedValueOnce(10); // Low general requests
      mockRedis.zcount.mockResolvedValueOnce(10); // Low general requests
      mockRedis.zcount.mockResolvedValueOnce(250); // High requests to specific endpoint

      const result = await service.analyzeRequest(
        '192.168.1.1',
        '/api/sensitive',
        'POST',
        'Mozilla/5.0',
        200,
        100,
      );

      expect(result.patterns.some((p) => p.type === 'application')).toBe(true);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.zcount.mockRejectedValue(new Error('Redis error'));

      const result = await service.analyzeRequest(
        '192.168.1.1',
        '/api/test',
        'GET',
        'Mozilla/5.0',
        200,
        100,
      );

      expect(result.isAttack).toBe(false);
      expect(result.patterns).toHaveLength(0);
      expect(result.riskScore).toBe(0);
    });
  });

  describe('applyMitigation', () => {
    it('should ban IP for critical risk score', async () => {
      const detectionResult = {
        isAttack: true,
        patterns: [
          {
            type: 'volumetric' as const,
            severity: 'critical' as const,
            confidence: 0.9,
            indicators: ['High request volume'],
            recommendedAction: 'ban' as const,
          },
        ],
        riskScore: 85,
        ipAddress: '192.168.1.1',
        timestamp: new Date(),
      };

      const actions = await service.applyMitigation(detectionResult);

      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe('ban');
      expect(actions[0].ipAddress).toBe('192.168.1.1');
      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it('should block IP for high risk score', async () => {
      const detectionResult = {
        isAttack: true,
        patterns: [
          {
            type: 'protocol' as const,
            severity: 'high' as const,
            confidence: 0.8,
            indicators: ['Suspicious patterns'],
            recommendedAction: 'block' as const,
          },
        ],
        riskScore: 70,
        ipAddress: '192.168.1.1',
        timestamp: new Date(),
      };

      const actions = await service.applyMitigation(detectionResult);

      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe('ip_block');
      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it('should apply rate limiting for medium risk score', async () => {
      const detectionResult = {
        isAttack: true,
        patterns: [
          {
            type: 'application' as const,
            severity: 'medium' as const,
            confidence: 0.6,
            indicators: ['Moderate suspicious activity'],
            recommendedAction: 'throttle' as const,
          },
        ],
        riskScore: 50,
        ipAddress: '192.168.1.1',
        timestamp: new Date(),
      };

      const actions = await service.applyMitigation(detectionResult);

      expect(actions).toHaveLength(1);
      expect(actions[0].type).toBe('rate_limit');
      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it('should not apply mitigation for non-attacks', async () => {
      const detectionResult = {
        isAttack: false,
        patterns: [],
        riskScore: 10,
        ipAddress: '192.168.1.1',
        timestamp: new Date(),
      };

      const actions = await service.applyMitigation(detectionResult);

      expect(actions).toHaveLength(0);
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });
  });

  describe('isIPBlocked', () => {
    it('should return true for blocked IP', async () => {
      mockRedis.exists.mockResolvedValue(1);

      const result = await service.isIPBlocked('192.168.1.1');

      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith('ddos:block:192.168.1.1');
    });

    it('should return false for non-blocked IP', async () => {
      mockRedis.exists.mockResolvedValue(0);

      const result = await service.isIPBlocked('192.168.1.1');

      expect(result).toBe(false);
    });

    it('should return false when Redis is unavailable', async () => {
      const serviceWithoutRedis = new DDoSProtectionService(null);

      const result = await serviceWithoutRedis.isIPBlocked('192.168.1.1');

      expect(result).toBe(false);
    });
  });

  describe('getDDoSStats', () => {
    it('should return DDoS statistics', async () => {
      mockRedis.keys
        .mockResolvedValueOnce(['ddos:block:ip1', 'ddos:block:ip2']) // 2 blocked IPs
        .mockResolvedValueOnce([
          'ddos:attack:1',
          'ddos:attack:2',
          'ddos:attack:3',
        ]) // 3 active attacks
        .mockResolvedValueOnce(['ddos:mitigation:1']); // 1 mitigation action

      const stats = await service.getDDoSStats();

      expect(stats.blockedIPs).toBe(2);
      expect(stats.activeAttacks).toBe(3);
      expect(stats.mitigationActions).toBe(1);
    });

    it('should return zero stats when Redis is unavailable', async () => {
      const serviceWithoutRedis = new DDoSProtectionService(null);

      const stats = await serviceWithoutRedis.getDDoSStats();

      expect(stats.blockedIPs).toBe(0);
      expect(stats.activeAttacks).toBe(0);
      expect(stats.mitigationActions).toBe(0);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.keys.mockRejectedValue(new Error('Redis error'));

      const stats = await service.getDDoSStats();

      expect(stats.blockedIPs).toBe(0);
      expect(stats.activeAttacks).toBe(0);
      expect(stats.mitigationActions).toBe(0);
    });
  });

  describe('behavioral pattern detection', () => {
    it('should detect scripted behavior', async () => {
      mockRedis.zcount.mockResolvedValue(10); // Low request count

      const result = await service.analyzeRequest(
        '192.168.1.1',
        '/api/test',
        'GET',
        'python-requests/2.25.1',
        200,
        100,
      );

      expect(result.patterns.some((p) => p.type === 'application')).toBe(true);
      expect(
        result.patterns.some((p) =>
          p.indicators.some((i) => i.includes('Scripted')),
        ),
      ).toBe(true);
    });

    it('should detect automation tools', async () => {
      mockRedis.zcount.mockResolvedValue(10); // Low request count

      const result = await service.analyzeRequest(
        '192.168.1.1',
        '/api/test',
        'GET',
        'HeadlessChrome/91.0.4472.124',
        200,
        100,
      );

      expect(result.patterns.some((p) => p.type === 'application')).toBe(true);
      expect(
        result.patterns.some((p) =>
          p.indicators.some((i) => i.includes('Automation')),
        ),
      ).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle missing user agent gracefully', async () => {
      mockRedis.zcount.mockResolvedValue(10);

      const result = await service.analyzeRequest(
        '192.168.1.1',
        '/api/test',
        'GET',
        '', // Empty user agent
        200,
        100,
      );

      expect(result).toBeDefined();
      expect(result.ipAddress).toBe('192.168.1.1');
    });

    it('should handle high response times', async () => {
      mockRedis.zcount.mockResolvedValue(10);

      const result = await service.analyzeRequest(
        '192.168.1.1',
        '/api/test',
        'GET',
        'Mozilla/5.0',
        200,
        6000, // 6 seconds - slow response
      );

      expect(
        result.patterns.some((p) =>
          p.indicators.some((i) => i.includes('Slow response')),
        ),
      ).toBe(true);
    });
  });
});
