import { Injectable, Inject } from '@nestjs/common';
import { TenantContext } from '../../domain/value-objects/tenant-context.vo';
import {
  SetTenantContextUseCase,
  ClearTenantContextUseCase,
  ValidateTenantAccessUseCase,
} from '../../application/use-cases/set-tenant-context.use-case';
import type {
  ITenantContextManager,
  ITenantIsolationStrategy,
} from '../../application/interfaces/tenant-isolation-strategy.interface';
// Legacy imports for backward compatibility
import {
  TenantContextService,
  TenantContext as LegacyTenantContext,
} from './tenant-context.service';

/**
 * Service that integrates tenant context with Row Level Security
 * Now follows Clean Architecture and SOLID principles
 * Acts as a facade for tenant-related operations
 */
@Injectable()
export class TenantRlsService {
  constructor(
    private readonly setTenantContextUseCase: SetTenantContextUseCase,
    private readonly clearTenantContextUseCase: ClearTenantContextUseCase,
    private readonly validateTenantAccessUseCase: ValidateTenantAccessUseCase,
    @Inject('ITenantContextManager')
    private readonly tenantContextManager: ITenantContextManager,
    @Inject('ITenantIsolationStrategy')
    private readonly tenantIsolationStrategy: ITenantIsolationStrategy,
    // Legacy service for backward compatibility
    private readonly legacyTenantContextService: TenantContextService,
  ) {}

  /**
   * Set tenant context using Clean Architecture approach
   */
  async setTenantContext(
    context: TenantContext | LegacyTenantContext,
  ): Promise<void> {
    // Convert legacy context to new value object if needed
    const tenantContext =
      context instanceof TenantContext
        ? context
        : TenantContext.fromPlainObject(context);

    // Use the use case to set context
    await this.setTenantContextUseCase.execute({
      organizationId: tenantContext.organizationId,
      userId: tenantContext.userId,
      userRole: tenantContext.userRole,
      permissions: tenantContext.permissions,
      metadata: tenantContext.metadata,
    });

    // Also set in legacy service for backward compatibility
    this.legacyTenantContextService.setContext(context as LegacyTenantContext);
  }

  /**
   * Clear tenant context using Clean Architecture approach
   */
  async clearTenantContext(): Promise<void> {
    await this.clearTenantContextUseCase.execute();
  }

  /**
   * Run a function within a specific tenant context with RLS enabled
   */
  async runInTenantContext<T>(
    context: TenantContext,
    operation: () => Promise<T>,
  ): Promise<T> {
    // Set both application and database contexts
    await this.setTenantContext(context);

    try {
      return await this.legacyTenantContextService.runInContext(
        context as LegacyTenantContext,
        operation,
      );
    } finally {
      // Clean up database context
      await this.clearTenantContext();
    }
  }

  /**
   * Get the current tenant context
   */
  getTenantContext(): LegacyTenantContext | undefined {
    return this.legacyTenantContextService.getContext();
  }

  /**
   * Get the current organization ID
   */
  getOrganizationId(): string {
    return this.legacyTenantContextService.getOrganizationId();
  }

  /**
   * Validate organization access
   */
  validateOrganizationAccess(organizationId: string): void {
    this.legacyTenantContextService.validateOrganizationAccess(organizationId);
  }

  /**
   * Create a tenant filter for database queries
   */
  createTenantFilter(): { organizationId: string } {
    return this.legacyTenantContextService.createTenantFilter();
  }

  /**
   * Check if the current database context matches the application context
   */
  async validateContextSync(): Promise<boolean> {
    try {
      const currentContext =
        await this.tenantIsolationStrategy.getCurrentTenantContext();
      const legacyContext = this.legacyTenantContextService.getContext();

      if (!currentContext || !legacyContext) {
        return !currentContext && !legacyContext; // Both null/undefined = synced
      }

      return currentContext.organizationId === legacyContext.organizationId;
    } catch (error) {
      console.error('Failed to validate context sync:', error);
      return false;
    }
  }

  /**
   * Sync database context with application context
   * Useful for ensuring RLS is properly set after context changes
   */
  async syncDatabaseContext(): Promise<void> {
    const context = this.getTenantContext();
    if (context) {
      await this.setTenantContext(context);
    } else {
      await this.clearTenantContext();
    }
  }
}
