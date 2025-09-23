import { Injectable, Inject } from '@nestjs/common';
import { TenantContext } from '../../domain/value-objects/tenant-context.vo';
import { TenantIsolationDomainService } from '../../domain/services/tenant-isolation.domain-service';
import type { ITenantIsolationStrategy } from '../interfaces/tenant-isolation-strategy.interface';
import { TenantAccessDeniedError } from '../../domain/errors/tenant-access-denied.error';

/**
 * Use case for setting tenant context
 * Follows Clean Architecture and CQRS principles
 */
@Injectable()
export class SetTenantContextUseCase {
  constructor(
    private readonly tenantIsolationDomainService: TenantIsolationDomainService,
    @Inject('ITenantIsolationStrategy')
    private readonly tenantIsolationStrategy: ITenantIsolationStrategy,
  ) {}

  /**
   * Execute the use case to set tenant context
   */
  async execute(params: {
    organizationId: string;
    userId: string;
    userRole: string;
    permissions?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      // Create tenant context value object
      const tenantContext = TenantContext.create({
        organizationId: params.organizationId,
        userId: params.userId,
        userRole: params.userRole,
        permissions: params.permissions,
        metadata: params.metadata,
      });

      // Validate tenant context using domain service
      this.tenantIsolationDomainService.validateTenantContext(tenantContext);

      // Set context using the configured strategy
      await this.tenantIsolationStrategy.setTenantContext(tenantContext);

      // Log successful context setting (for audit purposes)
      console.log(
        `Tenant context set successfully: ${tenantContext.toString()}`,
      );
    } catch (error) {
      // Log error for debugging
      console.error('Failed to set tenant context:', error);

      // Re-throw domain errors as-is
      if (error instanceof TenantAccessDeniedError) {
        throw error;
      }

      // Wrap other errors in domain error
      throw new TenantAccessDeniedError(
        `Failed to set tenant context: ${error instanceof Error ? error.message : String(error)}`,
        params.organizationId,
        params.userId,
      );
    }
  }

  /**
   * Execute with validation against existing context
   */
  async executeWithValidation(params: {
    organizationId: string;
    userId: string;
    userRole: string;
    permissions?: string[];
    metadata?: Record<string, unknown>;
    validateAgainstExisting?: boolean;
  }): Promise<void> {
    // Get current context if validation is requested
    if (params.validateAgainstExisting) {
      const currentContext =
        await this.tenantIsolationStrategy.getCurrentTenantContext();

      if (currentContext) {
        // Validate that the new context is compatible with existing
        this.tenantIsolationDomainService.validateTenantAccess(
          currentContext,
          params.organizationId,
        );
      }
    }

    // Execute the main use case
    await this.execute(params);
  }
}

/**
 * Use case for clearing tenant context
 */
@Injectable()
export class ClearTenantContextUseCase {
  constructor(
    @Inject('ITenantIsolationStrategy')
    private readonly tenantIsolationStrategy: ITenantIsolationStrategy,
  ) {}

  /**
   * Execute the use case to clear tenant context
   */
  async execute(): Promise<void> {
    try {
      await this.tenantIsolationStrategy.clearTenantContext();
      console.log('Tenant context cleared successfully');
    } catch (error) {
      console.error('Failed to clear tenant context:', error);
      throw new TenantAccessDeniedError(
        `Failed to clear tenant context: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

/**
 * Use case for validating tenant access
 */
@Injectable()
export class ValidateTenantAccessUseCase {
  constructor(
    private readonly tenantIsolationDomainService: TenantIsolationDomainService,
    @Inject('ITenantIsolationStrategy')
    private readonly tenantIsolationStrategy: ITenantIsolationStrategy,
  ) {}

  /**
   * Execute the use case to validate tenant access
   */
  async execute(params: {
    requestedOrganizationId: string;
    requiredPermission?: string;
    resourceId?: string;
    resourceType?: string;
  }): Promise<boolean> {
    try {
      // Get current tenant context
      const currentContext =
        await this.tenantIsolationStrategy.getCurrentTenantContext();

      if (!currentContext) {
        throw TenantAccessDeniedError.missingContext();
      }

      // Validate organization access
      this.tenantIsolationDomainService.validateTenantAccess(
        currentContext,
        params.requestedOrganizationId,
      );

      // Validate specific permission if required
      if (params.requiredPermission) {
        const canPerform = this.tenantIsolationDomainService.canPerformAction(
          currentContext,
          params.requiredPermission,
          params.requestedOrganizationId,
        );

        if (!canPerform) {
          throw TenantAccessDeniedError.insufficientPermissions(
            currentContext.userId,
            params.requestedOrganizationId,
            params.requiredPermission,
          );
        }
      }

      return true;
    } catch (error) {
      if (error instanceof TenantAccessDeniedError) {
        throw error;
      }

      throw new TenantAccessDeniedError(
        `Tenant access validation failed: ${error instanceof Error ? error.message : String(error)}`,
        params.requestedOrganizationId,
      );
    }
  }
}
