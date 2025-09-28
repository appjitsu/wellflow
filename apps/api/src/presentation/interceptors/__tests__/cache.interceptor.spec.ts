import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { CacheInterceptor } from '../cache.interceptor';

describe('CacheInterceptor', () => {
  let interceptor: CacheInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(() => {
    interceptor = new CacheInterceptor();

    mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(),
      getType: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    } as jest.Mocked<ExecutionContext>;

    mockCallHandler = {
      handle: jest.fn(),
    } as jest.Mocked<CallHandler>;

    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should pass through the request unchanged', (done) => {
      const mockResponse = { data: 'test response', timestamp: Date.now() };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(mockResponse));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (response: any) => {
          expect(response).toEqual(mockResponse);
          expect(response).toBe(mockResponse); // Same reference
          expect(mockCallHandler.handle).toHaveBeenCalled();
          done();
        },
      });
    });

    it('should pass through errors unchanged', (done) => {
      const mockError = new Error('Service unavailable');
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        throwError(() => mockError),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: (err: any) => {
          expect(err).toBe(mockError);
          expect(err.message).toBe('Service unavailable');
          done();
        },
      });
    });

    it('should handle different response types', () => {
      const testCases = [
        'string response',
        42,
        { object: 'response' },
        [1, 2, 3],
        null,
        undefined,
      ];

      testCases.forEach((response) => {
        (mockCallHandler.handle as jest.Mock).mockReturnValue(of(response));

        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe({
          next: (res: any) => {
            expect(res).toBe(response);
          },
        });
      });
    });
  });

  describe('basic functionality', () => {
    it('should be instantiable', () => {
      expect(interceptor).toBeDefined();
      expect(interceptor).toBeInstanceOf(CacheInterceptor);
    });

    it('should implement NestInterceptor interface', () => {
      expect(typeof interceptor.intercept).toBe('function');
      expect(interceptor.intercept).toHaveLength(2); // context and next
    });

    it('should not modify execution context', () => {
      const originalContext = { ...mockExecutionContext };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('response'));

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      // Context should remain unchanged
      expect(mockExecutionContext).toEqual(originalContext);
    });
  });

  describe('oil and gas specific scenarios', () => {
    it('should handle well data responses', (done) => {
      const wellData = {
        id: 'well-123',
        name: 'Permian Well #1',
        location: 'Permian Basin, TX',
        status: 'active',
        production: {
          oil: 150,
          gas: 200,
          water: 50,
        },
      };

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(wellData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (response: any) => {
          expect(response).toEqual(wellData);
          expect(response.production.oil).toBe(150);
          done();
        },
      });
    });

    it('should handle regulatory report responses', (done) => {
      const reportData = {
        reportId: 'report-456',
        type: 'environmental',
        period: 'Q1-2024',
        status: 'submitted',
        data: {
          emissions: 1200,
          violations: 0,
          compliance: '100%',
        },
      };

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(reportData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (response: any) => {
          expect(response).toEqual(reportData);
          expect(response.data.compliance).toBe('100%');
          done();
        },
      });
    });

    it('should handle production data responses', (done) => {
      const productionData = [
        { date: '2024-01-01', oil: 1500, gas: 2000 },
        { date: '2024-01-02', oil: 1480, gas: 1950 },
        { date: '2024-01-03', oil: 1520, gas: 2100 },
      ];

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(productionData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (response: any) => {
          expect(response).toEqual(productionData);
          expect(response).toHaveLength(3);
          expect(response[0].oil).toBe(1500);
          done();
        },
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty responses', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(''));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (response: any) => {
          expect(response).toBe('');
          done();
        },
      });
    });

    it('should handle large data responses', (done) => {
      const largeData = {
        wells: Array.from({ length: 1000 }, (_, i) => ({
          id: `well-${i}`,
          data: 'x'.repeat(1000), // 1KB per well
        })),
      };

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(largeData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (response: any) => {
          expect(response).toEqual(largeData);
          expect(response.wells).toHaveLength(1000);
          done();
        },
      });
    });

    it('should handle binary data responses', (done) => {
      const binaryData = Buffer.from('binary content');
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(binaryData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (response: any) => {
          expect(response).toBe(binaryData);
          expect(Buffer.isBuffer(response)).toBe(true);
          done();
        },
      });
    });
  });

  describe('error scenarios', () => {
    it('should handle HTTP errors', (done) => {
      const httpError = new Error('Not Found');
      (httpError as any).status = 404;
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        throwError(() => httpError),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: (err: any) => {
          expect(err).toBe(httpError);
          expect(err.status).toBe(404);
          done();
        },
      });
    });

    it('should handle validation errors', (done) => {
      const validationError = new Error('Validation failed');
      (validationError as any).errors = ['Field required', 'Invalid format'];
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        throwError(() => validationError),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: (err: any) => {
          expect(err).toBe(validationError);
          expect(err.errors).toContain('Field required');
          done();
        },
      });
    });

    it('should handle database errors', (done) => {
      const dbError = new Error('Connection timeout');
      (dbError as any).code = 'ETIMEDOUT';
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        throwError(() => dbError),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: (err: any) => {
          expect(err).toBe(dbError);
          expect(err.code).toBe('ETIMEDOUT');
          done();
        },
      });
    });
  });

  describe('future enhancement scenarios', () => {
    it('should be ready for Redis caching implementation', () => {
      // This test ensures the interceptor structure supports future caching
      expect(interceptor.intercept).toBeDefined();

      // When caching is added, it should check for cache headers or keys
      // For now, it just passes through
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('response'));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (response: any) => {
          expect(response).toBe('response');
        },
      });
    });

    it.skip('should support cache key generation from context', () => {
      // Future implementation might generate cache keys from request
      const mockHandler = jest.fn().mockReturnValue('getWells');
      const mockClass = jest.fn().mockReturnValue({ name: 'WellsController' });

      mockExecutionContext.getHandler = mockHandler;
      mockExecutionContext.getClass = mockClass;

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('response'));

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockHandler).toHaveBeenCalled();
      expect(mockClass).toHaveBeenCalled();
    });
  });
});
