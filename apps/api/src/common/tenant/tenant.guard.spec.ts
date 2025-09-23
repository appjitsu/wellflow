import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from './tenant.guard';
import { TenantContextService } from './tenant-context.service';
import { TenantRlsService } from './tenant-rls.service';
import { SetTenantContextUseCase } from '../../application/use-cases/set-tenant-context.use-case';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let tenantRlsService: jest.Mocked<TenantRlsService>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;

  beforeEach(async () => {
    const mockTenantRlsService = {
      enableRls: jest.fn(),
      disableRls: jest.fn(),
      setTenantContext: jest.fn(),
    };

    const mockSetTenantContextUseCase = {
      execute: jest.fn(),
    };

    const mockTenantContextService = {
      setContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantGuard,
        {
          provide: TenantRlsService,
          useValue: mockTenantRlsService,
        },
        {
          provide: SetTenantContextUseCase,
          useValue: mockSetTenantContextUseCase,
        },
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
    tenantRlsService = module.get(TenantRlsService);

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
    it('should return false when user is not authenticated', async () => {
      const mockRequest = {
        user: undefined,
      };
      (
        mockExecutionContext.switchToHttp()
          .getRequest as jest.MockedFunction<any>
      ).mockReturnValue(mockRequest);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
      expect(tenantRlsService.setTenantContext).not.toHaveBeenCalled();
    });

    it('should return false when user is null', async () => {
      const mockRequest = {
        user: null,
      };
      (
        mockExecutionContext.switchToHttp()
          .getRequest as jest.MockedFunction<any>
      ).mockReturnValue(mockRequest);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
      expect(tenantRlsService.setTenantContext).not.toHaveBeenCalled();
    });

    it('should set tenant context and return true when user is authenticated', async () => {
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

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(tenantRlsService.setTenantContext).toHaveBeenCalledWith({
        organizationId: 'org-1',
        userId: 'user-1',
        userRole: 'operator',
      });
    });

    it('should handle different user roles', async () => {
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

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(tenantRlsService.setTenantContext).toHaveBeenCalledWith({
        organizationId: 'org-2',
        userId: 'user-2',
        userRole: 'admin',
      });
    });

    it('should handle different organization IDs', async () => {
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

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(tenantRlsService.setTenantContext).toHaveBeenCalledWith({
        organizationId: 'different-org',
        userId: 'user-3',
        userRole: 'viewer',
      });
    });

    it('should handle user with minimal required properties', async () => {
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

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(tenantRlsService.setTenantContext).toHaveBeenCalledWith({
        organizationId: 'org-3',
        userId: 'user-4',
        userRole: 'auditor',
      });
    });
  });
});
