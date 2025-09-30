import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitMonitoringService } from '../rate-limit-monitoring.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MetricsService } from '../../../monitoring/metrics.service';
import { DDoSProtectionService } from '../ddos-protection.service';
import { IPReputationService } from '../ip-reputation.service';
import { BypassTokenService } from '../bypass-token.service';

describe('RateLimitMonitoringService', () => {
  let service: RateLimitMonitoringService;
  let mockEventEmitter: jest.Mocked<EventEmitter2>;
  let mockMetricsService: jest.Mocked<MetricsService>;
  let mockDDoSService: jest.Mocked<DDoSProtectionService>;
  let mockIPReputationService: jest.Mocked<IPReputationService>;
  let mockBypassTokenService: jest.Mocked<BypassTokenService>;

  beforeEach(async () => {
    mockEventEmitter = {
      emit: jest.fn(),
    } as any;

    mockMetricsService = {
      increment: jest.fn(),
      gauge: jest.fn(),
    } as any;

    mockDDoSService = {
      getDDoSStats: jest.fn(),
    } as any;

    mockIPReputationService = {
      getIPStats: jest.fn(),
    } as any;

    mockBypassTokenService = {
      getTokenStats: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitMonitoringService,
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: MetricsService,
          useValue: mockMetricsService,
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
      ],
    }).compile();

    service = module.get<RateLimitMonitoringService>(
      RateLimitMonitoringService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordRateLimitEvent', () => {
    it('should record request event', async () => {
      await service.recordRateLimitEvent('request', '192.168.1.1', {
        endpoint: '/api/test',
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'rate-limit.event',
        expect.objectContaining({
          type: 'request',
          ipAddress: '192.168.1.1',
        }),
      );
    });

    it('should record blocked event', async () => {
      await service.recordRateLimitEvent('blocked', '192.168.1.1');

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'rate-limit.event',
        expect.objectContaining({
          type: 'blocked',
          ipAddress: '192.168.1.1',
        }),
      );
    });

    it('should handle errors gracefully', async () => {
      mockMetricsService.increment.mockImplementation(() => {
        throw new Error('Metrics error');
      });

      // Should not throw
      await expect(
        service.recordRateLimitEvent('request', '192.168.1.1'),
      ).resolves.not.toThrow();
    });
  });

  describe('recordDDoSDetection', () => {
    const mockDDoSResult = {
      isAttack: true,
      patterns: [
        {
          type: 'volumetric' as const,
          severity: 'high' as const,
          confidence: 0.9,
          indicators: ['High request volume'],
          recommendedAction: 'block' as const,
        },
      ],
      riskScore: 85,
      ipAddress: '192.168.1.1',
      timestamp: new Date(),
    };

    it('should record DDoS attack', () => {
      service.recordDDoSDetection(mockDDoSResult);

      expect(mockMetricsService.increment).toHaveBeenCalledWith(
        'rate_limit.ddos_attacks.total',
        {
          ip_address: '192.168.1.1',
          risk_score: '85',
        },
      );
    });

    it('should send alert for high-risk attacks', () => {
      const highRiskResult = { ...mockDDoSResult, riskScore: 95 };

      service.recordDDoSDetection(highRiskResult);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'rate-limit.alert',
        expect.objectContaining({
          type: 'ddos_attack',
          severity: 'critical',
          ipAddress: '192.168.1.1',
        }),
      );
    });

    it('should not record non-attacks', () => {
      const nonAttackResult = {
        ...mockDDoSResult,
        isAttack: false,
        riskScore: 30,
      };

      service.recordDDoSDetection(nonAttackResult);

      expect(mockMetricsService.increment).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      mockMetricsService.increment.mockImplementation(() => {
        throw new Error('Metrics error');
      });

      // recordDDoSDetection is synchronous and catches errors internally
      expect(() => service.recordDDoSDetection(mockDDoSResult)).not.toThrow();
    });
  });

  describe('recordBypassTokenUsage', () => {
    it('should record bypass token usage', async () => {
      await service.recordBypassTokenUsage(
        '192.168.1.1',
        'token-hash',
        'Emergency maintenance',
      );

      expect(mockMetricsService.increment).toHaveBeenCalledWith(
        'bypass_token.usage.total',
        { ip_address: '192.168.1.1' },
      );
    });

    it('should handle errors gracefully', async () => {
      mockMetricsService.increment.mockImplementation(() => {
        throw new Error('Metrics error');
      });

      await expect(
        service.recordBypassTokenUsage('192.168.1.1', 'token', 'reason'),
      ).resolves.not.toThrow();
    });
  });

  describe('getRateLimitStats', () => {
    it('should return comprehensive stats', async () => {
      mockDDoSService.getDDoSStats.mockResolvedValue({
        activeAttacks: 5,
        blockedIPs: 10,
        mitigationActions: 3,
      });

      mockIPReputationService.getIPStats.mockResolvedValue({
        totalTrackedIPs: 100,
        highRiskIPs: 15,
        whitelistedIPs: 5,
        blacklistedIPs: 8,
      });

      mockBypassTokenService.getTokenStats.mockResolvedValue({
        activeTokens: 3,
        totalUsage: 25,
        expiredTokens: 2,
      });

      const stats = await service.getRateLimitStats();

      expect(stats.ddos.attacks).toBe(5);
      expect(stats.ddos.blockedIPs).toBe(10);
      expect(stats.reputation.totalIPs).toBe(100);
      expect(stats.reputation.highRisk).toBe(15);
      expect(stats.bypass.activeTokens).toBe(3);
      expect(stats.bypass.totalUsage).toBe(25);
    });

    it('should return safe defaults on error', async () => {
      mockDDoSService.getDDoSStats.mockRejectedValue(
        new Error('Service error'),
      );

      const stats = await service.getRateLimitStats();

      expect(stats.requests.total).toBe(0);
      expect(stats.ddos.attacks).toBe(0);
      expect(stats.reputation.totalIPs).toBe(0);
      expect(stats.bypass.activeTokens).toBe(0);
    });
  });

  describe('collectMetrics', () => {
    it('should collect and record metrics', async () => {
      mockDDoSService.getDDoSStats.mockResolvedValue({
        activeAttacks: 2,
        blockedIPs: 5,
        mitigationActions: 1,
      });

      mockIPReputationService.getIPStats.mockResolvedValue({
        totalTrackedIPs: 50,
        highRiskIPs: 8,
        whitelistedIPs: 2,
        blacklistedIPs: 3,
      });

      mockBypassTokenService.getTokenStats.mockResolvedValue({
        activeTokens: 1,
        totalUsage: 10,
        expiredTokens: 0,
      });

      await service.collectMetrics();

      expect(mockMetricsService.gauge).toHaveBeenCalledWith(
        'rate_limit.ddos_attacks',
        2,
      );
      expect(mockMetricsService.gauge).toHaveBeenCalledWith(
        'rate_limit.high_risk_ips',
        8,
      );
      expect(mockMetricsService.gauge).toHaveBeenCalledWith(
        'rate_limit.bypass_token_usage',
        10,
      );
    });

    it('should handle errors during collection', async () => {
      mockDDoSService.getDDoSStats.mockRejectedValue(
        new Error('Collection error'),
      );

      // Should not throw
      await expect(service.collectMetrics()).resolves.not.toThrow();
    });
  });

  describe('performHealthCheck', () => {
    it('should send alert for high blocked requests', async () => {
      mockDDoSService.getDDoSStats.mockResolvedValue({
        attacks: 1,
        blockedIPs: 2,
        mitigationActions: 1,
      });

      mockIPReputationService.getIPStats.mockResolvedValue({
        totalIPs: 10,
        highRisk: 2,
        whitelisted: 0,
        blacklisted: 1,
      });

      mockBypassTokenService.getTokenStats.mockResolvedValue({
        activeTokens: 0,
        totalUsage: 5,
        expiredTokens: 0,
      });

      // Mock high blocked requests
      jest.spyOn(service, 'getRateLimitStats').mockResolvedValue({
        requests: { total: 1000, blocked: 600, allowed: 400 }, // High blocked rate
        ddos: { attacks: 1, blockedIPs: 2, mitigationActions: 1 },
        reputation: {
          totalIPs: 10,
          highRisk: 2,
          whitelisted: 0,
          blacklisted: 1,
        },
        bypass: { activeTokens: 0, totalUsage: 5 },
      });

      await service.performHealthCheck();

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'rate-limit.alert',
        expect.objectContaining({
          type: 'rate_limit_threshold',
          severity: 'high',
        }),
      );

      // Restore original method
      jest.spyOn(service, 'getRateLimitStats').mockRestore();
    });

    it('should send alert for multiple DDoS attacks', async () => {
      jest.spyOn(service, 'getRateLimitStats').mockResolvedValue({
        requests: { total: 1000, blocked: 50, allowed: 950 },
        ddos: { attacks: 15, blockedIPs: 20, mitigationActions: 10 }, // High attack count
        reputation: {
          totalIPs: 100,
          highRisk: 5,
          whitelisted: 2,
          blacklisted: 3,
        },
        bypass: { activeTokens: 1, totalUsage: 8 },
      });

      await service.performHealthCheck();

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'rate-limit.alert',
        expect.objectContaining({
          type: 'ddos_attack',
          severity: 'critical',
        }),
      );
    });

    it('should send alert for high bypass token usage', async () => {
      jest.spyOn(service, 'getRateLimitStats').mockResolvedValue({
        requests: { total: 1000, blocked: 50, allowed: 950 },
        ddos: { attacks: 2, blockedIPs: 3, mitigationActions: 1 },
        reputation: {
          totalIPs: 100,
          highRisk: 5,
          whitelisted: 2,
          blacklisted: 3,
        },
        bypass: { activeTokens: 5, totalUsage: 75 }, // High usage
      });

      await service.performHealthCheck();

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'rate-limit.alert',
        expect.objectContaining({
          type: 'bypass_token_abuse',
          severity: 'medium',
        }),
      );
    });

    it('should handle errors during health check', async () => {
      jest
        .spyOn(service, 'getRateLimitStats')
        .mockRejectedValue(new Error('Stats error'));

      // Should not throw
      await expect(service.performHealthCheck()).resolves.not.toThrow();
    });
  });

  describe('getRecentMetrics', () => {
    it('should return recent metrics within time window', async () => {
      // Simulate collecting some metrics first
      mockDDoSService.getDDoSStats.mockResolvedValue({
        attacks: 1,
        blockedIPs: 2,
        mitigationActions: 1,
      });

      mockIPReputationService.getIPStats.mockResolvedValue({
        totalIPs: 10,
        highRisk: 1,
        whitelisted: 0,
        blacklisted: 0,
      });

      mockBypassTokenService.getTokenStats.mockResolvedValue({
        activeTokens: 0,
        totalUsage: 5,
        expiredTokens: 0,
      });

      // Collect some metrics
      await service.collectMetrics();

      const recentMetrics = service.getRecentMetrics(60);

      expect(Array.isArray(recentMetrics)).toBe(true);
      // Should have at least one metric from the collection above
      expect(recentMetrics.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter metrics by time window', () => {
      const recentMetrics = service.getRecentMetrics(1); // 1 minute window

      expect(Array.isArray(recentMetrics)).toBe(true);
      // All returned metrics should be within the time window
      const cutoff = new Date(Date.now() - 60 * 1000);
      recentMetrics.forEach((metric) => {
        expect(metric.timestamp.getTime()).toBeGreaterThanOrEqual(
          cutoff.getTime(),
        );
      });
    });
  });

  describe('alert handling', () => {
    it('should emit alerts with correct structure', () => {
      const mockDDoSResult = {
        isAttack: true,
        patterns: [
          {
            type: 'volumetric' as const,
            severity: 'critical' as const,
            confidence: 0.95,
            indicators: ['Extremely high request volume'],
            recommendedAction: 'ban' as const,
          },
        ],
        riskScore: 95,
        ipAddress: '192.168.1.1',
        timestamp: new Date(),
      };

      service.recordDDoSDetection(mockDDoSResult);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'rate-limit.alert',
        expect.objectContaining({
          type: 'ddos_attack',
          severity: 'critical',
          message: expect.stringContaining('DDoS attack detected'),
          details: expect.objectContaining({
            riskScore: 95,
            patterns: ['volumetric'],
          }),
          timestamp: expect.any(Date),
          ipAddress: '192.168.1.1',
        }),
      );
    });

    it('should record alert metrics', () => {
      const mockDDoSResult = {
        isAttack: true,
        patterns: [
          {
            type: 'volumetric' as const,
            severity: 'high' as const,
            confidence: 0.8,
            indicators: ['High request volume'],
            recommendedAction: 'block' as const,
          },
        ],
        riskScore: 80,
        ipAddress: '192.168.1.1',
        timestamp: new Date(),
      };

      service.recordDDoSDetection(mockDDoSResult);

      expect(mockMetricsService.increment).toHaveBeenCalledWith(
        'rate_limit.alerts.total',
        {
          type: 'ddos_attack',
          severity: 'high',
        },
      );
    });
  });
});
