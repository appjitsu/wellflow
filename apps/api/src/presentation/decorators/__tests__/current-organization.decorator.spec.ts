import { ExecutionContext } from '@nestjs/common';
import { CurrentOrganization } from '../current-organization.decorator';

describe('CurrentOrganization Decorator', () => {
  let mockExecutionContext: ExecutionContext;
  let mockRequest: { user?: { organizationId?: string } | null };

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
    it('should return the organizationId from the user', () => {
      mockRequest.user = {
        organizationId: 'org-123',
      };

      const result = CurrentOrganization(null, mockExecutionContext);

      expect(result).toBe('org-123');
    });

    it('should return undefined when user has no organizationId', () => {
      mockRequest.user = {};

      const result = CurrentOrganization(null, mockExecutionContext);

      expect(result).toBeUndefined();
    });

    it('should return undefined when user is undefined', () => {
      mockRequest.user = undefined;

      const result = CurrentOrganization(null, mockExecutionContext);

      expect(result).toBeUndefined();
    });

    it('should return undefined when user is null', () => {
      mockRequest.user = null;

      const result = CurrentOrganization(null, mockExecutionContext);

      expect(result).toBeUndefined();
    });

    it('should handle empty string organizationId', () => {
      mockRequest.user = {
        organizationId: '',
      };

      const result = CurrentOrganization(null, mockExecutionContext);

      expect(result).toBe('');
    });
  });

  describe('oil and gas organization scenarios', () => {
    it('should return operator organization ID', () => {
      mockRequest.user = {
        organizationId: 'texas-oil-company',
      };

      const result = CurrentOrganization(null, mockExecutionContext);

      expect(result).toBe('texas-oil-company');
    });

    it('should return regulator organization ID', () => {
      mockRequest.user = {
        organizationId: 'texas-railroad-commission',
      };

      const result = CurrentOrganization(null, mockExecutionContext);

      expect(result).toBe('texas-railroad-commission');
    });

    it('should return service company organization ID', () => {
      mockRequest.user = {
        organizationId: 'halliburton-services',
      };

      const result = CurrentOrganization(null, mockExecutionContext);

      expect(result).toBe('halliburton-services');
    });

    it('should return government agency organization ID', () => {
      mockRequest.user = {
        organizationId: 'us-department-energy',
      };

      const result = CurrentOrganization(null, mockExecutionContext);

      expect(result).toBe('us-department-energy');
    });
  });

  describe('edge cases', () => {
    it('should handle organizationId with special characters', () => {
      mockRequest.user = {
        organizationId: 'org_123-special',
      };

      const result = CurrentOrganization(null, mockExecutionContext);

      expect(result).toBe('org_123-special');
    });

    it('should handle numeric organizationId', () => {
      mockRequest.user = {
        organizationId: '12345',
      };

      const result = CurrentOrganization(null, mockExecutionContext);

      expect(result).toBe('12345');
    });

    it('should handle long organizationId', () => {
      const longOrgId = 'very-long-organization-identifier-with-multiple-words';
      mockRequest.user = {
        organizationId: longOrgId,
      };

      const result = CurrentOrganization(null, mockExecutionContext);

      expect(result).toBe(longOrgId);
    });
  });

  describe('decorator function behavior', () => {
    it('should be a function that returns a decorator', () => {
      expect(typeof CurrentOrganization).toBe('function');

      const decorator = CurrentOrganization();
      expect(typeof decorator).toBe('function');
    });

    it('should work with data parameter (though not used)', () => {
      mockRequest.user = {
        organizationId: 'org-123',
      };

      const result1 = CurrentOrganization(null, mockExecutionContext);
      const result2 = CurrentOrganization('someData', mockExecutionContext);

      expect(result1).toBe('org-123');
      expect(result2).toBe('org-123');
    });

    it('should properly extract request from HTTP context', () => {
      mockRequest.user = {
        organizationId: 'org-123',
      };

      const mockGetRequest = jest.fn().mockReturnValue(mockRequest);
      const mockSwitchToHttp = jest.fn().mockReturnValue({
        getRequest: mockGetRequest,
      });

      mockExecutionContext.switchToHttp = mockSwitchToHttp;

      const result = CurrentOrganization(null, mockExecutionContext);

      expect(mockSwitchToHttp).toHaveBeenCalled();
      expect(mockGetRequest).toHaveBeenCalled();
      expect(result).toBe('org-123');
    });
  });

  describe('real-world scenarios', () => {
    it('should extract organization in multi-tenant controller', () => {
      mockRequest.user = {
        organizationId: 'tenant-456',
      };

      const result = CurrentOrganization(null, mockExecutionContext);

      expect(result).toBe('tenant-456');
    });

    it('should handle organization-based access control', () => {
      mockRequest.user = {
        organizationId: 'oil-company-a',
      };

      const result = CurrentOrganization(null, mockExecutionContext);

      expect(result).toBe('oil-company-a');
    });

    it('should handle cross-organization scenarios', () => {
      mockRequest.user = {
        organizationId: 'regulatory-agency',
      };

      const result = CurrentOrganization(null, mockExecutionContext);

      expect(result).toBe('regulatory-agency');
    });
  });
});
