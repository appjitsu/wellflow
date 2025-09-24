import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../../database/schema';

// Repository Implementations
import { OrganizationRepository } from './organization.repository';
import { WellRepositoryImpl } from './well.repository';
import { AfeDomainRepository } from './afe-domain.repository';
import { AfeApprovalDomainRepository } from './afe-approval-domain.repository';
import { LeaseRepository } from './lease.repository';
import { ProductionRepository } from './production.repository';

/**
 * Repository Module
 * Provides all repository implementations with proper dependency injection
 */
@Module({
  imports: [DatabaseModule],
  providers: [
    // Core Repositories
    {
      provide: 'OrganizationRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new OrganizationRepository(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'WellRepository',
      useClass: WellRepositoryImpl,
    },
    {
      provide: 'AfeRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new AfeDomainRepository(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'AfeApprovalRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new AfeApprovalDomainRepository(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'ProductionRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new ProductionRepository(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },

    // Additional repositories can be added here as needed
    {
      provide: 'LeaseRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new LeaseRepository(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
  ],
  exports: [
    'OrganizationRepository',
    'WellRepository',
    'AfeRepository',
    'AfeApprovalRepository',
    'LeaseRepository',
    'ProductionRepository',
  ],
})
export class RepositoryModule {
  // This module provides repository implementations with proper dependency injection
  // All repositories are configured with factory providers to ensure proper database connection
}
