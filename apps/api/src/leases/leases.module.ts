import { Module } from '@nestjs/common';
import { LeasesService } from './leases.service';
import { LeasesController } from './leases.controller';
import { DatabaseModule } from '../database/database.module';
import { RepositoryModule } from '../infrastructure/repositories/repository.module';
import { TenantModule } from '../common/tenant/tenant.module';
import { ValidationModule } from '../common/validation/validation.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [
    DatabaseModule,
    RepositoryModule,
    TenantModule,
    ValidationModule,
    AuthorizationModule,
  ],
  controllers: [LeasesController],
  providers: [LeasesService],
  exports: [LeasesService],
})
export class LeasesModule {
  // Leases module for lease management
}
