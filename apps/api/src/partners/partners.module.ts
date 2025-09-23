import { Module } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { PartnersController } from './partners.controller';
import { PartnersRepositoryImpl } from './infrastructure/partners.repository';
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
  controllers: [PartnersController],
  providers: [
    PartnersService,
    {
      provide: 'PartnersRepository',
      useClass: PartnersRepositoryImpl,
    },
  ],
  exports: [PartnersService],
})
export class PartnersModule {}
