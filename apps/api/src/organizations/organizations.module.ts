import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsRepositoryImpl } from './infrastructure/organizations.repository';
import { DatabaseModule } from '../database/database.module';
import { TenantModule } from '../common/tenant/tenant.module';
import { ValidationModule } from '../common/validation/validation.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [
    DatabaseModule,
    TenantModule,
    ValidationModule,
    AuthorizationModule,
  ],
  controllers: [OrganizationsController],
  providers: [
    OrganizationsService,
    {
      provide: 'OrganizationsRepository',
      useClass: OrganizationsRepositoryImpl,
    },
  ],
  exports: [OrganizationsService],
})
export class OrganizationsModule {
  // Organizations module for tenant management
}
