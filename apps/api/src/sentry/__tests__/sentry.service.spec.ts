import { Test, TestingModule } from '@nestjs/testing';
import { SentryService } from '../sentry.service';
import * as Sentry from '@sentry/nestjs';

// Mock the entire @sentry/nestjs module
jest.mock('@sentry/nestjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  setExtra: jest.fn(),
  setTag: jest.fn(),
  startSpan: jest.fn(),
  addBreadcrumb: jest.fn(),
  flush: jest.fn(),
  withScope: jest.fn().mockImplementation((callback: (scope: any) => void) => {
    callback({
      setTag: jest.fn(),
      setExtra: jest.fn(),
      setUser: jest.fn(),
    });
  }),
}));

describe('SentryService', () => {
  let service: SentryService;
  let mockSentry: jest.Mocked<typeof Sentry>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SentryService],
    }).compile();

    service = module.get<SentryService>(SentryService);
    mockSentry = Sentry as jest.Mocked<typeof Sentry>;

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('captureException', () => {
    it('should capture exception without context', () => {
      const error = new Error('Test error');

      void service.captureException(error);

      expect(mockSentry.captureException).toHaveBeenCalledWith(error);
      expect(mockSentry.withScope).not.toHaveBeenCalled();
    });

    it('should capture exception with context', () => {
      const error = new Error('Test error with context');
      const context = 'test-context';

      void service.captureException(error, context);

      expect(mockSentry.withScope).toHaveBeenCalled();
      expect(mockSentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should handle oil & gas specific errors', () => {
      const wellError = new Error('Well drilling failed');
      const context = 'well-operations';

      void service.captureException(wellError, context);

      expect(mockSentry.withScope).toHaveBeenCalled();
      expect(mockSentry.captureException).toHaveBeenCalledWith(wellError);
    });
  });

  describe('captureMessage', () => {
    it('should capture message without context', () => {
      const message = 'Test message';
      const level = 'info';

      service.captureMessage(message, level);

      expect(mockSentry.captureMessage).toHaveBeenCalledWith(message, level);
      expect(mockSentry.withScope).not.toHaveBeenCalled();
    });

    it('should capture message with default level', () => {
      const message = 'Test message with default level';

      service.captureMessage(message);

      expect(mockSentry.captureMessage).toHaveBeenCalledWith(message, 'info');
    });

    it('should capture message with context', () => {
      const message = 'Test message with context';
      const level = 'warning';
      const context = 'test-context';

      service.captureMessage(message, level, context);

      expect(mockSentry.withScope).toHaveBeenCalled();
      expect(mockSentry.captureMessage).toHaveBeenCalledWith(message, level);
    });

    it('should handle different severity levels', () => {
      const message = 'Test message';
      const levels = ['debug', 'info', 'warning', 'error', 'fatal'] as const;

      levels.forEach((level) => {
        service.captureMessage(message, level);
        expect(mockSentry.captureMessage).toHaveBeenCalledWith(message, level);
      });
    });
  });

  describe('setUser', () => {
    it('should set user context', () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
      };

      service.setUser(user);

      expect(mockSentry.setUser).toHaveBeenCalledWith(user);
    });

    it('should handle partial user data', () => {
      const partialUser = { id: '123' };

      service.setUser(partialUser);

      expect(mockSentry.setUser).toHaveBeenCalledWith(partialUser);
    });

    it('should handle operator user context', () => {
      const operatorUser = {
        id: 'op-456',
        email: 'operator@oilcompany.com',
        username: 'field-operator',
      };

      service.setUser(operatorUser);

      expect(mockSentry.setUser).toHaveBeenCalledWith(operatorUser);
    });
  });

  describe('setExtra', () => {
    it('should set extra context', () => {
      const key = 'requestId';
      const value = 'req-123';

      service.setExtra(key, value);

      expect(mockSentry.setExtra).toHaveBeenCalledWith(key, value);
    });

    it('should handle various value types', () => {
      const testCases = [
        ['stringValue', 'test'],
        ['numberValue', 123],
        ['booleanValue', true],
        ['objectValue', { nested: 'data' }],
        ['arrayValue', [1, 2, 3]],
      ];

      testCases.forEach(([key, value]) => {
        service.setExtra(key as string, value);
        expect(mockSentry.setExtra).toHaveBeenCalledWith(key, value);
      });
    });

    it('should handle oil & gas specific context', () => {
      const wellContext = {
        wellId: 'well-123',
        operatorId: 'op-456',
        location: { lat: 32.7767, lng: -96.797 },
        status: 'PRODUCING',
      };

      service.setExtra('wellContext', wellContext);

      expect(mockSentry.setExtra).toHaveBeenCalledWith(
        'wellContext',
        wellContext,
      );
    });
  });

  describe('setTag', () => {
    it('should set tag', () => {
      const key = 'component';
      const value = 'api';

      service.setTag(key, value);

      expect(mockSentry.setTag).toHaveBeenCalledWith(key, value);
    });

    it('should handle multiple tags', () => {
      const tags: [string, string][] = [
        ['component', 'api'],
        ['feature', 'wells'],
        ['version', '1.0.0'],
        ['environment', 'production'],
      ];

      tags.forEach(([key, value]) => {
        service.setTag(key, value);
        expect(mockSentry.setTag).toHaveBeenCalledWith(key, value);
      });
    });

    it('should handle regulatory compliance tags', () => {
      const complianceTags: [string, string][] = [
        ['regulation', 'EPA'],
        ['permit', 'EPA-123456'],
        ['inspector', 'inspector-789'],
        ['compliance-status', 'COMPLIANT'],
      ];

      complianceTags.forEach(([key, value]) => {
        service.setTag(key, value);
        expect(mockSentry.setTag).toHaveBeenCalledWith(key, value);
      });
    });
  });

  describe('startSpan', () => {
    it('should start span with callback', () => {
      const name = 'database.query';
      const op = 'db';
      const callback = jest.fn().mockReturnValue('result');
      const mockResult = 'span-result';

      mockSentry.startSpan.mockReturnValue(mockResult);

      const result = service.startSpan(name, op, callback);

      expect(mockSentry.startSpan).toHaveBeenCalledWith({ name, op }, callback);
      expect(result).toBe(mockResult);
    });

    it('should handle async operations', () => {
      const name = 'async.operation';
      const op = 'async';
      const callback = jest.fn().mockResolvedValue('async-result');

      service.startSpan(name, op, callback);

      expect(mockSentry.startSpan).toHaveBeenCalledWith({ name, op }, callback);
    });

    it('should handle oil & gas operations', () => {
      const operations = [
        ['well.drilling', 'drilling'],
        ['production.monitoring', 'monitoring'],
        ['compliance.check', 'compliance'],
        ['regulatory.report', 'reporting'],
      ];

      operations.forEach(([name, op]) => {
        const callback = () => ({ status: 'success' });
        service.startSpan(name!, op!, callback);
        expect(mockSentry.startSpan).toHaveBeenCalledWith(
          { name, op },
          callback,
        );
      });
    });
  });

  describe('addBreadcrumb', () => {
    it('should add breadcrumb', () => {
      const breadcrumb = {
        message: 'User clicked button',
        category: 'ui',
        level: 'info' as const,
      };

      service.addBreadcrumb(breadcrumb);

      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith(breadcrumb);
    });

    it('should handle various breadcrumb types', () => {
      const breadcrumbs = [
        {
          message: 'API request started',
          category: 'http',
          level: 'info' as const,
          data: { url: '/api/wells', method: 'GET' },
        },
        {
          message: 'Database query executed',
          category: 'query',
          level: 'debug' as const,
          data: { query: 'SELECT * FROM wells' },
        },
        {
          message: 'Error occurred',
          category: 'error',
          level: 'error' as const,
          data: { errorCode: 'WELL_NOT_FOUND' },
        },
      ];

      breadcrumbs.forEach((breadcrumb) => {
        service.addBreadcrumb(breadcrumb);
        expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith(breadcrumb);
      });
    });

    it('should handle oil & gas specific breadcrumbs', () => {
      const oilGasBreadcrumbs = [
        {
          message: 'Well status changed',
          category: 'well',
          level: 'info' as const,
          data: { wellId: 'well-123', from: 'DRILLING', to: 'PRODUCING' },
        },
        {
          message: 'Production data recorded',
          category: 'production',
          level: 'info' as const,
          data: { wellId: 'well-456', barrels: 150, date: '2024-01-01' },
        },
        {
          message: 'Compliance check completed',
          category: 'compliance',
          level: 'info' as const,
          data: {
            wellId: 'well-789',
            status: 'PASSED',
            inspector: 'inspector-123',
          },
        },
      ];

      oilGasBreadcrumbs.forEach((breadcrumb) => {
        service.addBreadcrumb(breadcrumb);
        expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith(breadcrumb);
      });
    });
  });

  describe('flush', () => {
    it('should flush events with default timeout', async () => {
      mockSentry.flush.mockResolvedValue(true);

      const result = await service.flush();

      expect(mockSentry.flush).toHaveBeenCalledWith(2000);
      expect(result).toBe(true);
    });

    it('should flush events with custom timeout', async () => {
      const customTimeout = 5000;
      mockSentry.flush.mockResolvedValue(true);

      const result = await service.flush(customTimeout);

      expect(mockSentry.flush).toHaveBeenCalledWith(customTimeout);
      expect(result).toBe(true);
    });

    it('should handle flush failures', async () => {
      mockSentry.flush.mockResolvedValue(false);

      const result = await service.flush();

      expect(result).toBe(false);
    });

    it('should handle flush errors', async () => {
      const error = new Error('Flush failed');
      mockSentry.flush.mockRejectedValue(error);

      await expect(service.flush()).rejects.toThrow('Flush failed');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete error tracking workflow', () => {
      const user = { id: 'op-123', email: 'operator@oilcompany.com' };
      const error = new Error('Well production failure');
      const context = 'production-monitoring';

      // Set user context
      service.setUser(user);

      // Add tags and extra context
      service.setTag('component', 'production');
      service.setExtra('wellId', 'well-456');

      // Add breadcrumb
      service.addBreadcrumb({
        message: 'Production monitoring started',
        category: 'monitoring',
        level: 'info',
      });

      // Capture exception
      void service.captureException(error, context);

      expect(mockSentry.setUser).toHaveBeenCalledWith(user);
      expect(mockSentry.setTag).toHaveBeenCalledWith('component', 'production');
      expect(mockSentry.setExtra).toHaveBeenCalledWith('wellId', 'well-456');
      expect(mockSentry.addBreadcrumb).toHaveBeenCalled();
      expect(mockSentry.captureException).toHaveBeenCalledWith(error);
    });

    it('should handle performance monitoring workflow', () => {
      const spanName = 'well.status.update';
      const operation = 'update';
      const callback = jest.fn().mockReturnValue({ success: true });

      // Start performance span
      service.startSpan(spanName, operation, callback);

      // Add breadcrumb for the operation
      service.addBreadcrumb({
        message: 'Well status update initiated',
        category: 'well',
        level: 'info',
        data: { wellId: 'well-789', newStatus: 'PRODUCING' },
      });

      expect(mockSentry.startSpan).toHaveBeenCalledWith(
        { name: spanName, op: operation },
        callback,
      );
      expect(mockSentry.addBreadcrumb).toHaveBeenCalled();
    });
  });
});
