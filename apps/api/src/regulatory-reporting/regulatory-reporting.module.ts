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

@Module({
  imports: [CqrsModule, RepositoryModule],
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
      useClass: DrizzleReportInstanceRepository,
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
