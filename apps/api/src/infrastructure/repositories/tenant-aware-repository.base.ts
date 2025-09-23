import { Injectable, Inject } from '@nestjs/common';
import { eq, and, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgColumn } from 'drizzle-orm/pg-core';
import type { ITenantContextManager } from '../../application/interfaces/tenant-isolation-strategy.interface';
import { TenantAccessDeniedError } from '../../domain/errors/tenant-access-denied.error';
import * as schema from '../../database/schema';

/**
 * Base class for tenant-aware repositories
 * Follows Repository Pattern with automatic tenant isolation
 * Implements Template Method Pattern for common operations
 *
 * Note: This is a simplified version that provides utility methods
 * Concrete repositories should extend this and implement specific table operations
 */
@Injectable()
export abstract class TenantAwareRepositoryBase<
  T extends { organizationId: string },
> {
  constructor(
    protected readonly db: NodePgDatabase<typeof schema>,
    @Inject('ITenantContextManager')
    protected readonly tenantContextManager: ITenantContextManager,
    protected readonly entityName: string,
  ) {}

  /**
   * Get the current organization ID with validation
   */
  protected getCurrentOrganizationId(): string {
    return this.tenantContextManager.getOrganizationId();
  }

  /**
   * Create tenant filter for queries
   * Subclasses should override this to provide table-specific filtering
   */
  protected createTenantFilter(organizationIdColumn: PgColumn): SQL {
    const organizationId = this.getCurrentOrganizationId();
    return eq(organizationIdColumn, organizationId);
  }

  /**
   * Create combined filter with tenant isolation
   */
  protected createFilterWithTenant(
    organizationIdColumn: PgColumn,
    additionalFilter?: SQL,
  ): SQL | undefined {
    const tenantFilter = this.createTenantFilter(organizationIdColumn);

    if (additionalFilter) {
      return and(tenantFilter, additionalFilter);
    }

    return tenantFilter;
  }

  /**
   * Ensure entity has correct organization ID
   */
  protected ensureEntityTenant(entity: Partial<T>): T {
    const organizationId = this.getCurrentOrganizationId();

    return {
      ...entity,
      organizationId,
    } as T;
  }

  /**
   * Create a tenant filter object for use in queries
   */
  protected createTenantFilterObject(): { organizationId: string } {
    const organizationId = this.getCurrentOrganizationId();
    return { organizationId };
  }

  /**
   * Handle errors consistently across repository operations
   */
  protected handleRepositoryError(operation: string, error: unknown): never {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to ${operation} ${this.entityName}:`, error);
    throw new Error(
      `Failed to ${operation} ${this.entityName}: ${errorMessage}`,
    );
  }

  /**
   * Execute a database operation within tenant context
   * Provides a safe way to run queries with automatic error handling
   */
  protected async executeWithTenantContext<R>(
    operation: () => Promise<R>,
    operationName: string,
  ): Promise<R> {
    try {
      return await operation();
    } catch (error) {
      this.handleRepositoryError(operationName, error);
    }
  }

  /**
   * Validate that an entity belongs to the current tenant
   * Useful for checking entities retrieved from other sources
   */
  protected validateEntityBelongsToTenant(entity: T): void {
    const currentOrgId = this.getCurrentOrganizationId();

    if (entity.organizationId !== currentOrgId) {
      throw TenantAccessDeniedError.organizationMismatch(
        currentOrgId,
        entity.organizationId,
      );
    }
  }

  /**
   * Get database instance for custom queries
   * Use this when you need to perform complex queries not covered by the base methods
   */
  protected getDatabase(): NodePgDatabase<typeof schema> {
    return this.db;
  }

  /**
   * Log repository operations for debugging and auditing
   */
  protected logOperation(
    operation: string,
    details?: Record<string, unknown>,
  ): void {
    try {
      const organizationId = this.tenantContextManager.getOrganizationId();
      console.log(`Repository ${operation}:`, {
        entity: this.entityName,
        organizationId,
        ...details,
      });
    } catch {
      console.log(`Repository ${operation}:`, {
        entity: this.entityName,
        tenant: 'no-context',
        ...details,
      });
    }
  }
}
