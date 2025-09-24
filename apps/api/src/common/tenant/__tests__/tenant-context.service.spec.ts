import { Test, TestingModule } from '@nestjs/testing';
import { TenantContextService } from '../tenant-context.service';

describe('TenantContextService', () => {
  let service: TenantContextService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantContextService],
    }).compile();

    service = await module.resolve<TenantContextService>(TenantContextService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Organization Context Management', () => {
    it('should set and get organization ID', () => {
      const orgId = 'org-123';
      service.setOrganizationId(orgId);

      expect(service.getOrganizationId()).toBe(orgId);
    });

    it('should handle null organization ID', () => {
      service.setOrganizationId(null);

      expect(() => service.getOrganizationId()).toThrow(
        'No organization context found. Ensure tenant context is set.',
      );
    });

    it('should handle undefined organization ID', () => {
      service.setOrganizationId(undefined);

      expect(() => service.getOrganizationId()).toThrow(
        'No organization context found. Ensure tenant context is set.',
      );
    });

    it('should clear organization context', () => {
      service.setOrganizationId('org-123');
      service.clearContext();

      expect(() => service.getOrganizationId()).toThrow(
        'No organization context found. Ensure tenant context is set.',
      );
    });
  });

  describe('User Context Management', () => {
    it('should set and get user ID', () => {
      const userId = 'user-456';
      service.setUserId(userId);

      expect(service.getUserId()).toBe(userId);
    });

    it('should set and get user role', () => {
      const userRole = 'admin';
      service.setUserRole(userRole);

      expect(service.getUserRole()).toBe(userRole);
    });

    it('should handle multiple user roles', () => {
      const userRoles = ['operator', 'viewer'];
      service.setUserRoles(userRoles);

      expect(service.getUserRoles()).toEqual(userRoles);
    });

    it('should clear user context', () => {
      service.setUserId('user-456');
      service.setUserRole('admin');
      service.clearContext();

      expect(service.getUserId()).toBeUndefined();
      expect(service.getUserRole()).toBeUndefined();
    });
  });

  describe('Request Context Management', () => {
    it('should set and get request ID', () => {
      const requestId = 'req-789';
      service.setRequestId(requestId);

      expect(service.getRequestId()).toBe(requestId);
    });

    it('should set and get correlation ID', () => {
      const correlationId = 'corr-abc123';
      service.setCorrelationId(correlationId);

      expect(service.getCorrelationId()).toBe(correlationId);
    });

    it('should handle request metadata', () => {
      const metadata = { source: 'api', version: '1.0' };
      service.setRequestMetadata(metadata);

      expect(service.getRequestMetadata()).toEqual(metadata);
    });
  });

  describe('Complete Context Management', () => {
    it('should set and get complete context', () => {
      const context = {
        organizationId: 'org-123',
        userId: 'user-456',
        userRole: 'admin',
        requestId: 'req-789',
        correlationId: 'corr-abc123',
      };

      service.setContext(context);

      expect(service.getContext()).toEqual(context);
    });

    it('should handle partial context updates', () => {
      service.setOrganizationId('org-123');
      service.setUserId('user-456');

      const partialUpdate = { userRole: 'operator' };
      service.setContext(partialUpdate);

      const context = service.getContext()!;
      expect(context.organizationId).toBe('org-123');
      expect(context.userId).toBe('user-456');
      expect(context.userRole).toBe('operator');
    });

    it('should validate required context fields', () => {
      const isValid = service.validateContext(['organizationId', 'userId']);
      expect(isValid).toBe(false);

      service.setOrganizationId('org-123');
      service.setUserId('user-456');

      const isValidAfterSet = service.validateContext([
        'organizationId',
        'userId',
      ]);
      expect(isValidAfterSet).toBe(true);
    });
  });

  describe('Context Isolation', () => {
    it('should run function in isolated context', async () => {
      service.setOrganizationId('org-original');

      const result = await service.runInContext(
        { organizationId: 'org-isolated' },
        () => {
          return service.getOrganizationId();
        },
      );

      expect(result).toBe('org-isolated');
      expect(service.getOrganizationId()).toBe('org-original');
    });

    it('should handle async functions in isolated context', async () => {
      service.setUserId('user-original');

      const result = await service.runInContext(
        { userId: 'user-isolated' },
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return service.getUserId();
        },
      );

      expect(result).toBe('user-isolated');
      expect(service.getUserId()).toBe('user-original');
    });

    it('should handle errors in isolated context', async () => {
      service.setOrganizationId('org-original');

      await expect(
        service.runInContext({ organizationId: 'org-isolated' }, () => {
          throw new Error('Test error');
        }),
      ).rejects.toThrow('Test error');

      expect(service.getOrganizationId()).toBe('org-original');
    });
  });

  describe('Context Serialization', () => {
    it('should serialize context to JSON', () => {
      service.setOrganizationId('org-123');
      service.setUserId('user-456');
      service.setUserRole('admin');

      const serialized = service.serializeContext();
      const parsed = JSON.parse(serialized);

      expect(parsed.organizationId).toBe('org-123');
      expect(parsed.userId).toBe('user-456');
      expect(parsed.userRole).toBe('admin');
    });

    it('should deserialize context from JSON', () => {
      const contextData = {
        organizationId: 'org-123',
        userId: 'user-456',
        userRole: 'admin',
      };

      const serialized = JSON.stringify(contextData);
      service.deserializeContext(serialized);

      expect(service.getOrganizationId()).toBe('org-123');
      expect(service.getUserId()).toBe('user-456');
      expect(service.getUserRole()).toBe('admin');
    });

    it('should handle invalid JSON during deserialization', () => {
      expect(() => {
        service.deserializeContext('invalid-json');
      }).toThrow();
    });
  });

  describe('Context Events', () => {
    it('should emit events on context changes', () => {
      const eventSpy = jest.fn();
      service.onContextChange(eventSpy);

      service.setOrganizationId('org-123');

      expect(eventSpy).toHaveBeenCalledWith({
        field: 'organizationId',
        oldValue: undefined,
        newValue: 'org-123',
      });
    });

    it('should emit events on context clear', () => {
      const eventSpy = jest.fn();
      service.onContextChange(eventSpy);

      service.setOrganizationId('org-123');
      service.clearContext();

      expect(eventSpy).toHaveBeenCalledWith({
        field: 'organizationId',
        oldValue: 'org-123',
        newValue: undefined,
      });
    });

    it('should support multiple event listeners', () => {
      const eventSpy1 = jest.fn();
      const eventSpy2 = jest.fn();

      service.onContextChange(eventSpy1);
      service.onContextChange(eventSpy2);

      service.setUserId('user-456');

      expect(eventSpy1).toHaveBeenCalled();
      expect(eventSpy2).toHaveBeenCalled();
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large context objects efficiently', () => {
      const largeMetadata: Record<string, string> = {};
      for (let i = 0; i < 1000; i++) {
        largeMetadata[`key${i}`] = `value${i}`;
      }

      const startTime = Date.now();
      service.setRequestMetadata(largeMetadata);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
      expect(service.getRequestMetadata()).toEqual(largeMetadata);
    });

    it('should clean up event listeners', () => {
      const eventSpy = jest.fn();
      const unsubscribe = service.onContextChange(eventSpy);

      service.setOrganizationId('org-123');
      expect(eventSpy).toHaveBeenCalledTimes(1);

      unsubscribe();
      service.setOrganizationId('org-456');
      expect(eventSpy).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });
});
