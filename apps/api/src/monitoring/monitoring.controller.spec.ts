import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { SentryService } from '../sentry/sentry.service';
import { LogRocketService } from '../logrocket/logrocket.service';
import { MetricsService } from './metrics.service';
import { CircuitBreakerService } from '../common/resilience/circuit-breaker.service';
import { RetryService } from '../common/resilience/retry.service';
import { EnhancedEventBusService } from '../common/events/enhanced-event-bus.service';
import { DatabasePerformanceService } from '../infrastructure/database/database-performance.service';
import { AlertService } from '../infrastructure/monitoring/alert.service';

describe('MonitoringController', () => {
  let controller: MonitoringController;
  let sentryService: jest.Mocked<SentryService>;
  let logRocketService: jest.Mocked<LogRocketService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonitoringController],
      providers: [
        {
          provide: SentryService,
          useValue: {
            captureMessage: jest.fn(),
            setUser: jest.fn(),
          },
        },
        {
          provide: LogRocketService,
          useValue: {
            isReady: jest.fn().mockReturnValue(true),
            log: jest.fn(),
            track: jest.fn(),
            getSessionURL: jest
              .fn()
              .mockResolvedValue('https://app.logrocket.com/session/123'),
          },
        },
        {
          provide: MetricsService,
          useValue: {
            getSystemMetrics: jest.fn(),
          },
        },
        {
          provide: CircuitBreakerService,
          useValue: {
            getAllMetrics: jest.fn(),
            resetCircuitBreaker: jest.fn(),
          },
        },
        {
          provide: RetryService,
          useValue: {},
        },
        {
          provide: EnhancedEventBusService,
          useValue: {
            getEventMetrics: jest.fn(),
          },
        },
        {
          provide: DatabasePerformanceService,
          useValue: {
            getPerformanceMetrics: jest.fn(),
            getQueryPerformanceStats: jest.fn(),
            getSlowQueries: jest.fn(),
            getLockInfo: jest.fn(),
          },
        },
        {
          provide: AlertService,
          useValue: {
            getActiveAlerts: jest.fn(),
            getAlertHistory: jest.fn(),
            resolveAlert: jest.fn(),
            createAlert: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MonitoringController>(MonitoringController);
    sentryService = module.get(SentryService);
    logRocketService = module.get(LogRocketService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health status with active services', () => {
      const result = controller.getHealth();

      expect(result).toEqual({
        timestamp: expect.any(String),
        services: {
          sentry: {
            status: 'active',
            description: 'Error tracking and performance monitoring',
          },
          logRocket: {
            status: 'active',
            description: 'Session recording and API monitoring',
          },
        },
      });
      expect(logRocketService.isReady).toHaveBeenCalled();
    });

    it('should return health status with inactive LogRocket', () => {
      logRocketService.isReady.mockReturnValue(false);

      const result = controller.getHealth();

      expect(result.services.logRocket.status).toBe('inactive');
    });
  });

  describe('testError', () => {
    it('should throw error with default message', () => {
      expect(() => controller.testError()).toThrow(HttpException);
      expect(() => controller.testError()).toThrow(
        'Test API error for monitoring',
      );

      expect(logRocketService.log).toHaveBeenCalledWith(
        'About to throw test error',
        'warn',
        {
          requestedMessage: undefined,
          endpoint: '/monitoring/test-error',
        },
      );
    });

    it('should throw error with custom message', () => {
      const customMessage = 'Custom test error';

      expect(() => controller.testError({ message: customMessage })).toThrow(
        HttpException,
      );
      expect(() => controller.testError({ message: customMessage })).toThrow(
        customMessage,
      );

      expect(logRocketService.log).toHaveBeenCalledWith(
        'About to throw test error',
        'warn',
        {
          requestedMessage: customMessage,
          endpoint: '/monitoring/test-error',
        },
      );
    });

    it('should throw error with empty body', () => {
      expect(() => controller.testError({})).toThrow(HttpException);
      expect(() => controller.testError({})).toThrow(
        'Test API error for monitoring',
      );
    });
  });

  describe('testLog', () => {
    it('should log message with default level', () => {
      const body = { message: 'Test log message' };

      const result = controller.testLog(body);

      expect(logRocketService.log).toHaveBeenCalledWith(
        'Test log message',
        'info',
        {
          endpoint: '/monitoring/test-log',
          timestamp: expect.any(String),
        },
      );

      expect(sentryService.captureMessage).toHaveBeenCalledWith(
        'API Log: Test log message',
        'info',
        'TEST_LOG',
      );

      expect(result).toEqual({
        success: true,
        message: 'Log message sent to monitoring services',
        data: { message: 'Test log message', level: 'info' },
      });
    });

    it('should log message with custom level', () => {
      const body = { message: 'Test warning', level: 'warn' as const };

      const result = controller.testLog(body);

      expect(logRocketService.log).toHaveBeenCalledWith(
        'Test warning',
        'warn',
        {
          endpoint: '/monitoring/test-log',
          timestamp: expect.any(String),
        },
      );

      expect(sentryService.captureMessage).toHaveBeenCalledWith(
        'API Log: Test warning',
        'warning',
        'TEST_LOG',
      );

      expect(result.data.level).toBe('warn');
    });

    it('should handle error level correctly', () => {
      const body = { message: 'Test error', level: 'error' as const };

      controller.testLog(body);

      expect(sentryService.captureMessage).toHaveBeenCalledWith(
        'API Log: Test error',
        'error',
        'TEST_LOG',
      );
    });
  });

  describe('testTrack', () => {
    it('should track event without properties', () => {
      const body = { event: 'test_event' };

      const result = controller.testTrack(body);

      expect(logRocketService.track).toHaveBeenCalledWith('test_event', {
        endpoint: '/monitoring/test-track',
        timestamp: expect.any(String),
      });

      expect(result).toEqual({
        success: true,
        message: 'Event tracked successfully',
        data: { event: 'test_event', properties: {} },
      });
    });

    it('should track event with properties', () => {
      const body = {
        event: 'user_action',
        properties: { userId: '123', action: 'click' },
      };

      const result = controller.testTrack(body);

      expect(logRocketService.track).toHaveBeenCalledWith('user_action', {
        userId: '123',
        action: 'click',
        endpoint: '/monitoring/test-track',
        timestamp: expect.any(String),
      });

      expect(result.data.properties).toEqual({
        userId: '123',
        action: 'click',
      });
    });
  });

  describe('identifyUser', () => {
    it('should identify user with all fields', () => {
      const body = {
        userId: '123',
        email: 'test@example.com',
        username: 'testuser',
      };

      const result = controller.identifyUser(body);

      expect(sentryService.setUser).toHaveBeenCalledWith({
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
      });

      expect(result).toEqual({
        success: true,
        message: 'User identified in monitoring services',
        data: {
          userId: '123',
          email: 'test@example.com',
          username: 'testuser',
        },
      });
    });

    it('should identify user with minimal fields', () => {
      const body = { userId: '456' };

      const result = controller.identifyUser(body);

      expect(sentryService.setUser).toHaveBeenCalledWith({
        id: '456',
        email: undefined,
        username: undefined,
      });

      expect(result.data).toEqual({
        userId: '456',
        email: undefined,
        username: undefined,
      });
    });
  });

  describe('getSessionUrl', () => {
    it('should return session URL when LogRocket is ready', async () => {
      const result = await controller.getSessionUrl();

      expect(logRocketService.isReady).toHaveBeenCalled();
      expect(logRocketService.getSessionURL).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'LogRocket session URL retrieved',
        sessionURL: 'https://app.logrocket.com/session/123',
      });
    });

    it('should return error when LogRocket is not ready', async () => {
      logRocketService.isReady.mockReturnValue(false);

      const result = await controller.getSessionUrl();

      expect(logRocketService.isReady).toHaveBeenCalled();
      expect(logRocketService.getSessionURL).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'LogRocket is not initialized',
        sessionURL: null,
      });
    });
  });
});
