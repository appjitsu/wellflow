import { Module } from '@nestjs/common';
import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';
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
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService],
})
export class ProductionModule {
  // Production module for production record management
}
