import { Test, TestingModule } from '@nestjs/testing';
import { SentryService } from './sentry.service';

describe('SentryService (Simple)', () => {
  let service: SentryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SentryService],
    }).compile();

    service = module.get<SentryService>(SentryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('error tracking', () => {
    it('should have captureException method', () => {
      expect(service.captureException).toBeDefined();
      expect(typeof service.captureException).toBe('function');
    });

    it('should have captureMessage method', () => {
      expect(service.captureMessage).toBeDefined();
      expect(typeof service.captureMessage).toBe('function');
    });

    it('should capture exceptions without context', () => {
      const error = new Error('Test error');

      expect(() => service.captureException(error)).not.toThrow();
    });

    it('should capture exceptions with context', () => {
      const error = new Error('Test error with context');
      const context = 'test-context';

      expect(() => service.captureException(error, context)).not.toThrow();
    });

    it('should capture messages without context', () => {
      const message = 'Test message';

      expect(() => service.captureMessage(message)).not.toThrow();
    });

    it('should capture messages with level', () => {
      const message = 'Test message with level';
      const level = 'error';

      expect(() => service.captureMessage(message, level)).not.toThrow();
    });

    it('should capture messages with context', () => {
      const message = 'Test message with context';
      const level = 'info';
      const context = 'test-context';

      expect(() =>
        service.captureMessage(message, level, context),
      ).not.toThrow();
    });
  });

  describe('user context', () => {
    it('should have setUser method', () => {
      expect(service.setUser).toBeDefined();
      expect(typeof service.setUser).toBe('function');
    });

    it('should set user context', () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
      };

      expect(() => service.setUser(user)).not.toThrow();
    });

    it('should handle partial user data', () => {
      const partialUser = { id: '123' };

      expect(() => service.setUser(partialUser)).not.toThrow();
    });

    it('should handle minimal user data', () => {
      const minimalUser = { id: '123' };

      expect(() => service.setUser(minimalUser)).not.toThrow();
    });
  });

  describe('tags and context', () => {
    it('should have setTag method', () => {
      expect(service.setTag).toBeDefined();
      expect(typeof service.setTag).toBe('function');
    });

    it('should have setExtra method', () => {
      expect(service.setExtra).toBeDefined();
      expect(typeof service.setExtra).toBe('function');
    });

    it('should set tags', () => {
      expect(() => service.setTag('component', 'api')).not.toThrow();
      expect(() => service.setTag('feature', 'wells')).not.toThrow();
      expect(() => service.setTag('version', '1.0.0')).not.toThrow();
    });

    it('should set extra context', () => {
      expect(() => service.setExtra('requestId', 'req-123')).not.toThrow();
      expect(() => service.setExtra('operatorId', 'op-456')).not.toThrow();
      expect(() => service.setExtra('wellId', 'well-789')).not.toThrow();
    });

    it('should handle string tag values', () => {
      expect(() => service.setTag('stringTag', 'value')).not.toThrow();
    });

    it('should handle various extra values', () => {
      expect(() => service.setExtra('numberExtra', 123)).not.toThrow();
      expect(() => service.setExtra('stringExtra', 'value')).not.toThrow();
    });
  });

  describe('performance monitoring', () => {
    it('should have startSpan method', () => {
      expect(service.startSpan).toBeDefined();
      expect(typeof service.startSpan).toBe('function');
    });

    it('should start spans', () => {
      const spanName = 'database.query';
      const operation = 'db';
      const callback = () => 'test operation';

      expect(() =>
        service.startSpan(spanName, operation, callback),
      ).not.toThrow();
    });

    it('should handle span operations', () => {
      const spanName = 'api.wells.create';
      const operation = 'http';
      const callback = () => ({ result: 'success' });

      expect(() =>
        service.startSpan(spanName, operation, callback),
      ).not.toThrow();
    });

    it('should handle async span operations', () => {
      const spanName = 'async.operation';
      const operation = 'async';
      const callback = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return 'async result';
      };

      expect(() =>
        service.startSpan(spanName, operation, callback),
      ).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle various error types', () => {
      const stringError = new Error('String error');
      const typeError = new TypeError('Type error');
      const rangeError = new RangeError('Range error');

      expect(() => service.captureException(stringError)).not.toThrow();
      expect(() => service.captureException(typeError)).not.toThrow();
      expect(() => service.captureException(rangeError)).not.toThrow();
    });

    it('should handle errors with stack traces', () => {
      const error = new Error('Error with stack');
      error.stack = 'Error: Error with stack\n    at test.js:1:1';

      expect(() => service.captureException(error)).not.toThrow();
    });

    it('should handle errors without stack traces', () => {
      const error = new Error('Error without stack');
      delete error.stack;

      expect(() => service.captureException(error)).not.toThrow();
    });
  });

  describe('service integration', () => {
    it('should be injectable service', () => {
      expect(service).toBeInstanceOf(SentryService);
    });

    it('should have all required methods', () => {
      const requiredMethods = [
        'captureException',
        'captureMessage',
        'setUser',
        'setTag',
        'setExtra',
        'startSpan',
      ];

      requiredMethods.forEach((method) => {
        expect(service[method as keyof SentryService]).toBeDefined();
        expect(typeof service[method as keyof SentryService]).toBe('function');
      });
    });

    it('should be ready for error tracking', () => {
      expect(service.captureException).toBeDefined();
      expect(service.captureMessage).toBeDefined();
    });

    it('should be ready for context management', () => {
      expect(service.setUser).toBeDefined();
      expect(service.setTag).toBeDefined();
      expect(service.setExtra).toBeDefined();
    });

    it('should be ready for performance monitoring', () => {
      expect(service.startSpan).toBeDefined();
    });
  });

  describe('oil & gas industry integration', () => {
    it('should handle well-related errors', () => {
      const wellError = new Error('Well drilling failed');

      expect(() =>
        service.captureException(wellError, 'well-operations'),
      ).not.toThrow();
    });

    it('should handle operator context', () => {
      const operatorUser = {
        id: 'op-123',
        email: 'operator@oilcompany.com',
        role: 'operator',
      };

      expect(() => service.setUser(operatorUser)).not.toThrow();
    });

    it('should handle production monitoring', () => {
      const productionSpan = 'production.monitoring';
      const operation = 'monitoring';
      const callback = () => ({ barrels: 150, date: new Date() });

      expect(() =>
        service.startSpan(productionSpan, operation, callback),
      ).not.toThrow();
    });

    it('should handle regulatory compliance tracking', () => {
      expect(() => service.setTag('compliance', 'EPA')).not.toThrow();
      expect(() => service.setTag('regulation', 'OSHA')).not.toThrow();
      expect(() =>
        service.setExtra('permitNumber', 'EPA-123456'),
      ).not.toThrow();
    });

    it('should handle well status transitions', () => {
      const statusError = new Error('Invalid well status transition');

      expect(() =>
        service.captureException(statusError, 'well-status'),
      ).not.toThrow();
    });
  });

  describe('service health', () => {
    it('should be instantiable', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(SentryService);
    });

    it('should be ready for use', () => {
      expect(service).toBeDefined();
      expect(typeof service.captureException).toBe('function');
      expect(typeof service.captureMessage).toBe('function');
    });

    it('should handle all Sentry operations', () => {
      // Comprehensive readiness check
      expect(service.captureException).toBeDefined();
      expect(service.captureMessage).toBeDefined();
      expect(service.setUser).toBeDefined();
      expect(service.setTag).toBeDefined();
      expect(service.setExtra).toBeDefined();
      expect(service.startSpan).toBeDefined();
    });
  });
});
