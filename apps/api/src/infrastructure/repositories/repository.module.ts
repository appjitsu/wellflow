import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';

// Repository Implementations
import { OrganizationRepository } from './organization.repository';
import { WellRepositoryImpl } from './well.repository';
import { AfeRepository } from './afe.repository';
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
      useFactory: (databaseConnection: any) => {
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
      useFactory: (databaseConnection: any) => {
        return new AfeRepository(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'ProductionRepository',
      useFactory: (databaseConnection: any) => {
        return new ProductionRepository(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },

    // Additional repositories can be added here as needed
    // Example:
    // {
    //   provide: 'LeaseRepository',
    //   useFactory: (databaseConnection: any) => {
    //     return new LeaseRepository(databaseConnection);
    //   },
    //   inject: ['DATABASE_CONNECTION'],
    // },
  ],
  exports: [
    'OrganizationRepository',
    'WellRepository',
    'AfeRepository',
    'ProductionRepository',
  ],
})
export class RepositoryModule {}
