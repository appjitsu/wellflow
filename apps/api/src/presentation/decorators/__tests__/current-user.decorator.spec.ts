import { ExecutionContext } from '@nestjs/common';
import { CurrentUser, currentUserFactory } from '../current-user.decorator';

describe('CurrentUser Decorator', () => {
  let mockExecutionContext: ExecutionContext;
  let mockRequest: { user?: unknown };

  beforeEach(() => {
    mockRequest = {
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
  });

  describe('basic functionality', () => {
    it('should return the user from the request', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        roles: ['OPERATOR'],
      };

      mockRequest.user = mockUser;

      const result = currentUserFactory(null, mockExecutionContext) as any;

      expect(result).toEqual(mockUser);
    });

    it('should return undefined when no user is present', () => {
      mockRequest.user = undefined;

      const result = currentUserFactory(null, mockExecutionContext) as any;

      expect(result).toBeUndefined();
    });

    it('should return null when user is null', () => {
      mockRequest.user = null;

      const result = currentUserFactory(null, mockExecutionContext) as any;

      expect(result).toBeNull();
    });

    it('should handle empty user object', () => {
      mockRequest.user = {};

      const result = currentUserFactory(null, mockExecutionContext) as any;

      expect(result).toEqual({});
    });
  });

  describe('oil and gas user scenarios', () => {
    it('should return operator user with full profile', () => {
      const operatorUser = {
        id: 'op-123',
        email: 'operator@texasoil.com',
        roles: ['OPERATOR'],
        operatorId: 'TX-OP-456',
        company: 'Texas Oil Company',
        permissions: ['CREATE_WELL', 'UPDATE_WELL_STATUS'],
      };

      mockRequest.user = operatorUser;

      const result = currentUserFactory(null, mockExecutionContext) as any;

      expect(result).toEqual(operatorUser);
      expect(result.roles).toContain('OPERATOR');
      expect(result.operatorId).toBe('TX-OP-456');
    });

    it('should return regulator user', () => {
      const regulatorUser = {
        id: 'reg-123',
        email: 'inspector@rrc.texas.gov',
        roles: ['REGULATOR'],
        agency: 'Texas Railroad Commission',
        jurisdiction: 'Texas',
      };

      mockRequest.user = regulatorUser;

      const result = currentUserFactory(null, mockExecutionContext) as any;

      expect(result).toEqual(regulatorUser);
      expect(result.roles).toContain('REGULATOR');
      expect(result.agency).toBe('Texas Railroad Commission');
    });

    it('should return admin user', () => {
      const adminUser = {
        id: 'admin-123',
        email: 'admin@wellflow.com',
        roles: ['ADMIN'],
        permissions: ['ALL'],
        systemAccess: true,
      };

      mockRequest.user = adminUser;

      const result = currentUserFactory(null, mockExecutionContext) as any;

      expect(result).toEqual(adminUser);
      expect(result.roles).toContain('ADMIN');
      expect(result.systemAccess).toBe(true);
    });

    it('should return viewer user', () => {
      const viewerUser = {
        id: 'viewer-123',
        email: 'viewer@company.com',
        roles: ['VIEWER'],
        department: 'Reporting',
      };

      mockRequest.user = viewerUser;

      const result = currentUserFactory(null, mockExecutionContext) as any;

      expect(result).toEqual(viewerUser);
      expect(result.roles).toContain('VIEWER');
    });
  });

  describe('edge cases', () => {
    it('should handle user with complex nested objects', () => {
      const complexUser = {
        id: 'user-123',
        profile: {
          personal: {
            name: 'John Doe',
            email: 'john@example.com',
          },
          professional: {
            roles: ['ENGINEER'],
            certifications: ['PE', 'OSHA'],
          },
        },
        settings: {
          notifications: true,
          theme: 'dark',
        },
      };

      mockRequest.user = complexUser;

      const result = currentUserFactory(null, mockExecutionContext) as any;

      expect(result).toEqual(complexUser);
      expect(result.profile.professional.roles).toContain('ENGINEER');
    });

    it('should handle user with array properties', () => {
      const userWithArrays = {
        id: 'user-123',
        roles: ['ADMIN', 'OPERATOR', 'AUDITOR'],
        permissions: ['READ', 'WRITE', 'DELETE'],
        projects: ['well-1', 'well-2', 'well-3'],
      };

      mockRequest.user = userWithArrays;

      const result = currentUserFactory(null, mockExecutionContext) as any;

      expect(result).toEqual(userWithArrays);
      expect(result.roles).toHaveLength(3);
      expect(result.permissions).toHaveLength(3);
    });

    it('should handle user with special characters in properties', () => {
      const userWithSpecialChars = {
        id: 'user-123',
        email: 'user@company.com',
        name: 'José María González',
        location: 'Permian Basin, TX',
        notes: 'Special chars: @#$%^&*()',
      };

      mockRequest.user = userWithSpecialChars;

      const result = currentUserFactory(null, mockExecutionContext) as any;

      expect(result).toEqual(userWithSpecialChars);
      expect(result.name).toBe('José María González');
      expect(result.location).toBe('Permian Basin, TX');
    });
  });

  describe('decorator function behavior', () => {
    it('should be a function that returns a decorator', () => {
      expect(typeof CurrentUser).toBe('function');

      const decorator = CurrentUser();
      expect(typeof decorator).toBe('function');
    });

    it('should work with data parameter (though not used)', () => {
      const mockUser = { id: 'user-123' };
      mockRequest.user = mockUser;

      const result1 = currentUserFactory(null, mockExecutionContext) as any;
      const result2 = currentUserFactory(
        'someData',
        mockExecutionContext,
      ) as any;

      expect(result1).toEqual(mockUser);
      expect(result2).toEqual(mockUser);
    });

    it('should properly extract request from HTTP context', () => {
      const mockUser = { id: 'user-123' };
      mockRequest.user = mockUser;

      const mockGetRequest = jest.fn().mockReturnValue(mockRequest);
      const mockSwitchToHttp = jest.fn().mockReturnValue({
        getRequest: mockGetRequest,
      });

      mockExecutionContext.switchToHttp = mockSwitchToHttp;

      const result = currentUserFactory(null, mockExecutionContext) as any;

      expect(mockSwitchToHttp).toHaveBeenCalled();
      expect(mockGetRequest).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });

  describe('real-world scenarios', () => {
    it('should extract user in controller method', () => {
      const user = {
        id: 'user-123',
        email: 'operator@example.com',
        roles: ['OPERATOR'],
        operatorId: 'OP-456',
      };

      mockRequest.user = user;

      // Simulate how it would be used in a controller
      const extractedUser = currentUserFactory(
        null,
        mockExecutionContext,
      ) as any;

      expect(extractedUser).toEqual(user);
      expect(extractedUser.roles).toContain('OPERATOR');
    });

    it('should handle authentication middleware user injection', () => {
      const jwtUser = {
        id: 'user-123',
        email: 'user@company.com',
        iat: 1234567890,
        exp: 1234567890 + 3600,
        roles: ['VIEWER'],
      };

      mockRequest.user = jwtUser;

      const result = currentUserFactory(null, mockExecutionContext) as any;

      expect(result).toEqual(jwtUser);
      expect(result.iat).toBeDefined();
      expect(result.exp).toBeDefined();
    });
  });
});
