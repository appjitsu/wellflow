import { Injectable, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  organizationId: string;
  userId?: string;
  userRole?: string;
}

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private static als = new AsyncLocalStorage<TenantContext>();

  /**
   * Set the tenant context for the current request
   */
  setContext(context: TenantContext): void {
    TenantContextService.als.enterWith(context);
  }

  /**
   * Get the current tenant context
   */
  getContext(): TenantContext | undefined {
    return TenantContextService.als.getStore();
  }

  /**
   * Get the current organization ID
   */
  getOrganizationId(): string {
    const context = this.getContext();
    if (!context?.organizationId) {
      throw new Error(
        'No organization context found. Ensure tenant context is set.',
      );
    }
    return context.organizationId;
  }

  /**
   * Get the current user ID
   */
  getUserId(): string | undefined {
    return this.getContext()?.userId;
  }

  /**
   * Get the current user role
   */
  getUserRole(): string | undefined {
    return this.getContext()?.userRole;
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    return this.getUserRole() === role;
  }

  /**
   * Check if user is owner
   */
  isOwner(): boolean {
    return this.hasRole('owner');
  }

  /**
   * Check if user is manager
   */
  isManager(): boolean {
    return this.hasRole('manager');
  }

  /**
   * Check if user is pumper
   */
  isPumper(): boolean {
    return this.hasRole('pumper');
  }

  /**
   * Run a function within a specific tenant context
   */
  async runInContext<T>(
    context: TenantContext,
    fn: () => Promise<T> | T,
  ): Promise<T> {
    return TenantContextService.als.run(context, fn);
  }

  /**
   * Create a filter for database queries to ensure tenant isolation
   */
  createTenantFilter(): { organizationId: string } {
    return {
      organizationId: this.getOrganizationId(),
    };
  }

  /**
   * Validate that the provided organization ID matches the current context
   */
  validateOrganizationAccess(organizationId: string): void {
    const currentOrgId = this.getOrganizationId();
    if (currentOrgId !== organizationId) {
      throw new Error('Access denied: Organization mismatch');
    }
  }
}
