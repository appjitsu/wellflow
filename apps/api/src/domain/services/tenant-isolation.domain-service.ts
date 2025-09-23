import { Injectable } from '@nestjs/common';
import { TenantContext } from '../value-objects/tenant-context.vo';
import { TenantAccessDeniedError } from '../errors/tenant-access-denied.error';

/**
 * Domain service for tenant isolation business logic
 * Follows DDD principles and contains core business rules
 */
@Injectable()
export class TenantIsolationDomainService {
  /**
   * Validate that a user has access to a specific organization
   */
  validateTenantAccess(
    userContext: TenantContext,
    requestedOrganizationId: string,
  ): void {
    if (!userContext.organizationId) {
      throw new TenantAccessDeniedError('No organization context found');
    }

    if (userContext.organizationId !== requestedOrganizationId) {
      throw new TenantAccessDeniedError(
        `Access denied: User belongs to organization ${userContext.organizationId} but requested access to ${requestedOrganizationId}`,
      );
    }
  }

  /**
   * Determine if a user can access multiple organizations (admin users)
   */
  canAccessMultipleOrganizations(context: TenantContext): boolean {
    return context.userRole === 'super_admin' || context.userRole === 'admin';
  }

  /**
   * Get the effective organization ID for a user
   * Handles cases where admin users might access different organizations
   */
  getEffectiveOrganizationId(
    context: TenantContext,
    requestedOrgId?: string,
  ): string {
    if (requestedOrgId && this.canAccessMultipleOrganizations(context)) {
      return requestedOrgId;
    }

    if (!context.organizationId) {
      throw new TenantAccessDeniedError('No organization context available');
    }

    return context.organizationId;
  }

  /**
   * Validate tenant context completeness
   */
  validateTenantContext(context: TenantContext): void {
    if (!context.organizationId) {
      throw new TenantAccessDeniedError('Organization ID is required');
    }

    if (!context.userId) {
      throw new TenantAccessDeniedError('User ID is required');
    }

    if (!context.userRole) {
      throw new TenantAccessDeniedError('User role is required');
    }
  }

  /**
   * Create a tenant filter for database queries
   * This is a domain rule that all tenant-specific data must be filtered
   */
  createTenantFilter(organizationId: string): { organizationId: string } {
    if (!organizationId) {
      throw new TenantAccessDeniedError(
        'Cannot create tenant filter without organization ID',
      );
    }

    return { organizationId };
  }

  /**
   * Determine if two tenant contexts represent the same tenant
   */
  isSameTenant(context1: TenantContext, context2: TenantContext): boolean {
    return context1.organizationId === context2.organizationId;
  }

  /**
   * Business rule: Check if a user can perform an action in a tenant context
   */
  canPerformAction(
    context: TenantContext,
    action: string,
    resourceOrgId?: string,
  ): boolean {
    // Validate basic context
    if (!context.organizationId || !context.userRole) {
      return false;
    }

    // If resource belongs to different organization, check admin privileges
    if (resourceOrgId && resourceOrgId !== context.organizationId) {
      return this.canAccessMultipleOrganizations(context);
    }

    // Role-based action validation (can be extended)
    const rolePermissions: Record<string, string[]> = {
      owner: ['read', 'write', 'delete', 'admin'],
      manager: ['read', 'write'],
      pumper: ['read', 'write_production'],
      viewer: ['read'],
    };

    const allowedActions = rolePermissions[context.userRole] || [];
    return allowedActions.includes(action);
  }
}
