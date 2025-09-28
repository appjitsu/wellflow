import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AlertService, AlertRule, NotificationChannel } from '../alert.service';

describe('AlertService', () => {
  let service: AlertService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        ALERT_RATE_LIMIT_PER_MINUTE: 10,
        ALERT_COOLDOWN_MINUTES: 5,
        SLACK_WEBHOOK_URL: 'https://hooks.slack.com/test',
        ALERT_EMAIL_RECIPIENTS: ['test@example.com'],
        EXTERNAL_MONITORING_WEBHOOK: 'https://external.example.com/webhook',
      };
      // eslint-disable-next-line security/detect-object-injection
      return (config as Record<string, unknown>)[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AlertService>(AlertService);

    // Clear all alerts and rules before each test
    (service as any).alerts.clear();
    (service as any).alertRules.clear();
    (service as any).notificationChannels.clear();
    (service as any).alertCooldowns.clear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAlert', () => {
    it('should create and store an alert', async () => {
      const alertData = {
        type: 'PERFORMANCE' as const,
        severity: 'HIGH' as const,
        title: 'Test Alert',
        message: 'This is a test alert',
        metadata: { test: true },
      };

      const alert = await service.createAlert(alertData);

      expect(alert).toBeDefined();
      expect(alert.id).toBeDefined();
      expect(alert.type).toBe('PERFORMANCE');
      expect(alert.severity).toBe('HIGH');
      expect(alert.title).toBe('Test Alert');
      expect(alert.message).toBe('This is a test alert');
      expect(alert.metadata).toEqual({ test: true });
      expect(alert.timestamp).toBeInstanceOf(Date);
      expect(alert.resolved).toBeUndefined();
    });

    it('should send notifications when alert is created', async () => {
      // Add a test webhook channel
      service.addNotificationChannel({
        id: 'test-webhook',
        type: 'WEBHOOK',
        name: 'Test Webhook',
        config: {
          url: 'https://test.example.com/webhook',
          notifyOnResolution: true,
        },
        enabled: true,
      });

      const alertData = {
        type: 'ERROR' as const,
        severity: 'CRITICAL' as const,
        title: 'Critical Error',
        message: 'System is down',
      };

      // Mock fetch for webhook notifications
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });

      const alert = await service.createAlert(alertData);

      expect(alert).toBeDefined();
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should respect cooldown period for duplicate alerts', async () => {
      const alertData = {
        type: 'PERFORMANCE' as const,
        severity: 'HIGH' as const,
        title: 'Slow Query',
        message: 'Query is slow',
      };

      // Create first alert
      await service.createAlert(alertData);

      // Try to create the same alert immediately (should be suppressed)
      const secondAlert = await service.createAlert(alertData);

      // Should still return an alert object but it won't be processed
      expect(secondAlert).toBeDefined();
      expect(secondAlert.title).toBe('Slow Query');
    });
  });

  describe('resolveAlert', () => {
    it('should resolve an existing alert', async () => {
      const alertData = {
        type: 'SYSTEM' as const,
        severity: 'MEDIUM' as const,
        title: 'System Warning',
        message: 'Disk space low',
      };

      const alert = await service.createAlert(alertData);
      const resolved = await service.resolveAlert(alert.id);

      expect(resolved).toBe(true);

      const activeAlerts = service.getActiveAlerts();
      expect(activeAlerts).toHaveLength(0);
    });

    it('should return false for non-existent alert', async () => {
      const resolved = await service.resolveAlert('non-existent-id');
      expect(resolved).toBe(false);
    });
  });

  describe('evaluateRules', () => {
    it('should trigger alerts when conditions are met', async () => {
      const rule: AlertRule = {
        id: 'test-rule',
        name: 'Test Rule',
        condition: (metrics) => (metrics as any).errorRate > 0.05,
        alertTemplate: {
          type: 'ERROR',
          severity: 'HIGH',
          title: 'High Error Rate',
          message: 'Error rate exceeded threshold',
        },
        cooldownMinutes: 5,
        enabled: true,
      };

      service.addAlertRule(rule);

      const metrics = { errorRate: 0.08 }; // Above threshold

      await service.evaluateRules(metrics);

      const activeAlerts = service.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);
      expect(activeAlerts[0]?.title).toBe('High Error Rate');
    });

    it('should not trigger alerts when conditions are not met', async () => {
      const rule: AlertRule = {
        id: 'test-rule',
        name: 'Test Rule',
        condition: (metrics) => (metrics as any).errorRate > 0.05,
        alertTemplate: {
          type: 'ERROR',
          severity: 'HIGH',
          title: 'High Error Rate',
          message: 'Error rate exceeded threshold',
        },
        cooldownMinutes: 5,
        enabled: true,
      };

      service.addAlertRule(rule);

      const metrics = { errorRate: 0.03 }; // Below threshold

      await service.evaluateRules(metrics);

      const activeAlerts = service.getActiveAlerts();
      expect(activeAlerts).toHaveLength(0);
    });

    it('should skip disabled rules', async () => {
      const rule: AlertRule = {
        id: 'disabled-rule',
        name: 'Disabled Rule',
        condition: () => true,
        alertTemplate: {
          type: 'SYSTEM',
          severity: 'LOW',
          title: 'Disabled Alert',
          message: 'This should not trigger',
        },
        cooldownMinutes: 5,
        enabled: false, // Disabled
      };

      service.addAlertRule(rule);

      const metrics = { anyValue: 100 };

      await service.evaluateRules(metrics);

      const activeAlerts = service.getActiveAlerts();
      expect(activeAlerts).toHaveLength(0);
    });
  });

  describe('addNotificationChannel', () => {
    it('should add a notification channel', () => {
      const channel: NotificationChannel = {
        id: 'test-channel',
        type: 'WEBHOOK',
        name: 'Test Webhook',
        config: { url: 'https://test.example.com' },
        enabled: true,
      };

      service.addNotificationChannel(channel);

      // Verify channel was added (channels are private, so we test indirectly)
      expect(() => service.addNotificationChannel(channel)).not.toThrow();
    });
  });

  describe('getActiveAlerts', () => {
    it('should return only unresolved alerts', async () => {
      // Create two alerts
      await service.createAlert({
        type: 'SYSTEM',
        severity: 'HIGH',
        title: 'Alert 1',
        message: 'First alert',
      });

      const alert2 = await service.createAlert({
        type: 'SYSTEM',
        severity: 'HIGH',
        title: 'Alert 2',
        message: 'Second alert',
      });

      // Resolve one
      await service.resolveAlert(alert2.id);

      const activeAlerts = service.getActiveAlerts();
      expect(activeAlerts).toHaveLength(1);
      expect(activeAlerts[0]?.title).toBe('Alert 1');
    });
  });

  describe('getAlertHistory', () => {
    it('should return alerts sorted by timestamp descending', async () => {
      // Create alerts with a small delay to ensure different timestamps
      await service.createAlert({
        type: 'SYSTEM',
        severity: 'LOW',
        title: 'First Alert',
        message: 'First',
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await service.createAlert({
        type: 'SYSTEM',
        severity: 'LOW',
        title: 'Second Alert',
        message: 'Second',
      });

      const history = service.getAlertHistory();

      expect(history).toHaveLength(2);
      expect(history[0]?.title).toBe('Second Alert'); // Most recent first
      expect(history[1]?.title).toBe('First Alert');
    });

    it('should limit results when specified', async () => {
      // Create multiple alerts
      for (let i = 0; i < 5; i++) {
        await service.createAlert({
          type: 'SYSTEM',
          severity: 'LOW',
          title: `Alert ${i}`,
          message: `Message ${i}`,
        });
      }

      const history = service.getAlertHistory(3);
      expect(history).toHaveLength(3);
    });
  });

  describe('default rules', () => {
    it('should initialize with default alert rules', async () => {
      // Create a fresh service instance to ensure default rules are initialized
      const freshModule: TestingModule = await Test.createTestingModule({
        providers: [
          AlertService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const freshService = freshModule.get<AlertService>(AlertService);

      // We can't directly access private alertRules, but we can test by triggering them
      const metrics = { executionTime: 6000 }; // Above critical threshold

      // This should trigger the slow-query-critical rule
      await freshService.evaluateRules(metrics);

      const activeAlerts = freshService.getActiveAlerts();
      expect(
        activeAlerts.some(
          (alert) => alert.title === 'Critical Slow Query Detected',
        ),
      ).toBe(true);
    });
  });

  describe('default channels', () => {
    it('should initialize with default notification channels', async () => {
      // Create a fresh service instance to ensure default channels are initialized
      const freshModule: TestingModule = await Test.createTestingModule({
        providers: [
          AlertService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const freshService = freshModule.get<AlertService>(AlertService);

      // Test that Slack channel is configured when webhook URL is provided
      const metrics = { executionTime: 6000 };
      await freshService.evaluateRules(metrics);

      // Should have created alerts (testing indirectly that channels exist)
      const activeAlerts = freshService.getActiveAlerts();
      expect(activeAlerts.length).toBeGreaterThan(0);
    });
  });
});
