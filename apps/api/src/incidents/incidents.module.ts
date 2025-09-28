import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TenantInfrastructureModule } from '../infrastructure/tenant/tenant-infrastructure.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { DrizzleEnvironmentalIncidentRepository } from '../infrastructure/repositories/environmental-incident.repository';

@Module({
  imports: [DatabaseModule, TenantInfrastructureModule, AuthorizationModule],
  controllers: [IncidentsController],
  providers: [
    IncidentsService,
    {
      provide: 'EnvironmentalIncidentRepository',
      useClass: DrizzleEnvironmentalIncidentRepository,
    },
  ],
})
export class IncidentsModule {}
