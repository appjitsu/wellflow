import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Database Configuration
import { DatabaseConfigModule } from '../database/database-config.module';

// Domain Services
import { TenantIsolationDomainService } from '../../domain/services/tenant-isolation.domain-service';

// Application Use Cases
import {
  SetTenantContextUseCase,
  ClearTenantContextUseCase,
  ValidateTenantAccessUseCase,
} from '../../application/use-cases/set-tenant-context.use-case';

// Infrastructure Services
import { DatabaseConnectionService } from './database-connection.service';
import { RlsTenantIsolationStrategy } from './rls-tenant-isolation.strategy';
import { TenantContextManagerService } from './tenant-context-manager.service';

// Legacy Services (for backward compatibility)
import { TenantRlsService } from '../../common/tenant/tenant-rls.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';

/**
 * Infrastructure module for tenant isolation
 * Follows Clean Architecture and Dependency Injection principles
 */
@Module({
  imports: [ConfigModule, DatabaseConfigModule],
  providers: [
    // Domain Services
    TenantIsolationDomainService,

    // Application Use Cases
    SetTenantContextUseCase,
    ClearTenantContextUseCase,
    ValidateTenantAccessUseCase,

    // Infrastructure Services
    DatabaseConnectionService,
    RlsTenantIsolationStrategy,
    TenantContextManagerService,

    // Interface Bindings (Dependency Inversion)
    {
      provide: 'ITenantIsolationStrategy',
      useClass: RlsTenantIsolationStrategy,
    },
    {
      provide: 'ITenantContextManager',
      useClass: TenantContextManagerService,
    },
    {
      provide: 'IDatabaseConnectionManager',
      useClass: DatabaseConnectionService,
    },

    // Legacy Services (for backward compatibility)
    TenantContextService,
    TenantRlsService,
  ],
  exports: [
    // Domain Services
    TenantIsolationDomainService,

    // Application Use Cases
    SetTenantContextUseCase,
    ClearTenantContextUseCase,
    ValidateTenantAccessUseCase,

    // Infrastructure Services
    DatabaseConnectionService,
    RlsTenantIsolationStrategy,
    TenantContextManagerService,

    // Interface Bindings
    'ITenantIsolationStrategy',
    'ITenantContextManager',
    'IDatabaseConnectionManager',

    // Legacy Services (for backward compatibility)
    TenantContextService,
    TenantRlsService,
  ],
})
export class TenantInfrastructureModule {}

/**
 * Module for tenant-aware repositories
 * Separate module to avoid circular dependencies
 */
@Module({
  imports: [TenantInfrastructureModule],
  providers: [
    // Base repository class will be extended by specific repositories
    // Individual repositories should be provided in their respective modules
  ],
  exports: [TenantInfrastructureModule],
})
export class TenantRepositoryModule {}
