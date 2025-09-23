import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { TenantContextService, TenantContext } from './tenant-context.service';

/**
 * Service that integrates tenant context with Row Level Security
 * Automatically sets PostgreSQL session variables when tenant context changes
 */
@Injectable()
export class TenantRlsService {
  constructor(
    @Inject(forwardRef(() => DatabaseService))
    private readonly databaseService: DatabaseService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Set tenant context and corresponding database RLS context
   */
  async setTenantContext(context: TenantContext): Promise<void> {
    // Set the application-level tenant context
    this.tenantContextService.setContext(context);

    // Set the database-level RLS context
    await this.databaseService.setOrganizationContext(context.organizationId);
  }

  /**
   * Clear tenant context and database RLS context
   */
  async clearTenantContext(): Promise<void> {
    await this.databaseService.clearOrganizationContext();
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
      return await this.tenantContextService.runInContext(context, operation);
    } finally {
      // Clean up database context
      await this.clearTenantContext();
    }
  }

  /**
   * Get the current tenant context
   */
  getTenantContext(): TenantContext | undefined {
    return this.tenantContextService.getContext();
  }

  /**
   * Get the current organization ID
   */
  getOrganizationId(): string {
    return this.tenantContextService.getOrganizationId();
  }

  /**
   * Validate organization access
   */
  validateOrganizationAccess(organizationId: string): void {
    this.tenantContextService.validateOrganizationAccess(organizationId);
  }

  /**
   * Create a tenant filter for database queries
   */
  createTenantFilter(): { organizationId: string } {
    return this.tenantContextService.createTenantFilter();
  }

  /**
   * Check if the current database context matches the application context
   */
  async validateContextSync(): Promise<boolean> {
    try {
      const appOrgId = this.tenantContextService.getOrganizationId();
      const dbOrgId = await this.databaseService.getCurrentOrganizationId();
      return appOrgId === dbOrgId;
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
      await this.databaseService.setOrganizationContext(context.organizationId);
    } else {
      await this.databaseService.clearOrganizationContext();
    }
  }
}
