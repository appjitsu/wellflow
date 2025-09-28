import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RegulatoryReportingController } from './regulatory-reporting.controller';
import { ReportGenerationService } from './application/services/report-generation.service';
import { ReportSubmissionService } from './application/services/report-submission.service';
import { ReportValidationService } from './application/services/report-validation.service';
import { GenerateRegulatoryReportHandler } from './application/handlers/generate-regulatory-report.handler';
import { SubmitRegulatoryReportHandler } from './application/handlers/submit-regulatory-report.handler';
import { ValidateRegulatoryReportHandler } from './application/handlers/validate-regulatory-report.handler';
import { TxRrcPrAdapter } from './infrastructure/adapters/tx-rrc-pr.adapter';
import { AdapterRegistryService } from './application/services/adapter-registry.service';
import { CircuitBreaker } from '../common/resilience/circuit-breaker';
import { RepositoryModule } from '../infrastructure/repositories/repository.module';
import { NormalizedProductionService } from './application/services/normalized-production.service';
import { DrizzleReportInstanceRepository } from './infrastructure/repositories/drizzle-report-instance.repository';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { TenantInfrastructureModule } from '../infrastructure/tenant/tenant-infrastructure.module';
import { AuthorizationModule } from '../authorization/authorization.module';

@Module({
  imports: [
    CqrsModule,
    RepositoryModule,
    DatabaseModule,
    TenantInfrastructureModule,
    AuthorizationModule,
  ],
  controllers: [RegulatoryReportingController],
  providers: [
    // Services & Handlers
    ReportGenerationService,
    ReportSubmissionService,
    ReportValidationService,
    NormalizedProductionService,
    GenerateRegulatoryReportHandler,
    SubmitRegulatoryReportHandler,
    ValidateRegulatoryReportHandler,
    AdapterRegistryService,
    // Adapters
    TxRrcPrAdapter,
    // Repository binding (Drizzle-backed)
    {
      provide: 'ReportInstanceRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new DrizzleReportInstanceRepository(databaseService);
      },
      inject: [DatabaseService],
    },
    // Circuit breaker with simple defaults (refine per env)
    {
      provide: CircuitBreaker,
      useValue: new CircuitBreaker({
        failureThreshold: 3,
        recoveryTimeoutMs: 30000,
        halfOpenMaxCalls: 2,
      }),
    },
  ],
  exports: [],
})
export class RegulatoryReportingModule {}
