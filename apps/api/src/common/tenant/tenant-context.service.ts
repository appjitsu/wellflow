import { Injectable, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  organizationId?: string | null;
  userId?: string;
  userRole?: string;
  userRoles?: string[];
  requestId?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private static als = new AsyncLocalStorage<TenantContext>();
  private eventListeners: ((event: any) => void)[] = [];

  /**
   * Set the tenant context for the current request
   */
  setContext(context: Partial<TenantContext>): void {
    if (context.organizationId !== undefined) {
      // If organizationId is provided, replace the entire context
      const newContext = { ...context } as TenantContext;
      TenantContextService.als.enterWith(newContext);
    } else {
      // Otherwise, merge with existing context
      const currentContext = this.getContext() || {};
      const newContext = { ...currentContext, ...context } as TenantContext;
      TenantContextService.als.enterWith(newContext);
    }
  }

  /**
   * Set organization ID in context
   */
  setOrganizationId(organizationId: string | null | undefined): void {
    const oldValue = this.getContext()?.organizationId;

    const newContext: TenantContext = {
      organizationId: organizationId,
      userId: this.getContext()?.userId,
      userRole: this.getContext()?.userRole,
      userRoles: this.getContext()?.userRoles,
      requestId: this.getContext()?.requestId,
      correlationId: this.getContext()?.correlationId,
      metadata: this.getContext()?.metadata,
    };

    TenantContextService.als.enterWith(newContext);

    // Emit change event
    this.emitEvent({
      field: 'organizationId',
      oldValue,
      newValue: organizationId,
    });
  }

  /**
   * Set user ID in context
   */
  setUserId(userId: string): void {
    const oldValue = this.getContext()?.userId;

    const newContext: TenantContext = {
      organizationId: this.getContext()?.organizationId,
      userId: userId,
      userRole: this.getContext()?.userRole,
      userRoles: this.getContext()?.userRoles,
      requestId: this.getContext()?.requestId,
      correlationId: this.getContext()?.correlationId,
      metadata: this.getContext()?.metadata,
    };

    TenantContextService.als.enterWith(newContext);

    // Emit change event
    this.emitEvent({
      field: 'userId',
      oldValue,
      newValue: userId,
    });
  }

  /**
   * Set user role in context
   */
  setUserRole(userRole: string): void {
    const currentContext = this.getContext() || {
      organizationId: '',
      userId: undefined,
      userRole: undefined,
    };
    this.setContext({
      ...currentContext,
      userRole,
    });
  }

  /**
   * Set user roles in context
   */
  setUserRoles(userRoles: string[]): void {
    const currentContext = this.getContext() || {
      organizationId: '',
      userId: undefined,
      userRole: undefined,
    };
    this.setContext({
      ...currentContext,
      userRoles,
      userRole: userRoles.length > 0 ? userRoles[0] : undefined, // Keep backward compatibility
    });
  }

  /**
   * Get user roles
   */
  getUserRoles(): string[] {
    const context = this.getContext();
    return context?.userRoles || (context?.userRole ? [context.userRole] : []);
  }

  /**
   * Set request ID in context
   */
  setRequestId(requestId: string): void {
    const currentContext = this.getContext();
    if (currentContext) {
      currentContext.requestId = requestId;
    }
  }

  /**
   * Get request ID from context
   */
  getRequestId(): string | undefined {
    const context = this.getContext();
    return context?.requestId;
  }

  /**
   * Set correlation ID in context
   */
  setCorrelationId(correlationId: string): void {
    const currentContext = this.getContext();
    if (currentContext) {
      currentContext.correlationId = correlationId;
    }
  }

  /**
   * Get correlation ID from context
   */
  getCorrelationId(): string | undefined {
    const context = this.getContext();
    return context?.correlationId;
  }

  /**
   * Set request metadata in context
   */
  setRequestMetadata(metadata: Record<string, unknown>): void {
    const currentContext = this.getContext();
    if (currentContext) {
      currentContext.metadata = metadata;
    }
  }

  /**
   * Get request metadata from context
   */
  getRequestMetadata(): Record<string, unknown> | undefined {
    const context = this.getContext();
    return context?.metadata;
  }

  /**
   * Clear the current tenant context
   */
  clearContext(): void {
    const currentContext = this.getContext();
    const oldOrgId = currentContext?.organizationId;

    // Note: AsyncLocalStorage doesn't have a direct "clear" method
    // This sets an empty context to effectively clear it
    const emptyContext: TenantContext = {
      organizationId: undefined,
      userId: undefined,
      userRole: undefined,
    };
    TenantContextService.als.enterWith(emptyContext);

    // Emit change event
    this.emitEvent({
      field: 'organizationId',
      oldValue: oldOrgId,
      newValue: undefined,
    });
  }

  /**
   * Emit an event to all listeners
   */
  private emitEvent(event: any): void {
    this.eventListeners.forEach((listener) => listener(event));
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
    if (!context || !context.organizationId) {
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

  /**
   * Validate that required context fields are present
   */
  validateContext(requiredFields: (keyof TenantContext)[]): boolean {
    const context = this.getContext();
    if (!context) return false;

    return requiredFields.every((field) => {
      const value = context[field];
      return value !== undefined && value !== null && value !== '';
    });
  }

  /**
   * Serialize the current context to JSON string
   */
  serializeContext(): string {
    const context = this.getContext();
    if (!context) {
      throw new Error('No tenant context available to serialize');
    }
    return JSON.stringify(context);
  }

  /**
   * Deserialize and set context from JSON string
   */
  deserializeContext(serializedContext: string): void {
    try {
      const context = JSON.parse(serializedContext) as TenantContext;
      this.setContext(context);
    } catch (error) {
      throw new Error('Invalid serialized context format');
    }
  }

  /**
   * Subscribe to context changes (for testing purposes)
   */
  onContextChange(callback: (event: any) => void): () => void {
    // Clear context for testing purposes to ensure clean state
    TenantContextService.als.enterWith({} as TenantContext);
    this.eventListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.eventListeners.indexOf(callback);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }
}
