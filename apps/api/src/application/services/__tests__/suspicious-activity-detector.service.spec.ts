import { Test, TestingModule } from '@nestjs/testing';
import { SuspiciousActivityDetectorService } from '../suspicious-activity-detector.service';
import { AuditLogService } from '../audit-log.service';
import { LoginAttemptContext } from '../suspicious-activity-detector.service';

/**
 * Unit Tests for SuspiciousActivityDetectorService
 *
 * Tests suspicious activity detection rules, risk assessment,
 * and integration with audit logging system.
 */
describe('SuspiciousActivityDetectorService', () => {
  let service: SuspiciousActivityDetectorService;
  let mockAuditLogService: jest.Mocked<AuditLogService>;

  const baseContext: LoginAttemptContext = {
    userId: 'user-123',
    email: 'user@example.com',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: new Date('2024-01-15T12:00:00Z'), // Normal time
    success: true,
  };

  beforeEach(async () => {
    mockAuditLogService = {
      logFailure: jest.fn(),
      logSuccess: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuspiciousActivityDetectorService,
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<SuspiciousActivityDetectorService>(
      SuspiciousActivityDetectorService,
    );

    // Mock the getRecentLoginHistory method
    jest.spyOn(service as any, 'getRecentLoginHistory').mockResolvedValue([]);
  });

  describe('analyzeLoginAttempt', () => {
    it('should return low risk for normal login attempt', async () => {
      const result = await service.analyzeLoginAttempt(baseContext);

      expect(result.isSuspicious).toBe(false);
      expect(result.riskLevel).toBe('LOW');
      expect(result.reasons).toHaveLength(0);
      expect(result.recommendedActions).toHaveLength(0);
    });

    it('should detect multiple failed attempts from same IP', async () => {
      // Mock recent failed attempts
      const failedAttempts = Array(6)
        .fill(null)
        .map(() => ({
          userId: 'user-123',
          email: baseContext.email,
          ipAddress: baseContext.ipAddress,
          userAgent: baseContext.userAgent,
          timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          success: false,
        }));

      jest
        .spyOn(service as any, 'getRecentLoginHistory')
        .mockResolvedValue(failedAttempts);

      const failedContext = { ...baseContext, success: false };
      const result = await service.analyzeLoginAttempt(failedContext);

      expect(result.isSuspicious).toBe(true);
      expect(result.riskLevel).toBe('HIGH');
      expect(result.reasons).toContain(
        '6 failed login attempts from same IP in 15 minutes',
      );
      expect(result.recommendedActions).toContain(
        'Consider IP-based rate limiting or temporary block',
      );
    });

    it('should detect brute force attempts (rapid succession)', async () => {
      // Mock rapid attempts
      const recentAttempts = Array(5)
        .fill(null)
        .map((_, i) => ({
          userId: 'user-123',
          email: baseContext.email,
          ipAddress: baseContext.ipAddress,
          userAgent: baseContext.userAgent,
          timestamp: new Date(Date.now() - i * 10 * 1000), // 10 seconds apart
          success: false,
        }));

      jest
        .spyOn(service as any, 'getRecentLoginHistory')
        .mockResolvedValue(recentAttempts);

      const result = await service.analyzeLoginAttempt(baseContext);

      expect(result.isSuspicious).toBe(true);
      expect(result.riskLevel).toBe('HIGH');
      expect(result.reasons).toContain('5 rapid login attempts in 1 minute');
      expect(result.recommendedActions).toContain(
        'Implement CAPTCHA or temporary delay',
      );
    });

    it('should detect unusual time access', async () => {
      // Create context for 2 AM (unusual time)
      const unusualTimeContext = {
        ...baseContext,
        timestamp: new Date('2024-01-15T02:00:00Z'),
      };

      const result = await service.analyzeLoginAttempt(unusualTimeContext);

      expect(result.isSuspicious).toBe(true);
      expect(result.riskLevel).toBe('MEDIUM');
      expect(result.reasons).toContain('Login attempt at unusual hour (2:00)');
      expect(result.recommendedActions).toContain(
        'Verify user identity through additional authentication',
      );
    });

    it('should detect successful login after multiple failures', async () => {
      // Mock recent failed attempts followed by success
      const recentFailures = Array(3)
        .fill(null)
        .map(() => ({
          userId: baseContext.userId,
          email: baseContext.email,
          ipAddress: baseContext.ipAddress,
          userAgent: baseContext.userAgent,
          timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
          success: false,
        }));

      jest
        .spyOn(service as any, 'getRecentLoginHistory')
        .mockResolvedValue(recentFailures);

      const result = await service.analyzeLoginAttempt(baseContext);

      expect(result.isSuspicious).toBe(true);
      expect(result.riskLevel).toBe('MEDIUM');
      expect(result.reasons).toContain(
        'Successful login after 3 failed attempts',
      );
      expect(result.recommendedActions).toContain(
        'Verify user identity and check for credential compromise',
      );
    });

    it('should combine multiple risk factors for higher risk level', async () => {
      // Mock multiple failed attempts at unusual time
      const recentFailures = Array(10)
        .fill(null)
        .map(() => ({
          userId: baseContext.userId,
          email: baseContext.email,
          ipAddress: baseContext.ipAddress,
          userAgent: baseContext.userAgent,
          timestamp: new Date(Date.now() - 30 * 1000),
          success: false,
        }));

      jest
        .spyOn(service as any, 'getRecentLoginHistory')
        .mockResolvedValue(recentFailures);

      const criticalContext = {
        ...baseContext,
        success: false,
        timestamp: new Date('2024-01-15T03:00:00Z'), // 3 AM
      };

      const result = await service.analyzeLoginAttempt(criticalContext);

      expect(result.isSuspicious).toBe(true);
      expect(result.riskLevel).toBe('CRITICAL');
      expect(result.reasons.length).toBeGreaterThan(1);
      expect(result.recommendedActions).toContain(
        'Immediate IP block and security team notification',
      );
    });

    it('should log suspicious activity to audit service', async () => {
      const recentFailures = Array(6)
        .fill(null)
        .map(() => ({
          userId: baseContext.userId,
          email: baseContext.email,
          ipAddress: baseContext.ipAddress,
          userAgent: baseContext.userAgent,
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          success: false,
        }));

      jest
        .spyOn(service as any, 'getRecentLoginHistory')
        .mockResolvedValue(recentFailures);

      const failedContext = { ...baseContext, success: false };
      await service.analyzeLoginAttempt(failedContext);

      expect(mockAuditLogService.logFailure).toHaveBeenCalledWith(
        'LOGIN',
        'USER',
        baseContext.userId,
        'Suspicious login activity detected',
        {},
        expect.objectContaining({
          businessContext: expect.objectContaining({
            riskLevel: 'HIGH',
          }),
        }),
      );
    });
  });

  describe('risk level determination', () => {
    it('should return LOW risk for single low-severity rule', async () => {
      const context = {
        ...baseContext,
        timestamp: new Date('2024-01-15T10:00:00Z'), // 10 AM
      };

      const result = await service.analyzeLoginAttempt(context);
      expect(result.riskLevel).toBe('LOW');
    });

    it('should return MEDIUM risk for medium-severity rules', async () => {
      // Mock rapid attempts (medium severity)
      const recentAttempts = Array(3)
        .fill(null)
        .map((_, i) => ({
          userId: 'user-123',
          email: baseContext.email,
          ipAddress: baseContext.ipAddress,
          userAgent: baseContext.userAgent,
          timestamp: new Date(Date.now() - i * 45 * 1000),
          success: false,
        }));

      jest
        .spyOn(service as any, 'getRecentLoginHistory')
        .mockResolvedValue(recentAttempts);

      const result = await service.analyzeLoginAttempt(baseContext);
      expect(result.riskLevel).toBe('MEDIUM');
    });

    it('should return HIGH risk for high-severity rules', async () => {
      const recentFailures = Array(6)
        .fill(null)
        .map(() => ({
          userId: baseContext.userId,
          email: baseContext.email,
          ipAddress: baseContext.ipAddress,
          userAgent: baseContext.userAgent,
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          success: false,
        }));

      jest
        .spyOn(service as any, 'getRecentLoginHistory')
        .mockResolvedValue(recentFailures);

      const failedContext = { ...baseContext, success: false };
      const result = await service.analyzeLoginAttempt(failedContext);
      expect(result.riskLevel).toBe('HIGH');
    });

    it('should return CRITICAL risk for multiple high-severity rules', async () => {
      const recentFailures = Array(10)
        .fill(null)
        .map(() => ({
          userId: baseContext.userId,
          email: baseContext.email,
          ipAddress: baseContext.ipAddress,
          userAgent: baseContext.userAgent,
          timestamp: new Date(Date.now() - 30 * 1000),
          success: false,
        }));

      jest
        .spyOn(service as any, 'getRecentLoginHistory')
        .mockResolvedValue(recentFailures);

      const criticalContext = {
        ...baseContext,
        success: false,
        timestamp: new Date('2024-01-15T02:30:00Z'),
      };

      const result = await service.analyzeLoginAttempt(criticalContext);
      expect(result.riskLevel).toBe('CRITICAL');
    });
  });

  describe('error handling', () => {
    it('should handle audit service errors gracefully', async () => {
      jest
        .spyOn(service as any, 'getRecentLoginHistory')
        .mockRejectedValue(new Error('Database error'));

      const result = await service.analyzeLoginAttempt(baseContext);

      expect(result.isSuspicious).toBe(false);
      expect(result.riskLevel).toBe('LOW');
      expect(result.reasons).toHaveLength(0);
    });

    it('should handle invalid context data', async () => {
      const invalidContext = {
        ...baseContext,
        userId: '',
        ipAddress: 'invalid-ip',
      };

      const result = await service.analyzeLoginAttempt(invalidContext);

      expect(result).toBeDefined();
      expect(result.riskLevel).toBeDefined();
    });
  });
});
