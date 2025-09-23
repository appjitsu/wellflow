import { Injectable, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { ITenantContextManager } from '../../application/interfaces/tenant-isolation-strategy.interface';
import { TenantContext } from '../../domain/value-objects/tenant-context.vo';
import { TenantIsolationDomainService } from '../../domain/services/tenant-isolation.domain-service';
import { TenantAccessDeniedError } from '../../domain/errors/tenant-access-denied.error';

/**
 * Tenant context manager implementation using AsyncLocalStorage
 * Follows Single Responsibility Principle and Request Scope
 */
@Injectable({ scope: Scope.REQUEST })
export class TenantContextManagerService implements ITenantContextManager {
  private static als = new AsyncLocalStorage<TenantContext | undefined>();

  constructor(
    private readonly tenantIsolationDomainService: TenantIsolationDomainService,
  ) {}

  /**
   * Set the tenant context for the current request
   */
  setContext(context: TenantContext): void {
    // Validate context using domain service
    this.tenantIsolationDomainService.validateTenantContext(context);

    // Set context in AsyncLocalStorage
    TenantContextManagerService.als.enterWith(context);
  }

  /**
   * Get the current tenant context
   */
  getContext(): TenantContext | null {
    return TenantContextManagerService.als.getStore() || null;
  }

  /**
   * Clear the tenant context
   */
  clearContext(): void {
    // Create empty context to clear AsyncLocalStorage
    TenantContextManagerService.als.enterWith(undefined);
  }

  /**
   * Execute an operation within a specific tenant context
   */
  async executeInContext<T>(
    context: TenantContext,
    operation: () => Promise<T> | T,
  ): Promise<T> {
    // Validate context before execution
    this.tenantIsolationDomainService.validateTenantContext(context);

    return TenantContextManagerService.als.run(context, operation);
  }

  /**
   * Get the current organization ID
   */
  getOrganizationId(): string {
    const context = this.getContext();

    if (!context?.organizationId) {
      throw TenantAccessDeniedError.missingContext();
    }

    return context.organizationId;
  }

  /**
   * Get the current user ID
   */
  getUserId(): string {
    const context = this.getContext();

    if (!context?.userId) {
      throw TenantAccessDeniedError.missingContext();
    }

    return context.userId;
  }

  /**
   * Get the current user role
   */
  getUserRole(): string {
    const context = this.getContext();

    if (!context?.userRole) {
      throw TenantAccessDeniedError.missingContext();
    }

    return context.userRole;
  }

  /**
   * Validate organization access
   */
  validateOrganizationAccess(organizationId: string): void {
    const context = this.getContext();

    if (!context) {
      throw TenantAccessDeniedError.missingContext();
    }

    this.tenantIsolationDomainService.validateTenantAccess(
      context,
      organizationId,
    );
  }

  /**
   * Check if current user has specific permission
   */
  hasPermission(permission: string): boolean {
    const context = this.getContext();

    if (!context) {
      return false;
    }

    return context.hasPermission(permission);
  }

  /**
   * Check if current user is admin
   */
  isAdmin(): boolean {
    const context = this.getContext();
    return context?.isAdmin() ?? false;
  }

  /**
   * Check if current user is owner
   */
  isOwner(): boolean {
    const context = this.getContext();
    return context?.isOwner() ?? false;
  }

  /**
   * Create a tenant filter for database queries
   */
  createTenantFilter(): { organizationId: string } {
    const organizationId = this.getOrganizationId();
    return this.tenantIsolationDomainService.createTenantFilter(organizationId);
  }

  /**
   * Validate that the current user can perform an action
   */
  validateAction(action: string, resourceOrgId?: string): void {
    const context = this.getContext();

    if (!context) {
      throw TenantAccessDeniedError.missingContext();
    }

    const canPerform = this.tenantIsolationDomainService.canPerformAction(
      context,
      action,
      resourceOrgId,
    );

    if (!canPerform) {
      throw TenantAccessDeniedError.insufficientPermissions(
        context.userId,
        resourceOrgId || context.organizationId,
        action,
      );
    }
  }

  /**
   * Get effective organization ID (handles admin access to other orgs)
   */
  getEffectiveOrganizationId(requestedOrgId?: string): string {
    const context = this.getContext();

    if (!context) {
      throw TenantAccessDeniedError.missingContext();
    }

    return this.tenantIsolationDomainService.getEffectiveOrganizationId(
      context,
      requestedOrgId,
    );
  }

  /**
   * Check if context is properly set and valid
   */
  isContextValid(): boolean {
    try {
      const context = this.getContext();

      if (!context) {
        return false;
      }

      this.tenantIsolationDomainService.validateTenantContext(context);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get context summary for logging (without sensitive data)
   */
  getContextSummary(): {
    organizationId?: string;
    userId?: string;
    userRole?: string;
    hasContext: boolean;
  } {
    const context = this.getContext();

    return {
      organizationId: context?.organizationId,
      userId: context?.userId,
      userRole: context?.userRole,
      hasContext: !!context,
    };
  }

  /**
   * Create a new context with additional permissions
   */
  extendContextWithPermissions(additionalPermissions: string[]): void {
    const currentContext = this.getContext();

    if (!currentContext) {
      throw TenantAccessDeniedError.missingContext();
    }

    const extendedContext = currentContext.withPermissions(
      additionalPermissions,
    );
    this.setContext(extendedContext);
  }

  /**
   * Create a new context with metadata
   */
  extendContextWithMetadata(metadata: Record<string, unknown>): void {
    const currentContext = this.getContext();

    if (!currentContext) {
      throw TenantAccessDeniedError.missingContext();
    }

    const extendedContext = currentContext.withMetadata(metadata);
    this.setContext(extendedContext);
  }
}
