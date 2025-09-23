/**
 * Value Object for Tenant Context
 * Immutable representation of tenant-related information
 * Follows DDD principles for value objects
 */
export class TenantContext {
  private constructor(
    private readonly _organizationId: string,
    private readonly _userId: string,
    private readonly _userRole: string,
    private readonly _permissions?: string[],
    private readonly _metadata?: Record<string, unknown>,
  ) {
    this.validate();
  }

  /**
   * Factory method to create a new TenantContext
   */
  static create(params: {
    organizationId: string;
    userId: string;
    userRole: string;
    permissions?: string[];
    metadata?: Record<string, unknown>;
  }): TenantContext {
    return new TenantContext(
      params.organizationId,
      params.userId,
      params.userRole,
      params.permissions,
      params.metadata,
    );
  }

  /**
   * Factory method to create from plain object (for compatibility)
   */
  static fromPlainObject(obj: {
    organizationId: string;
    userId?: string;
    userRole?: string;
    permissions?: string[];
    metadata?: Record<string, unknown>;
  }): TenantContext {
    return new TenantContext(
      obj.organizationId,
      obj.userId || '',
      obj.userRole || 'viewer',
      obj.permissions,
      obj.metadata,
    );
  }

  private validate(): void {
    if (!this._organizationId?.trim()) {
      throw new Error('Organization ID is required and cannot be empty');
    }

    if (!this._userId?.trim()) {
      throw new Error('User ID is required and cannot be empty');
    }

    if (!this._userRole?.trim()) {
      throw new Error('User role is required and cannot be empty');
    }

    // Validate role is one of the allowed values
    const allowedRoles = [
      'owner',
      'manager',
      'pumper',
      'viewer',
      'admin',
      'super_admin',
    ];
    if (!allowedRoles.includes(this._userRole)) {
      throw new Error(`Invalid user role: ${this._userRole}`);
    }
  }

  // Getters (immutable access)
  get organizationId(): string {
    return this._organizationId;
  }

  get userId(): string {
    return this._userId;
  }

  get userRole(): string {
    return this._userRole;
  }

  get permissions(): string[] {
    return this._permissions ? [...this._permissions] : [];
  }

  get metadata(): Record<string, unknown> {
    return this._metadata ? { ...this._metadata } : {};
  }

  /**
   * Check if this context has a specific permission
   */
  hasPermission(permission: string): boolean {
    return this._permissions?.includes(permission) ?? false;
  }

  /**
   * Check if this context represents an admin user
   */
  isAdmin(): boolean {
    return this._userRole === 'admin' || this._userRole === 'super_admin';
  }

  /**
   * Check if this context represents an owner
   */
  isOwner(): boolean {
    return this._userRole === 'owner';
  }

  /**
   * Create a new context with additional permissions
   */
  withPermissions(additionalPermissions: string[]): TenantContext {
    const newPermissions = [
      ...(this._permissions || []),
      ...additionalPermissions,
    ];

    return new TenantContext(
      this._organizationId,
      this._userId,
      this._userRole,
      newPermissions,
      this._metadata,
    );
  }

  /**
   * Create a new context with metadata
   */
  withMetadata(metadata: Record<string, unknown>): TenantContext {
    return new TenantContext(
      this._organizationId,
      this._userId,
      this._userRole,
      this._permissions,
      { ...this._metadata, ...metadata },
    );
  }

  /**
   * Convert to plain object for serialization
   */
  toPlainObject(): {
    organizationId: string;
    userId: string;
    userRole: string;
    permissions?: string[];
    metadata?: Record<string, unknown>;
  } {
    return {
      organizationId: this._organizationId,
      userId: this._userId,
      userRole: this._userRole,
      permissions: this._permissions,
      metadata: this._metadata,
    };
  }

  /**
   * Value object equality comparison
   */
  equals(other: TenantContext): boolean {
    return (
      this._organizationId === other._organizationId &&
      this._userId === other._userId &&
      this._userRole === other._userRole &&
      JSON.stringify(this._permissions) ===
        JSON.stringify(other._permissions) &&
      JSON.stringify(this._metadata) === JSON.stringify(other._metadata)
    );
  }

  /**
   * String representation for debugging
   */
  toString(): string {
    return `TenantContext(org=${this._organizationId}, user=${this._userId}, role=${this._userRole})`;
  }
}
