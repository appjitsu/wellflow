import { ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AuditInterceptor } from '../audit.interceptor';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: {
    method: string;
    url: string;
    user?: { id?: string };
  };

  beforeEach(() => {
    interceptor = new AuditInterceptor();

    mockRequest = {
      method: 'GET',
      url: '/api/wells',
      user: undefined,
    };

    mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
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
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('intercept', () => {
    it('should log successful API calls with user', (done) => {
      mockRequest.user = { id: 'user-123' };
      mockRequest.method = 'GET';
      mockRequest.url = '/api/wells';
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of('success response'),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (response) => {
          expect(response).toBe('success response');
          expect(Logger.prototype.log).toHaveBeenCalledWith(
            expect.stringContaining(
              'Audit: GET /api/wells - User: user-123 - Started at:',
            ),
          );
          expect(Logger.prototype.log).toHaveBeenCalledWith(
            'Audit: GET /api/wells - User: user-123 - Completed in: 0ms',
          );
          done();
        },
      });
    });

    it('should log API calls without user as anonymous', (done) => {
      mockRequest.user = undefined;
      mockRequest.method = 'POST';
      mockRequest.url = '/api/login';
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of('login response'),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: () => {
          expect(Logger.prototype.log).toHaveBeenCalledWith(
            expect.stringContaining(
              'Audit: POST /api/login - User: anonymous - Started at:',
            ),
          );
          expect(Logger.prototype.log).toHaveBeenCalledWith(
            'Audit: POST /api/login - User: anonymous - Completed in: 0ms',
          );
          done();
        },
      });
    });

    it('should handle errors and still log completion', (done) => {
      mockRequest.user = { id: 'user-456' };
      mockRequest.method = 'DELETE';
      mockRequest.url = '/api/wells/well-123';
      const error = new Error('Well not found');
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        throwError(() => error),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: (err) => {
          expect(err.message).toBe('Well not found');
          expect(Logger.prototype.log).toHaveBeenCalledWith(
            expect.stringContaining(
              'Audit: DELETE /api/wells/well-123 - User: user-456 - Started at:',
            ),
          );
          expect(Logger.prototype.log).toHaveBeenCalledWith(
            'Audit: DELETE /api/wells/well-123 - User: user-456 - Completed in: 0ms',
          );
          done();
        },
      });
    });

    it('should calculate duration correctly', (done) => {
      mockRequest.user = { id: 'user-789' };
      let callCount = 0;
      jest.spyOn(Date, 'now').mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 1000 : 1500; // 500ms duration
      });

      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('response'));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: () => {
          expect(Logger.prototype.log).toHaveBeenCalledWith(
            'Audit: GET /api/wells - User: user-789 - Completed in: 500ms',
          );
          done();
        },
      });
    });
  });

  describe('oil and gas specific scenarios', () => {
    it('should log well creation audit', (done) => {
      mockRequest.user = { id: 'operator-123' };
      mockRequest.method = 'POST';
      mockRequest.url = '/api/wells';
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of({ id: 'well-123' }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: () => {
          expect(Logger.prototype.log).toHaveBeenCalledWith(
            expect.stringContaining(
              'Audit: POST /api/wells - User: operator-123 - Started at:',
            ),
          );
          done();
        },
      });
    });

    it('should log regulatory inspection audit', (done) => {
      mockRequest.user = { id: 'regulator-456' };
      mockRequest.method = 'GET';
      mockRequest.url = '/api/wells/well-123/inspection';
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of({ status: 'PASSED' }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: () => {
          expect(Logger.prototype.log).toHaveBeenCalledWith(
            expect.stringContaining(
              'Audit: GET /api/wells/well-123/inspection - User: regulator-456 - Started at:',
            ),
          );
          done();
        },
      });
    });

    it('should log production data update audit', (done) => {
      mockRequest.user = { id: 'field-supervisor-789' };
      mockRequest.method = 'PUT';
      mockRequest.url = '/api/wells/well-456/production';
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of({ updated: true }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: () => {
          expect(Logger.prototype.log).toHaveBeenCalledWith(
            expect.stringContaining(
              'Audit: PUT /api/wells/well-456/production - User: field-supervisor-789 - Started at:',
            ),
          );
          done();
        },
      });
    });
  });

  describe('edge cases', () => {
    it('should handle user with undefined id', (done) => {
      mockRequest.user = { id: undefined };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('response'));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: () => {
          expect(Logger.prototype.log).toHaveBeenCalledWith(
            expect.stringContaining(
              'Audit: GET /api/wells - User: anonymous - Started at:',
            ),
          );
          done();
        },
      });
    });

    it('should handle user with null id', (done) => {
      mockRequest.user = { id: null as any };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('response'));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: () => {
          expect(Logger.prototype.log).toHaveBeenCalledWith(
            expect.stringContaining(
              'Audit: GET /api/wells - User: anonymous - Started at:',
            ),
          );
          done();
        },
      });
    });

    it('should handle special characters in URLs', (done) => {
      mockRequest.url =
        '/api/wells/well-123?filter=status:active&sort=created_at';
      mockRequest.user = { id: 'user-123' };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('response'));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: () => {
          expect(Logger.prototype.log).toHaveBeenCalledWith(
            expect.stringContaining(
              'Audit: GET /api/wells/well-123?filter=status:active&sort=created_at - User: user-123 - Started at:',
            ),
          );
          done();
        },
      });
    });

    it('should handle long execution times', (done) => {
      let callCount = 0;
      jest.spyOn(Date, 'now').mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 1000 : 65000; // 64 seconds
      });

      mockRequest.user = { id: 'user-123' };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('response'));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: () => {
          expect(Logger.prototype.log).toHaveBeenCalledWith(
            'Audit: GET /api/wells - User: user-123 - Completed in: 64000ms',
          );
          done();
        },
      });
    });
  });

  describe('interceptor behavior', () => {
    it('should not modify the response', (done) => {
      const originalResponse = { data: 'test', count: 5 };
      mockRequest.user = { id: 'user-123' };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of(originalResponse),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (response) => {
          expect(response).toEqual(originalResponse);
          expect(response).toBe(originalResponse); // Same reference
          done();
        },
      });
    });

    it('should pass through errors unchanged', (done) => {
      const originalError = new Error('Database connection failed');
      mockRequest.user = { id: 'user-123' };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        throwError(() => originalError),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: (err) => {
          expect(err).toBe(originalError);
          expect(err.message).toBe('Database connection failed');
          done();
        },
      });
    });

    it('should work with different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      methods.forEach((method) => {
        mockRequest.method = method;
        mockRequest.user = { id: 'user-123' };
        (mockCallHandler.handle as jest.Mock).mockReturnValue(of('response'));

        const result = interceptor.intercept(
          mockExecutionContext,
          mockCallHandler,
        );

        result.subscribe({
          next: () => {
            expect(Logger.prototype.log).toHaveBeenCalledWith(
              expect.stringContaining(
                `Audit: ${method} /api/wells - User: user-123 - Started at:`,
              ),
            );
          },
        });
      });
    });
  });

  describe('real-world scenarios', () => {
    it('should log health check endpoints', (done) => {
      mockRequest.method = 'GET';
      mockRequest.url = '/health';
      mockRequest.user = undefined; // Health checks might not require auth
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of({ status: 'ok' }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: () => {
          expect(Logger.prototype.log).toHaveBeenCalledWith(
            expect.stringContaining(
              'Audit: GET /health - User: anonymous - Started at:',
            ),
          );
          done();
        },
      });
    });

    it('should log authentication endpoints', (done) => {
      mockRequest.method = 'POST';
      mockRequest.url = '/auth/login';
      mockRequest.user = undefined; // User not yet authenticated
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of({ token: 'jwt-token' }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: () => {
          expect(Logger.prototype.log).toHaveBeenCalledWith(
            expect.stringContaining(
              'Audit: POST /auth/login - User: anonymous - Started at:',
            ),
          );
          done();
        },
      });
    });

    it('should log data export operations', (done) => {
      mockRequest.method = 'GET';
      mockRequest.url = '/api/reports/production/export';
      mockRequest.user = { id: 'analyst-123' };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of({ fileUrl: 'download-link' }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: () => {
          expect(Logger.prototype.log).toHaveBeenCalledWith(
            expect.stringContaining(
              'Audit: GET /api/reports/production/export - User: analyst-123 - Started at:',
            ),
          );
          done();
        },
      });
    });
  });
});
