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
import { TitleOpinionRepositoryImpl } from './title-opinion.repository';
import { CurativeItemRepositoryImpl } from './curative-item.repository';
import { ChainOfTitleRepositoryImpl } from './chain-of-title.repository';
import { TitleOpinionDocumentRepositoryImpl } from './title-opinion-document.repository';
import { CurativeItemDocumentRepositoryImpl } from './curative-item-document.repository';
import { LosRepository } from './lease-operating-statement.repository';

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

    // Title Management Repositories
    {
      provide: 'TitleOpinionRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new TitleOpinionRepositoryImpl(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'CurativeItemRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new CurativeItemRepositoryImpl(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'ChainOfTitleRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new ChainOfTitleRepositoryImpl(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'TitleOpinionDocumentRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new TitleOpinionDocumentRepositoryImpl(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'CurativeItemDocumentRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new CurativeItemDocumentRepositoryImpl(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'LosRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new LosRepository(databaseConnection);
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
    'TitleOpinionRepository',
    'CurativeItemRepository',
    'ChainOfTitleRepository',
    'TitleOpinionDocumentRepository',
    'CurativeItemDocumentRepository',
    'LosRepository',
  ],
})
export class RepositoryModule {
  // This module provides repository implementations with proper dependency injection
  // All repositories are configured with factory providers to ensure proper database connection
}
