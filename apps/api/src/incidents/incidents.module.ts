import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { DrizzleEnvironmentalIncidentRepository } from '../infrastructure/repositories/environmental-incident.repository';

@Module({
  imports: [DatabaseModule],
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
