import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { DatabaseModule } from '../database/database.module';
import { TenantModule } from '../common/tenant/tenant.module';
import { ValidationModule } from '../common/validation/validation.module';

@Module({
  imports: [DatabaseModule, TenantModule, ValidationModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {
  // Organizations module for tenant management
}
