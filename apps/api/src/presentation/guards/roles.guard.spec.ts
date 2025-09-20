import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;
  let mockRequest: any;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(() => {
    reflector = mockReflector as any;
    guard = new RolesGuard(reflector);

    mockRequest = {
      user: null,
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
    } as any;

    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access when no roles are required', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should allow access when roles array is null', () => {
      mockReflector.getAllAndOverride.mockReturnValue(null);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow access when roles array is empty', () => {
      mockReflector.getAllAndOverride.mockReturnValue([]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      mockRequest.user = null;

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow(ForbiddenException);

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow('User not authenticated');
    });

    it('should throw ForbiddenException when user is undefined', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      mockRequest.user = undefined;

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow(ForbiddenException);

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow('User not authenticated');
    });

    it('should allow access when user has required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['OPERATOR']);
      mockRequest.user = {
        id: 'user-123',
        roles: ['OPERATOR'],
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow access when user has one of multiple required roles', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN', 'OPERATOR', 'VIEWER']);
      mockRequest.user = {
        id: 'user-123',
        roles: ['OPERATOR'],
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow access when user has multiple roles including required one', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['OPERATOR']);
      mockRequest.user = {
        id: 'user-123',
        roles: ['VIEWER', 'OPERATOR', 'FIELD_SUPERVISOR'],
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user lacks required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      mockRequest.user = {
        id: 'user-123',
        roles: ['VIEWER'],
      };

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow(ForbiddenException);

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow('Access denied. Required roles: ADMIN');
    });

    it('should throw ForbiddenException with multiple required roles in message', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN', 'OPERATOR']);
      mockRequest.user = {
        id: 'user-123',
        roles: ['VIEWER'],
      };

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow(ForbiddenException);

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow('Access denied. Required roles: ADMIN, OPERATOR');
    });

    it('should handle user with no roles property', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['OPERATOR']);
      mockRequest.user = {
        id: 'user-123',
        // no roles property
      };

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow(ForbiddenException);

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow('Access denied. Required roles: OPERATOR');
    });

    it('should handle user with null roles', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['OPERATOR']);
      mockRequest.user = {
        id: 'user-123',
        roles: null,
      };

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow(ForbiddenException);
    });

    it('should handle user with empty roles array', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['OPERATOR']);
      mockRequest.user = {
        id: 'user-123',
        roles: [],
      };

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow(ForbiddenException);
    });
  });

  describe('oil and gas industry roles', () => {
    it('should allow ADMIN access to all operations', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      mockRequest.user = {
        id: 'admin-123',
        roles: ['ADMIN'],
        company: 'WellFlow Systems',
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow OPERATOR access to well operations', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['OPERATOR', 'ADMIN']);
      mockRequest.user = {
        id: 'op-123',
        roles: ['OPERATOR'],
        operatorId: 'TX-OP-456',
        company: 'Texas Oil Company',
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow REGULATOR access to compliance operations', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['REGULATOR', 'AUDITOR']);
      mockRequest.user = {
        id: 'reg-123',
        roles: ['REGULATOR'],
        agency: 'Texas Railroad Commission',
        jurisdiction: 'Texas',
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow AUDITOR access to audit operations', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['AUDITOR']);
      mockRequest.user = {
        id: 'audit-123',
        roles: ['AUDITOR'],
        certifications: ['CPA', 'Environmental Auditor'],
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should allow VIEWER access to read-only operations', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['VIEWER', 'OPERATOR', 'ADMIN']);
      mockRequest.user = {
        id: 'viewer-123',
        roles: ['VIEWER'],
        department: 'Reporting',
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should deny VIEWER access to admin operations', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      mockRequest.user = {
        id: 'viewer-123',
        roles: ['VIEWER'],
      };

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow(ForbiddenException);

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow('Access denied. Required roles: ADMIN');
    });
  });

  describe('hierarchical access scenarios', () => {
    it('should allow users with multiple roles', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['OPERATOR']);
      mockRequest.user = {
        id: 'multi-123',
        roles: ['VIEWER', 'OPERATOR', 'FIELD_SUPERVISOR'],
        permissions: ['READ_WELLS', 'UPDATE_WELLS', 'SUPERVISE_FIELD'],
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should handle complex role requirements', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['PRODUCTION_MANAGER', 'FIELD_SUPERVISOR', 'OPERATOR']);
      mockRequest.user = {
        id: 'supervisor-123',
        roles: ['FIELD_SUPERVISOR', 'SAFETY_OFFICER'],
        location: 'Permian Basin',
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should deny access when user has insufficient role level', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN', 'PRODUCTION_MANAGER']);
      mockRequest.user = {
        id: 'worker-123',
        roles: ['FIELD_WORKER', 'VIEWER'],
      };

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow(ForbiddenException);

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow('Access denied. Required roles: ADMIN, PRODUCTION_MANAGER');
    });
  });

  describe('edge cases', () => {
    it('should handle case-sensitive role matching', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['OPERATOR']);
      mockRequest.user = {
        id: 'user-123',
        roles: ['operator'], // lowercase
      };

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow(ForbiddenException);
    });

    it('should handle special characters in role names', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['FIELD_SUPERVISOR']);
      mockRequest.user = {
        id: 'user-123',
        roles: ['FIELD_SUPERVISOR'],
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should handle numeric role names', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['LEVEL_1', 'LEVEL_2']);
      mockRequest.user = {
        id: 'user-123',
        roles: ['LEVEL_1'],
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should handle empty string roles', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['']);
      mockRequest.user = {
        id: 'user-123',
        roles: [''],
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });
  });

  describe('reflector integration', () => {
    it('should check both handler and class for roles metadata', () => {
      const mockHandler = jest.fn();
      const mockClass = jest.fn();
      
      mockExecutionContext.getHandler = jest.fn().mockReturnValue(mockHandler);
      mockExecutionContext.getClass = jest.fn().mockReturnValue(mockClass);
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      guard.canActivate(mockExecutionContext);

      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        mockHandler,
        mockClass,
      ]);
      expect(mockExecutionContext.getHandler).toHaveBeenCalled();
      expect(mockExecutionContext.getClass).toHaveBeenCalled();
    });

    it('should properly extract request from HTTP context', () => {
      const mockGetRequest = jest.fn().mockReturnValue(mockRequest);
      const mockSwitchToHttp = jest.fn().mockReturnValue({
        getRequest: mockGetRequest,
      });
      
      mockExecutionContext.switchToHttp = mockSwitchToHttp;
      mockReflector.getAllAndOverride.mockReturnValue(['OPERATOR']);
      mockRequest.user = {
        id: 'user-123',
        roles: ['OPERATOR'],
      };

      guard.canActivate(mockExecutionContext);

      expect(mockSwitchToHttp).toHaveBeenCalled();
      expect(mockGetRequest).toHaveBeenCalled();
    });
  });

  describe('real-world scenarios', () => {
    it('should handle well creation authorization', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN', 'OPERATOR']);
      mockRequest.user = {
        id: 'op-123',
        email: 'operator@texasoil.com',
        roles: ['OPERATOR'],
        operatorId: 'TX-OP-456',
        permissions: ['CREATE_WELL', 'UPDATE_WELL'],
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should handle regulatory inspection authorization', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['REGULATOR', 'AUDITOR']);
      mockRequest.user = {
        id: 'inspector-123',
        email: 'inspector@rrc.texas.gov',
        roles: ['REGULATOR'],
        agency: 'Texas Railroad Commission',
        badgeNumber: 'RRC-12345',
      };

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should deny unauthorized well deletion', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);
      mockRequest.user = {
        id: 'viewer-123',
        email: 'viewer@company.com',
        roles: ['VIEWER'],
        department: 'Reporting',
      };

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow(ForbiddenException);

      expect(() => {
        guard.canActivate(mockExecutionContext);
      }).toThrow('Access denied. Required roles: ADMIN');
    });
  });
});
