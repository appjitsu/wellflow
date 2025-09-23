import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ITenantIsolationStrategy } from '../../application/interfaces/tenant-isolation-strategy.interface';
import { TenantContext } from '../../domain/value-objects/tenant-context.vo';
import { TenantAccessDeniedError } from '../../domain/errors/tenant-access-denied.error';
import { DatabaseConnectionService } from './database-connection.service';

/**
 * Row Level Security implementation of tenant isolation strategy
 * Follows Strategy Pattern and Single Responsibility Principle
 */
@Injectable()
export class RlsTenantIsolationStrategy implements ITenantIsolationStrategy {
  private currentContext: TenantContext | null = null;

  constructor(
    @Inject(forwardRef(() => DatabaseConnectionService))
    private readonly databaseConnectionService: DatabaseConnectionService,
  ) {}

  /**
   * Set tenant context using PostgreSQL RLS
   */
  async setTenantContext(context: TenantContext): Promise<void> {
    try {
      const pool = this.databaseConnectionService.getConnectionPool();

      // Switch to application_role to enable RLS policies
      await pool.query('SET ROLE application_role');

      // Set the organization context for RLS policies
      await pool.query('SELECT set_config($1, $2, false)', [
        'app.current_organization_id',
        context.organizationId,
      ]);

      // Set additional context variables for auditing
      await pool.query('SELECT set_config($1, $2, false)', [
        'app.current_user_id',
        context.userId,
      ]);

      await pool.query('SELECT set_config($1, $2, false)', [
        'app.current_user_role',
        context.userRole,
      ]);

      // Store context in memory for quick access
      this.currentContext = context;

      console.log(
        `RLS tenant context set: org=${context.organizationId}, user=${context.userId}, role=${context.userRole}`,
      );
    } catch (error) {
      console.error('Failed to set RLS tenant context:', error);
      throw new TenantAccessDeniedError(
        `Failed to set RLS tenant context: ${error instanceof Error ? error.message : String(error)}`,
        context.organizationId,
        context.userId,
      );
    }
  }

  /**
   * Clear tenant context and reset to superuser role
   */
  async clearTenantContext(): Promise<void> {
    try {
      const pool = this.databaseConnectionService.getConnectionPool();

      // Reset to superuser role (disables RLS)
      await pool.query('RESET ROLE');

      // Clear session variables
      await pool.query('SELECT set_config($1, NULL, false)', [
        'app.current_organization_id',
      ]);
      await pool.query('SELECT set_config($1, NULL, false)', [
        'app.current_user_id',
      ]);
      await pool.query('SELECT set_config($1, NULL, false)', [
        'app.current_user_role',
      ]);

      // Clear in-memory context
      this.currentContext = null;

      console.log('RLS tenant context cleared');
    } catch (error) {
      console.error('Failed to clear RLS tenant context:', error);
      throw new TenantAccessDeniedError(
        `Failed to clear RLS tenant context: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get current tenant context from database session
   */
  async getCurrentTenantContext(): Promise<TenantContext | null> {
    try {
      // Return cached context if available
      if (this.currentContext) {
        return this.currentContext;
      }

      const pool = this.databaseConnectionService.getConnectionPool();

      // Query session variables
      const result = await pool.query(`
        SELECT 
          current_setting('app.current_organization_id', true) as organization_id,
          current_setting('app.current_user_id', true) as user_id,
          current_setting('app.current_user_role', true) as user_role
      `);

      const row = result.rows[0] as {
        organization_id?: string;
        user_id?: string;
        user_role?: string;
      };

      if (!row?.organization_id || !row?.user_id || !row?.user_role) {
        return null;
      }

      // Recreate context from session variables
      const context = TenantContext.create({
        organizationId: row.organization_id,
        userId: row.user_id,
        userRole: row.user_role,
      });

      // Cache for future calls
      this.currentContext = context;

      return context;
    } catch (error) {
      console.error('Failed to get current RLS tenant context:', error);
      return null;
    }
  }

  /**
   * Execute operation within specific tenant context
   */
  async executeInTenantContext<T>(
    context: TenantContext,
    operation: () => Promise<T>,
  ): Promise<T> {
    // Save current context
    const previousContext = this.currentContext;

    try {
      // Set new context
      await this.setTenantContext(context);

      // Execute operation
      return await operation();
    } finally {
      // Restore previous context or clear if none existed
      if (previousContext) {
        await this.setTenantContext(previousContext);
      } else {
        await this.clearTenantContext();
      }
    }
  }

  /**
   * Validate that current context matches expected context
   */
  async validateTenantContext(
    expectedContext: TenantContext,
  ): Promise<boolean> {
    try {
      const currentContext = await this.getCurrentTenantContext();

      if (!currentContext) {
        return false;
      }

      return currentContext.equals(expectedContext);
    } catch (error) {
      console.error('Failed to validate RLS tenant context:', error);
      return false;
    }
  }

  /**
   * Get strategy name for identification
   */
  getStrategyName(): string {
    return 'RLS_STRATEGY';
  }

  /**
   * Validate that RLS is properly configured
   */
  async validateRlsConfiguration(): Promise<boolean> {
    try {
      const pool = this.databaseConnectionService.getConnectionPool();

      // Check if application_role exists
      const roleResult = await pool.query(`
        SELECT 1 FROM pg_roles WHERE rolname = 'application_role'
      `);

      if (roleResult.rows.length === 0) {
        console.error(
          'application_role not found - RLS not properly configured',
        );
        return false;
      }

      // Check if RLS policies exist
      const policyResult = await pool.query(`
        SELECT COUNT(*) as policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
        AND policyname LIKE 'tenant_isolation_%'
      `);

      const policyCount = parseInt(
        (policyResult as { rows: { policy_count: string }[] }).rows[0]
          ?.policy_count || '0',
      );
      if (policyCount === 0) {
        console.error('No RLS policies found - RLS not properly configured');
        return false;
      }

      console.log(`RLS configuration validated: ${policyCount} policies found`);
      return true;
    } catch (error) {
      console.error('Failed to validate RLS configuration:', error);
      return false;
    }
  }
}
