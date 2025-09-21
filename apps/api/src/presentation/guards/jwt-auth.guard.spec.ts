import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn(),
    getAllAndMerge: jest.fn(),
  };

  beforeEach(() => {
    reflector = mockReflector as jest.Mocked<Reflector>;
    guard = new JwtAuthGuard(reflector);

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

    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access to public routes', () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should call super.canActivate for protected routes', () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      const superCanActivateSpy = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      );
      superCanActivateSpy.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(superCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);

      superCanActivateSpy.mockRestore();
    });

    it('should call super.canActivate when isPublic is undefined', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      const superCanActivateSpy = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      );
      superCanActivateSpy.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(superCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext);

      superCanActivateSpy.mockRestore();
    });

    it('should call super.canActivate when isPublic is null', () => {
      mockReflector.getAllAndOverride.mockReturnValue(null);
      const superCanActivateSpy = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      );
      superCanActivateSpy.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(superCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext);

      superCanActivateSpy.mockRestore();
    });
  });

  describe('handleRequest', () => {
    it('should return user when authentication is successful', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        roles: ['OPERATOR'],
      };

      const result = guard.handleRequest(
        null,
        mockUser,
        null,
        mockExecutionContext,
      );

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user is null', () => {
      expect(() => {
        guard.handleRequest(null, null, null, mockExecutionContext);
      }).toThrow(UnauthorizedException);

      expect(() => {
        guard.handleRequest(null, null, null, mockExecutionContext);
      }).toThrow('Invalid or expired token');
    });

    it('should throw UnauthorizedException when user is undefined', () => {
      expect(() => {
        guard.handleRequest(null, undefined, null, mockExecutionContext);
      }).toThrow(UnauthorizedException);

      expect(() => {
        guard.handleRequest(null, undefined, null, mockExecutionContext);
      }).toThrow('Invalid or expired token');
    });

    it('should throw the original error when err is provided', () => {
      const originalError = new Error('JWT malformed');

      expect(() => {
        guard.handleRequest(originalError, null, null, mockExecutionContext);
      }).toThrow(originalError);
    });

    it('should throw the original error even when user is present', () => {
      const originalError = new Error('JWT expired');
      const mockUser = { id: 'user-123' };

      expect(() => {
        guard.handleRequest(
          originalError,
          mockUser,
          null,
          mockExecutionContext,
        );
      }).toThrow(originalError);
    });

    it('should handle empty user object', () => {
      const emptyUser = {};

      const result = guard.handleRequest(
        null,
        emptyUser,
        null,
        mockExecutionContext,
      );

      expect(result).toEqual(emptyUser);
    });

    it('should handle user with minimal properties', () => {
      const minimalUser = { id: 'user-123' };

      const result = guard.handleRequest(
        null,
        minimalUser,
        null,
        mockExecutionContext,
      );

      expect(result).toEqual(minimalUser);
    });

    it('should handle user with full oil & gas properties', () => {
      const oilGasUser = {
        id: 'user-123',
        email: 'operator@oilcompany.com',
        roles: ['OPERATOR', 'FIELD_SUPERVISOR'],
        operatorId: 'op-456',
        permissions: ['CREATE_WELL', 'UPDATE_WELL_STATUS'],
        company: 'Texas Oil & Gas Co.',
      };

      const result = guard.handleRequest(
        null,
        oilGasUser,
        null,
        mockExecutionContext,
      );

      expect(result).toEqual(oilGasUser);
    });
  });

  describe('integration scenarios', () => {
    it('should handle public health check endpoint', () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should handle protected well management endpoint', () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      const superCanActivateSpy = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      );
      superCanActivateSpy.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(superCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext);

      superCanActivateSpy.mockRestore();
    });

    it('should handle authentication failure for protected endpoint', () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      const superCanActivateSpy = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      );
      superCanActivateSpy.mockReturnValue(false);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
      expect(superCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext);

      superCanActivateSpy.mockRestore();
    });
  });

  describe('oil and gas specific scenarios', () => {
    it('should handle operator authentication', () => {
      const operatorUser = {
        id: 'op-123',
        email: 'operator@texasoil.com',
        roles: ['OPERATOR'],
        operatorId: 'TX-OP-456',
        company: 'Texas Oil Company',
      };

      const result = guard.handleRequest(
        null,
        operatorUser,
        null,
        mockExecutionContext,
      );

      expect(result).toEqual(operatorUser);
      expect(result.roles).toContain('OPERATOR');
      expect(result.operatorId).toBe('TX-OP-456');
    });

    it('should handle regulator authentication', () => {
      const regulatorUser = {
        id: 'reg-123',
        email: 'inspector@rrc.texas.gov',
        roles: ['REGULATOR', 'AUDITOR'],
        agency: 'Texas Railroad Commission',
        jurisdiction: 'Texas',
      };

      const result = guard.handleRequest(
        null,
        regulatorUser,
        null,
        mockExecutionContext,
      );

      expect(result).toEqual(regulatorUser);
      expect(result.roles).toContain('REGULATOR');
      expect(result.agency).toBe('Texas Railroad Commission');
    });

    it('should handle admin authentication', () => {
      const adminUser = {
        id: 'admin-123',
        email: 'admin@wellflow.com',
        roles: ['ADMIN'],
        permissions: ['ALL'],
        systemAccess: true,
      };

      const result = guard.handleRequest(
        null,
        adminUser,
        null,
        mockExecutionContext,
      );

      expect(result).toEqual(adminUser);
      expect(result.roles).toContain('ADMIN');
      expect(result.systemAccess).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle JWT parsing errors', () => {
      const jwtError = new Error('JsonWebTokenError: invalid signature');

      expect(() => {
        guard.handleRequest(jwtError, null, null, mockExecutionContext);
      }).toThrow(jwtError);
    });

    it('should handle token expiration errors', () => {
      const expiredError = new Error('TokenExpiredError: jwt expired');

      expect(() => {
        guard.handleRequest(expiredError, null, null, mockExecutionContext);
      }).toThrow(expiredError);
    });

    it('should handle malformed token errors', () => {
      const malformedError = new Error('JsonWebTokenError: jwt malformed');

      expect(() => {
        guard.handleRequest(malformedError, null, null, mockExecutionContext);
      }).toThrow(malformedError);
    });
  });

  describe('reflector integration', () => {
    it('should check both handler and class for public metadata', () => {
      const mockHandler = jest.fn();
      const mockClass = jest.fn();

      mockExecutionContext.getHandler = jest.fn().mockReturnValue(mockHandler);
      mockExecutionContext.getClass = jest.fn().mockReturnValue(mockClass);
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);

      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockHandler,
        mockClass,
      ]);
      expect(mockExecutionContext.getHandler).toHaveBeenCalled();
      expect(mockExecutionContext.getClass).toHaveBeenCalled();
    });
  });
});
