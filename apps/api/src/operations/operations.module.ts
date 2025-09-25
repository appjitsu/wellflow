import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../database/database.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { RepositoryModule } from '../infrastructure/repositories/repository.module';
import { OutboxService } from '../infrastructure/events/outbox.service';

// Controllers
import { DrillingProgramsController } from '../presentation/controllers/drilling-programs.controller';
import { WorkoversController } from '../presentation/controllers/workovers.controller';
import { DailyDrillingReportsController } from '../presentation/controllers/daily-drilling-reports.controller';
import { MaintenanceSchedulesController } from '../presentation/controllers/maintenance-schedules.controller';

// Handlers
import { CreateDrillingProgramHandler } from '../application/handlers/create-drilling-program.handler';
import { GetDrillingProgramByIdHandler } from '../application/handlers/get-drilling-program-by-id.handler';
import { GetDrillingProgramsByOrganizationHandler } from '../application/handlers/get-drilling-programs-by-organization.handler';

import { CreateWorkoverHandler } from '../application/handlers/create-workover.handler';
import { GetWorkoverByIdHandler } from '../application/handlers/get-workover-by-id.handler';
import { GetWorkoversByOrganizationHandler } from '../application/handlers/get-workovers-by-organization.handler';

import { CreateDailyDrillingReportHandler } from '../application/handlers/create-daily-drilling-report.handler';
import { SubmitDailyDrillingReportHandler } from '../application/handlers/submit-daily-drilling-report.handler';
import { GetDailyDrillingReportByIdHandler } from '../application/handlers/get-daily-drilling-report-by-id.handler';
import { GetDailyDrillingReportsByOrganizationHandler } from '../application/handlers/get-daily-drilling-reports-by-organization.handler';

import { CreateMaintenanceScheduleHandler } from '../application/handlers/create-maintenance-schedule.handler';
import { CompleteMaintenanceScheduleHandler } from '../application/handlers/complete-maintenance-schedule.handler';
import { GetMaintenanceScheduleByIdHandler } from '../application/handlers/get-maintenance-schedule-by-id.handler';
import { GetMaintenanceSchedulesByOrganizationHandler } from '../application/handlers/get-maintenance-schedules-by-organization.handler';

const CommandHandlers = [
  CreateDrillingProgramHandler,
  CreateWorkoverHandler,
  CreateDailyDrillingReportHandler,
  SubmitDailyDrillingReportHandler,
  CreateMaintenanceScheduleHandler,
  CompleteMaintenanceScheduleHandler,
];
const QueryHandlers = [
  GetDrillingProgramByIdHandler,
  GetDrillingProgramsByOrganizationHandler,
  GetWorkoverByIdHandler,
  GetWorkoversByOrganizationHandler,
  GetDailyDrillingReportByIdHandler,
  GetDailyDrillingReportsByOrganizationHandler,
  GetMaintenanceScheduleByIdHandler,
  GetMaintenanceSchedulesByOrganizationHandler,
];

@Module({
  imports: [CqrsModule, DatabaseModule, AuthorizationModule, RepositoryModule],
  controllers: [
    DrillingProgramsController,
    WorkoversController,
    DailyDrillingReportsController,
    MaintenanceSchedulesController,
  ],
  providers: [...CommandHandlers, ...QueryHandlers, OutboxService],
})
export class OperationsModule {}
