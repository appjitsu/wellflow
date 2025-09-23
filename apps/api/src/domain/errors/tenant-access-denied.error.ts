/**
 * Domain error for tenant access violations
 * Follows DDD principles for domain-specific errors
 */
export class TenantAccessDeniedError extends Error {
  constructor(
    message: string,
    public readonly organizationId?: string,
    public readonly userId?: string,
    public readonly requestedResource?: string,
  ) {
    super(message);
    this.name = 'TenantAccessDeniedError';

    // Maintain proper stack trace for debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TenantAccessDeniedError);
    }
  }

  /**
   * Create error for missing tenant context
   */
  static missingContext(): TenantAccessDeniedError {
    return new TenantAccessDeniedError(
      'Tenant context is required but not found. Ensure user is authenticated and tenant context is set.',
    );
  }

  /**
   * Create error for organization mismatch
   */
  static organizationMismatch(
    userOrgId: string,
    requestedOrgId: string,
  ): TenantAccessDeniedError {
    return new TenantAccessDeniedError(
      `Access denied: User belongs to organization ${userOrgId} but requested access to organization ${requestedOrgId}`,
      requestedOrgId,
    );
  }

  /**
   * Create error for insufficient permissions
   */
  static insufficientPermissions(
    userId: string,
    organizationId: string,
    requiredPermission: string,
  ): TenantAccessDeniedError {
    return new TenantAccessDeniedError(
      `Access denied: User ${userId} does not have required permission '${requiredPermission}' in organization ${organizationId}`,
      organizationId,
      userId,
    );
  }

  /**
   * Create error for resource access violation
   */
  static resourceAccessDenied(
    userId: string,
    organizationId: string,
    resourceId: string,
    resourceType: string,
  ): TenantAccessDeniedError {
    return new TenantAccessDeniedError(
      `Access denied: User ${userId} cannot access ${resourceType} ${resourceId} in organization ${organizationId}`,
      organizationId,
      userId,
      `${resourceType}:${resourceId}`,
    );
  }

  /**
   * Convert to a safe object for logging (without sensitive data)
   */
  toLogObject(): {
    name: string;
    message: string;
    organizationId?: string;
    userId?: string;
    requestedResource?: string;
  } {
    return {
      name: this.name,
      message: this.message,
      organizationId: this.organizationId,
      userId: this.userId,
      requestedResource: this.requestedResource,
    };
  }
}
