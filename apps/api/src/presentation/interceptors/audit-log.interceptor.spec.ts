import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of, throwError } from 'rxjs';
import { AuditLogInterceptor } from './audit-log.interceptor';
import { AuditLogOptions } from '../decorators/audit-log.decorator';

describe('AuditLogInterceptor', () => {
  let interceptor: AuditLogInterceptor;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: any;
  let mockResponse: any;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(() => {
    reflector = mockReflector as any;
    interceptor = new AuditLogInterceptor(reflector);

    mockRequest = {
      user: null,
      ip: '192.168.1.100',
      method: 'GET',
      url: '/api/wells',
      get: jest.fn(),
    };

    mockResponse = {
      statusCode: 200,
    };

    mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn().mockReturnValue({ name: 'WellsController' }),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
      getType: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    } as any;

    mockCallHandler = {
      handle: jest.fn(),
    } as any;

    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(Date, 'now').mockReturnValue(1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('intercept', () => {
    it('should pass through when no audit options are found', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      const mockObservable = of('test response');
      (mockCallHandler.handle as jest.Mock).mockReturnValue(mockObservable);

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      expect(result).toBe(mockObservable);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('auditLog', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
      expect(mockCallHandler.handle).toHaveBeenCalled();
    });

    it('should pass through when audit options are null', () => {
      mockReflector.getAllAndOverride.mockReturnValue(null);
      const mockObservable = of('test response');
      (mockCallHandler.handle as jest.Mock).mockReturnValue(mockObservable);

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      expect(result).toBe(mockObservable);
      expect(mockCallHandler.handle).toHaveBeenCalled();
    });

    it('should log audit event on successful request', (done) => {
      const auditOptions: AuditLogOptions = {
        action: 'CREATE_WELL',
        resource: 'well',
        description: 'Create a new well',
      };

      mockReflector.getAllAndOverride.mockReturnValue(auditOptions);
      mockRequest.user = {
        id: 'user-123',
        email: 'operator@example.com',
      };
      mockRequest.get.mockReturnValue('Mozilla/5.0 Test Browser');
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
          expect(console.log).toHaveBeenCalledWith(
            'AUDIT_LOG:',
            expect.stringContaining('"action": "CREATE_WELL"'),
          );
          expect(console.log).toHaveBeenCalledWith(
            'AUDIT_LOG:',
            expect.stringContaining('"resource": "well"'),
          );
          expect(console.log).toHaveBeenCalledWith(
            'AUDIT_LOG:',
            expect.stringContaining('"success": true'),
          );
          done();
        },
      });
    });

    it('should log audit event on failed request', (done) => {
      const auditOptions: AuditLogOptions = {
        action: 'DELETE_WELL',
        resource: 'well',
        description: 'Delete a well',
      };

      mockReflector.getAllAndOverride.mockReturnValue(auditOptions);
      mockRequest.user = {
        id: 'user-456',
        email: 'admin@example.com',
      };
      mockRequest.get.mockReturnValue('Mozilla/5.0 Test Browser');

      const error = new Error('Well not found');
      (error as any).status = 404;
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
          expect(console.log).toHaveBeenCalledWith(
            'AUDIT_LOG:',
            expect.stringContaining('"action": "DELETE_WELL"'),
          );
          expect(console.log).toHaveBeenCalledWith(
            'AUDIT_LOG:',
            expect.stringContaining('"success": false'),
          );
          expect(console.log).toHaveBeenCalledWith(
            'AUDIT_LOG:',
            expect.stringContaining('"statusCode": 404'),
          );
          expect(console.log).toHaveBeenCalledWith(
            'AUDIT_LOG:',
            expect.stringContaining('"error": "Well not found"'),
          );
          done();
        },
      });
    });

    it('should use default resource when not specified', (done) => {
      const auditOptions: AuditLogOptions = {
        action: 'VIEW_WELLS',
      };

      mockReflector.getAllAndOverride.mockReturnValue(auditOptions);
      mockRequest.user = { id: 'user-789' };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('wells data'));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: () => {
          expect(console.log).toHaveBeenCalledWith(
            'AUDIT_LOG:',
            expect.stringContaining('"resource": "WellsController"'),
          );
          done();
        },
      });
    });

    it('should handle request without user', (done) => {
      const auditOptions: AuditLogOptions = {
        action: 'PUBLIC_ACCESS',
        resource: 'health',
      };

      mockReflector.getAllAndOverride.mockReturnValue(auditOptions);
      mockRequest.user = null;
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('health check'));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: () => {
          // When user is null, userId and userEmail are undefined and omitted from JSON
          expect(console.log).toHaveBeenCalledWith(
            'AUDIT_LOG:',
            expect.not.stringContaining('"userId"'),
          );
          expect(console.log).toHaveBeenCalledWith(
            'AUDIT_LOG:',
            expect.not.stringContaining('"userEmail"'),
          );
          expect(console.log).toHaveBeenCalledWith(
            'AUDIT_LOG:',
            expect.stringContaining('"action": "PUBLIC_ACCESS"'),
          );
          done();
        },
      });
    });

    it('should handle error without status code', (done) => {
      const auditOptions: AuditLogOptions = {
        action: 'SYSTEM_ERROR',
      };

      mockReflector.getAllAndOverride.mockReturnValue(auditOptions);
      const error = new Error('Internal error');
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        throwError(() => error),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          expect(console.log).toHaveBeenCalledWith(
            'AUDIT_LOG:',
            expect.stringContaining('"statusCode": 500'),
          );
          done();
        },
      });
    });
  });

  describe('oil and gas specific scenarios', () => {
    it('should log well creation audit', (done) => {
      const auditOptions: AuditLogOptions = {
        action: 'CREATE_WELL',
        resource: 'well',
        description: 'Create new oil well in Permian Basin',
      };

      mockReflector.getAllAndOverride.mockReturnValue(auditOptions);
      mockRequest.user = {
        id: 'op-123',
        email: 'operator@texasoil.com',
        roles: ['OPERATOR'],
        operatorId: 'TX-OP-456',
      };
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
          expect(console.log).toHaveBeenCalledWith(
            'AUDIT_LOG:',
            expect.stringContaining(
              '"description": "Create new oil well in Permian Basin"',
            ),
          );
          expect(console.log).toHaveBeenCalledWith(
            'AUDIT_LOG:',
            expect.stringContaining('"method": "POST"'),
          );
          done();
        },
      });
    });

    it('should log regulatory inspection audit', (done) => {
      const auditOptions: AuditLogOptions = {
        action: 'REGULATORY_INSPECTION',
        resource: 'well',
        description: 'Texas Railroad Commission inspection',
      };

      mockReflector.getAllAndOverride.mockReturnValue(auditOptions);
      mockRequest.user = {
        id: 'reg-123',
        email: 'inspector@rrc.texas.gov',
        roles: ['REGULATOR'],
        agency: 'Texas Railroad Commission',
      };
      mockRequest.method = 'GET';
      mockRequest.url = '/api/wells/well-123/inspection';
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of({ inspectionResult: 'PASSED' }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: () => {
          expect(console.log).toHaveBeenCalledWith(
            'AUDIT_LOG:',
            expect.stringContaining('"action": "REGULATORY_INSPECTION"'),
          );
          expect(console.log).toHaveBeenCalledWith(
            'AUDIT_LOG:',
            expect.stringContaining('"userEmail": "inspector@rrc.texas.gov"'),
          );
          done();
        },
      });
    });

    it('should log production data update audit', (done) => {
      const auditOptions: AuditLogOptions = {
        action: 'UPDATE_PRODUCTION_DATA',
        resource: 'production',
        description: 'Update daily production volumes',
      };

      mockReflector.getAllAndOverride.mockReturnValue(auditOptions);
      mockRequest.user = {
        id: 'op-456',
        email: 'fieldop@company.com',
        roles: ['OPERATOR', 'FIELD_SUPERVISOR'],
      };
      mockRequest.method = 'PUT';
      mockRequest.url = '/api/wells/well-123/production';
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of({ updated: true }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: () => {
          expect(console.log).toHaveBeenCalledWith(
            'AUDIT_LOG:',
            expect.stringContaining('"action": "UPDATE_PRODUCTION_DATA"'),
          );
          expect(console.log).toHaveBeenCalledWith(
            'AUDIT_LOG:',
            expect.stringContaining('"resource": "production"'),
          );
          done();
        },
      });
    });

    it('should log environmental compliance audit', (done) => {
      const auditOptions: AuditLogOptions = {
        action: 'ENVIRONMENTAL_REPORT',
        resource: 'compliance',
        description: 'Generate environmental impact report',
      };

      mockReflector.getAllAndOverride.mockReturnValue(auditOptions);
      mockRequest.user = {
        id: 'env-123',
        email: 'environmental@company.com',
        roles: ['ENVIRONMENTAL_OFFICER'],
      };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of({ reportId: 'env-report-123' }),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: () => {
          expect(console.log).toHaveBeenCalledWith(
            'AUDIT_LOG:',
            expect.stringContaining('"action": "ENVIRONMENTAL_REPORT"'),
          );
          done();
        },
      });
    });
  });

  describe('audit data structure', () => {
    it('should include all required audit fields on success', (done) => {
      const auditOptions: AuditLogOptions = {
        action: 'TEST_ACTION',
        resource: 'test',
        description: 'Test description',
      };

      mockReflector.getAllAndOverride.mockReturnValue(auditOptions);
      mockRequest.user = {
        id: 'user-123',
        email: 'test@example.com',
      };
      mockRequest.ip = '10.0.0.1';
      mockRequest.method = 'POST';
      mockRequest.url = '/api/test';
      mockRequest.get.mockReturnValue('Test-Agent/1.0');
      mockResponse.statusCode = 201;
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of('test response'),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: () => {
          const logCall = (console.log as jest.Mock).mock.calls.find(
            (call) => call[0] === 'AUDIT_LOG:',
          );
          expect(logCall).toBeDefined();

          const auditData = JSON.parse(logCall[1]);
          expect(auditData).toMatchObject({
            action: 'TEST_ACTION',
            resource: 'test',
            description: 'Test description',
            userId: 'user-123',
            userEmail: 'test@example.com',
            ipAddress: '10.0.0.1',
            userAgent: 'Test-Agent/1.0',
            method: 'POST',
            url: '/api/test',
            statusCode: 201,
            success: true,
          });
          expect(auditData.duration).toBeGreaterThanOrEqual(0);
          expect(auditData.timestamp).toBeDefined();
          done();
        },
      });
    });

    it('should include all required audit fields on error', (done) => {
      const auditOptions: AuditLogOptions = {
        action: 'FAILED_ACTION',
        resource: 'test',
      };

      mockReflector.getAllAndOverride.mockReturnValue(auditOptions);
      mockRequest.user = { id: 'user-456' };
      const error = new Error('Test error');
      (error as any).status = 400;
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        throwError(() => error),
      );

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        error: () => {
          const logCall = (console.log as jest.Mock).mock.calls.find(
            (call) => call[0] === 'AUDIT_LOG:',
          );
          expect(logCall).toBeDefined();

          const auditData = JSON.parse(logCall[1]);
          expect(auditData).toMatchObject({
            action: 'FAILED_ACTION',
            resource: 'test',
            userId: 'user-456',
            statusCode: 400,
            success: false,
            error: 'Test error',
          });
          expect(auditData.duration).toBeGreaterThanOrEqual(0);
          expect(auditData.timestamp).toBeDefined();
          done();
        },
      });
    });
  });

  describe('timing and performance', () => {
    it('should calculate request duration correctly', (done) => {
      const auditOptions: AuditLogOptions = {
        action: 'TIMING_TEST',
      };

      mockReflector.getAllAndOverride.mockReturnValue(auditOptions);

      // Mock Date.now to return different values for start and end
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
          const logCall = (console.log as jest.Mock).mock.calls.find(
            (call) => call[0] === 'AUDIT_LOG:',
          );
          const auditData = JSON.parse(logCall[1]);
          expect(auditData.duration).toBe(500);
          done();
        },
      });
    });
  });
});
