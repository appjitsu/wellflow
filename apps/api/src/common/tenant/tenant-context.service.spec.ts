import { Test, TestingModule } from '@nestjs/testing';
import { TenantContextService, TenantContext } from './tenant-context.service';

// Mock AsyncLocalStorage
const mockAls = {
  enterWith: jest.fn(),
  getStore: jest.fn(),
  run: jest.fn(),
};

// Replace the static ALS with our mock before any tests run
Object.defineProperty(TenantContextService, 'als', {
  value: mockAls,
  writable: true,
});

describe('TenantContextService', () => {
  let service: TenantContextService;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    mockAls.enterWith.mockReset();
    mockAls.getStore.mockReset();
    mockAls.run.mockReset();

    // Default behavior - no context
    mockAls.getStore.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantContextService],
    }).compile();

    service = await module.resolve<TenantContextService>(TenantContextService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setContext and getContext', () => {
    it('should set and get tenant context', () => {
      const context: TenantContext = {
        organizationId: 'org-123',
        userId: 'user-456',
        userRole: 'pumper',
      };

      mockAls.enterWith.mockImplementation((ctx) => {
        mockAls.getStore.mockReturnValue(ctx);
      });

      service.setContext(context);
      const retrieved = service.getContext();

      expect(mockAls.enterWith).toHaveBeenCalledWith(context);
      expect(retrieved).toEqual(context);
    });

    it('should return undefined when no context is set', () => {
      mockAls.getStore.mockReturnValue(undefined);
      const context = service.getContext();
      expect(context).toBeUndefined();
    });
  });

  describe('getOrganizationId', () => {
    it('should return organization ID when context is set', () => {
      const context: TenantContext = {
        organizationId: 'org-123',
      };

      mockAls.getStore.mockReturnValue(context);
      const orgId = service.getOrganizationId();

      expect(orgId).toBe('org-123');
    });

    it('should throw error when no context is set', () => {
      mockAls.getStore.mockReturnValue(undefined);
      expect(() => service.getOrganizationId()).toThrow(
        'No organization context found. Ensure tenant context is set.',
      );
    });

    it('should throw error when context has no organizationId', () => {
      const context: TenantContext = {
        organizationId: '',
      };

      mockAls.getStore.mockReturnValue(context);
      expect(() => service.getOrganizationId()).toThrow(
        'No organization context found. Ensure tenant context is set.',
      );
    });
  });

  describe('getUserId', () => {
    it('should return user ID when set in context', () => {
      const context: TenantContext = {
        organizationId: 'org-123',
        userId: 'user-456',
      };

      mockAls.getStore.mockReturnValue(context);
      const userId = service.getUserId();

      expect(userId).toBe('user-456');
    });

    it('should return undefined when userId is not set', () => {
      const context: TenantContext = {
        organizationId: 'org-123',
      };

      mockAls.getStore.mockReturnValue(context);
      const userId = service.getUserId();

      expect(userId).toBeUndefined();
    });

    it('should return undefined when no context is set', () => {
      mockAls.getStore.mockReturnValue(undefined);
      const userId = service.getUserId();
      expect(userId).toBeUndefined();
    });
  });

  describe('getUserRole', () => {
    it('should return user role when set in context', () => {
      const context: TenantContext = {
        organizationId: 'org-123',
        userRole: 'pumper',
      };

      mockAls.getStore.mockReturnValue(context);
      const userRole = service.getUserRole();

      expect(userRole).toBe('pumper');
    });

    it('should return undefined when userRole is not set', () => {
      const context: TenantContext = {
        organizationId: 'org-123',
      };

      mockAls.getStore.mockReturnValue(context);
      const userRole = service.getUserRole();

      expect(userRole).toBeUndefined();
    });

    it('should return undefined when no context is set', () => {
      mockAls.getStore.mockReturnValue(undefined);
      const userRole = service.getUserRole();
      expect(userRole).toBeUndefined();
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the specified role', () => {
      const context: TenantContext = {
        organizationId: 'org-123',
        userRole: 'pumper',
      };

      mockAls.getStore.mockReturnValue(context);
      const hasRole = service.hasRole('pumper');

      expect(hasRole).toBe(true);
    });

    it('should return false when user has different role', () => {
      const context: TenantContext = {
        organizationId: 'org-123',
        userRole: 'manager',
      };

      mockAls.getStore.mockReturnValue(context);
      const hasRole = service.hasRole('pumper');

      expect(hasRole).toBe(false);
    });

    it('should return false when no role is set', () => {
      const context: TenantContext = {
        organizationId: 'org-123',
      };

      mockAls.getStore.mockReturnValue(context);
      const hasRole = service.hasRole('pumper');

      expect(hasRole).toBe(false);
    });
  });

  describe('role-specific methods', () => {
    it('should return true for isOwner when user is owner', () => {
      const context: TenantContext = {
        organizationId: 'org-123',
        userRole: 'owner',
      };

      mockAls.getStore.mockReturnValue(context);
      expect(service.isOwner()).toBe(true);
      expect(service.isManager()).toBe(false);
      expect(service.isPumper()).toBe(false);
    });

    it('should return true for isManager when user is manager', () => {
      const context: TenantContext = {
        organizationId: 'org-123',
        userRole: 'manager',
      };

      mockAls.getStore.mockReturnValue(context);
      expect(service.isOwner()).toBe(false);
      expect(service.isManager()).toBe(true);
      expect(service.isPumper()).toBe(false);
    });

    it('should return true for isPumper when user is pumper', () => {
      const context: TenantContext = {
        organizationId: 'org-123',
        userRole: 'pumper',
      };

      mockAls.getStore.mockReturnValue(context);
      expect(service.isOwner()).toBe(false);
      expect(service.isManager()).toBe(false);
      expect(service.isPumper()).toBe(true);
    });

    it('should return false for all role checks when no role is set', () => {
      const context: TenantContext = {
        organizationId: 'org-123',
      };

      mockAls.getStore.mockReturnValue(context);
      expect(service.isOwner()).toBe(false);
      expect(service.isManager()).toBe(false);
      expect(service.isPumper()).toBe(false);
    });
  });

  describe('runInContext', () => {
    it('should run function within specific tenant context', async () => {
      const context: TenantContext = {
        organizationId: 'org-123',
        userId: 'user-456',
      };

      mockAls.run.mockImplementation((ctx, fn) => {
        mockAls.getStore.mockReturnValue(ctx);
        return fn();
      });

      const result = await service.runInContext(context, async () => {
        return service.getOrganizationId();
      });

      expect(result).toBe('org-123');
      expect(mockAls.run).toHaveBeenCalledWith(context, expect.any(Function));
    });

    it('should run synchronous function within context', async () => {
      const context: TenantContext = {
        organizationId: 'org-456',
        userId: 'user-789',
      };

      mockAls.run.mockImplementation((ctx, fn) => {
        mockAls.getStore.mockReturnValue(ctx);
        return fn();
      });

      const result = await service.runInContext(context, () => {
        return service.getOrganizationId();
      });

      expect(result).toBe('org-456');
      expect(mockAls.run).toHaveBeenCalledWith(context, expect.any(Function));
    });

    it('should isolate context between different runs', async () => {
      const context1: TenantContext = {
        organizationId: 'org-123',
      };

      const context2: TenantContext = {
        organizationId: 'org-456',
      };

      let callCount = 0;
      mockAls.run.mockImplementation((ctx, fn) => {
        mockAls.getStore.mockReturnValue(ctx);
        callCount++;
        return fn();
      });

      const result1 = await service.runInContext(context1, () => {
        return service.getOrganizationId();
      });

      const result2 = await service.runInContext(context2, () => {
        return service.getOrganizationId();
      });

      expect(result1).toBe('org-123');
      expect(result2).toBe('org-456');
      expect(callCount).toBe(2);
    });
  });

  describe('createTenantFilter', () => {
    it('should create tenant filter with organization ID', () => {
      const context: TenantContext = {
        organizationId: 'org-123',
      };

      mockAls.getStore.mockReturnValue(context);
      const filter = service.createTenantFilter();

      expect(filter).toEqual({ organizationId: 'org-123' });
    });

    it('should throw error when no context is set', () => {
      mockAls.getStore.mockReturnValue(undefined);
      expect(() => service.createTenantFilter()).toThrow(
        'No organization context found. Ensure tenant context is set.',
      );
    });
  });

  describe('validateOrganizationAccess', () => {
    it('should not throw when organization IDs match', () => {
      const context: TenantContext = {
        organizationId: 'org-123',
      };

      mockAls.getStore.mockReturnValue(context);

      expect(() => service.validateOrganizationAccess('org-123')).not.toThrow();
    });

    it('should throw error when organization IDs do not match', () => {
      const context: TenantContext = {
        organizationId: 'org-123',
      };

      mockAls.getStore.mockReturnValue(context);

      expect(() => service.validateOrganizationAccess('org-456')).toThrow(
        'Access denied: Organization mismatch',
      );
    });

    it('should throw error when no context is set', () => {
      mockAls.getStore.mockReturnValue(undefined);
      expect(() => service.validateOrganizationAccess('org-123')).toThrow(
        'No organization context found. Ensure tenant context is set.',
      );
    });
  });
});
