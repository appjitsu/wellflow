import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from './tenant.guard';
import { TenantContextService } from './tenant-context.service';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let tenantContextService: jest.Mocked<TenantContextService>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;

  beforeEach(async () => {
    const mockTenantContextService = {
      setContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantGuard,
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
        {
          provide: Reflector,
          useValue: {},
        },
      ],
    }).compile();

    guard = module.get<TenantGuard>(TenantGuard);
    tenantContextService = module.get(TenantContextService);

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
      }),
    } as any;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return false when user is not authenticated', () => {
      const mockRequest = {
        user: undefined,
      };
      (
        mockExecutionContext.switchToHttp()
          .getRequest as jest.MockedFunction<any>
      ).mockReturnValue(mockRequest);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
      expect(tenantContextService.setContext).not.toHaveBeenCalled();
    });

    it('should return false when user is null', () => {
      const mockRequest = {
        user: null,
      };
      (
        mockExecutionContext.switchToHttp()
          .getRequest as jest.MockedFunction<any>
      ).mockReturnValue(mockRequest);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
      expect(tenantContextService.setContext).not.toHaveBeenCalled();
    });

    it('should set tenant context and return true when user is authenticated', () => {
      const user = {
        id: 'user-1',
        organizationId: 'org-1',
        role: 'operator',
      };

      const mockRequest = { user };
      (
        mockExecutionContext.switchToHttp()
          .getRequest as jest.MockedFunction<any>
      ).mockReturnValue(mockRequest);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(tenantContextService.setContext).toHaveBeenCalledWith({
        organizationId: 'org-1',
        userId: 'user-1',
        userRole: 'operator',
      });
    });

    it('should handle different user roles', () => {
      const user = {
        id: 'user-2',
        organizationId: 'org-2',
        role: 'admin',
      };

      const mockRequest = { user };
      (
        mockExecutionContext.switchToHttp()
          .getRequest as jest.MockedFunction<any>
      ).mockReturnValue(mockRequest);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(tenantContextService.setContext).toHaveBeenCalledWith({
        organizationId: 'org-2',
        userId: 'user-2',
        userRole: 'admin',
      });
    });

    it('should handle different organization IDs', () => {
      const user = {
        id: 'user-3',
        organizationId: 'different-org',
        role: 'viewer',
      };

      const mockRequest = { user };
      (
        mockExecutionContext.switchToHttp()
          .getRequest as jest.MockedFunction<any>
      ).mockReturnValue(mockRequest);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(tenantContextService.setContext).toHaveBeenCalledWith({
        organizationId: 'different-org',
        userId: 'user-3',
        userRole: 'viewer',
      });
    });

    it('should handle user with minimal required properties', () => {
      const user = {
        id: 'user-4',
        organizationId: 'org-3',
        role: 'auditor',
      };

      const mockRequest = { user };
      (
        mockExecutionContext.switchToHttp()
          .getRequest as jest.MockedFunction<any>
      ).mockReturnValue(mockRequest);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(tenantContextService.setContext).toHaveBeenCalledWith({
        organizationId: 'org-3',
        userId: 'user-4',
        userRole: 'auditor',
      });
    });
  });
});
