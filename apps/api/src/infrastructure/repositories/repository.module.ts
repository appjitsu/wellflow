import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { DatabaseService } from '../../database/database.service';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../../database/schema';
import { UnitOfWork } from './unit-of-work';
import { AuditLogService } from '../../application/services/audit-log.service';

// Repository Implementations
import { OwnerPaymentRepository } from './owner-payment.repository';
import { CashCallRepository } from './cash-call.repository';
import { JoaRepository } from './joa.repository';
import { JibStatementRepository } from './jib-statement.repository';
import { OrganizationRepository } from './organization.repository';
import { WellRepositoryImpl } from './well.repository';
import { AfeDomainRepository } from './afe-domain.repository';
import { AfeApprovalDomainRepository } from './afe-approval-domain.repository';
import { LeaseRepository } from './lease.repository';
import { ProductionRepository } from './production.repository';
import { TitleOpinionRepositoryImpl } from './title-opinion.repository';
import { CurativeItemRepositoryImpl } from './curative-item.repository';
import { ChainOfTitleRepositoryImpl } from './chain-of-title.repository';
import { TitleOpinionDocumentRepositoryImpl } from './title-opinion-document.repository';
import { CurativeItemDocumentRepositoryImpl } from './curative-item-document.repository';
import { LosRepository } from './lease-operating-statement.repository';
import { DrillingProgramRepository } from './drilling-program.repository';
import { WorkoverRepository } from './workover.repository';
import { DailyDrillingReportRepository } from './daily-drilling-report.repository';
import { MaintenanceScheduleRepository } from './maintenance-schedule.repository';
import { PartnersRepositoryImpl } from '../../partners/infrastructure/partners.repository';
import { RegulatoryUnitOfWork } from './regulatory-unit-of-work';
import { HSEIncidentRepositoryImpl } from './hse-incident.repository';
import { EnvironmentalMonitoringRepositoryImpl } from './environmental-monitoring.repository';
import { RegulatoryReportRepositoryImpl } from './regulatory-report.repository';
import { RegulatoryDomainEventPublisher } from '../../domain/shared/regulatory-domain-event-publisher';
import { AuditLogRepositoryImpl } from './audit-log.repository';
import { RegulatoryOutboxService } from '../events/regulatory-outbox.service';

/**
 * Repository Module
 * Provides all repository implementations with proper dependency injection
 */
@Module({
  imports: [DatabaseModule],
  providers: [
    // Unit of Work Pattern
    UnitOfWork,

    // Services
    AuditLogService,
    RegulatoryDomainEventPublisher,
    RegulatoryOutboxService,

    // Repositories
    {
      provide: 'AuditLogRepository',
      useClass: AuditLogRepositoryImpl,
    },
    {
      // eslint-disable-next-line no-secrets/no-secrets
      provide: 'RegulatoryEventPublisher',
      useClass: RegulatoryOutboxService,
    },

    // Financial Repositories
    {
      provide: 'OwnerPaymentRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new OwnerPaymentRepository(databaseService);
      },
      inject: [DatabaseService],
    },
    {
      provide: 'CashCallRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new CashCallRepository(databaseService);
      },
      inject: [DatabaseService],
    },
    {
      provide: 'JoaRepository',
      useClass: JoaRepository,
    },
    {
      provide: 'JibStatementRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new JibStatementRepository(databaseService);
      },
      inject: [DatabaseService],
    },
    // Core Repositories
    {
      provide: 'OrganizationRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new OrganizationRepository(databaseService);
      },
      inject: [DatabaseService],
    },
    {
      provide: 'WellRepository',
      useFactory: (
        databaseService: DatabaseService,
        auditLogService: AuditLogService,
      ) => {
        return new WellRepositoryImpl(databaseService, auditLogService);
      },
      inject: [DatabaseService, AuditLogService],
    },
    {
      provide: 'AfeRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new AfeDomainRepository(databaseService);
      },
      inject: [DatabaseService],
    },
    {
      provide: 'AfeApprovalRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new AfeApprovalDomainRepository(databaseService);
      },
      inject: [DatabaseService],
    },
    {
      provide: 'ProductionRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new ProductionRepository(databaseService);
      },
      inject: [DatabaseService],
    },

    // Additional repositories can be added here as needed
    {
      provide: 'LeaseRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new LeaseRepository(databaseService);
      },
      inject: [DatabaseService],
    },
    {
      provide: 'PartnersRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new PartnersRepositoryImpl(databaseService);
      },
      inject: [DatabaseService],
    },

    // Title Management Repositories
    {
      provide: 'TitleOpinionRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new TitleOpinionRepositoryImpl(databaseService);
      },
      inject: [DatabaseService],
    },
    {
      provide: 'CurativeItemRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new CurativeItemRepositoryImpl(databaseService);
      },
      inject: [DatabaseService],
    },
    {
      provide: 'ChainOfTitleRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new ChainOfTitleRepositoryImpl(databaseService);
      },
      inject: [DatabaseService],
    },
    {
      provide: 'TitleOpinionDocumentRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new TitleOpinionDocumentRepositoryImpl(databaseService);
      },
      inject: [DatabaseService],
    },
    {
      provide: 'CurativeItemDocumentRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new CurativeItemDocumentRepositoryImpl(databaseService);
      },
      inject: [DatabaseService],
    },
    {
      provide: 'LosRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new LosRepository(databaseService);
      },
      inject: [DatabaseService],
    },
    // Operational Entities Repositories
    {
      provide: 'DrillingProgramRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new DrillingProgramRepository(databaseService);
      },
      inject: [DatabaseService],
    },
    {
      provide: 'WorkoverRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new WorkoverRepository(databaseService);
      },
      inject: [DatabaseService],
    },
    {
      provide: 'DailyDrillingReportRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new DailyDrillingReportRepository(databaseService);
      },
      inject: [DatabaseService],
    },
    {
      provide: 'MaintenanceScheduleRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new MaintenanceScheduleRepository(databaseService);
      },
      inject: [DatabaseService],
    },

    // Regulatory Repositories
    {
      // eslint-disable-next-line no-secrets/no-secrets
      provide: 'RegulatoryUnitOfWork',
      useFactory: (
        databaseService: DatabaseService,
        eventPublisher: RegulatoryDomainEventPublisher,
      ) => {
        return new RegulatoryUnitOfWork(databaseService, eventPublisher);
      },
      inject: [DatabaseService, RegulatoryDomainEventPublisher],
    },
    {
      provide: 'HSEIncidentRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new HSEIncidentRepositoryImpl(databaseService);
      },
      inject: [DatabaseService],
    },
    {
      provide: 'EnvironmentalMonitoringRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new EnvironmentalMonitoringRepositoryImpl(databaseService);
      },
      inject: [DatabaseService],
    },
    {
      provide: 'RegulatoryReportRepository',
      useFactory: (databaseService: DatabaseService) => {
        return new RegulatoryReportRepositoryImpl(databaseService);
      },
      inject: [DatabaseService],
    },
  ],
  exports: [
    UnitOfWork,
    AuditLogService,
    RegulatoryDomainEventPublisher,
    'AuditLogRepository',
    // eslint-disable-next-line no-secrets/no-secrets
    'RegulatoryEventPublisher',
    'OwnerPaymentRepository',
    'CashCallRepository',
    'JoaRepository',
    'JibStatementRepository',
    'OrganizationRepository',
    'WellRepository',
    'AfeRepository',
    'AfeApprovalRepository',
    'LeaseRepository',
    'ProductionRepository',
    'TitleOpinionRepository',
    'CurativeItemRepository',
    'ChainOfTitleRepository',
    'TitleOpinionDocumentRepository',
    'CurativeItemDocumentRepository',
    'LosRepository',
    'DrillingProgramRepository',
    'WorkoverRepository',
    'DailyDrillingReportRepository',
    'MaintenanceScheduleRepository',
    'PartnersRepository',
    // eslint-disable-next-line no-secrets/no-secrets
    'RegulatoryUnitOfWork',
    'HSEIncidentRepository',
    'EnvironmentalMonitoringRepository',
    'RegulatoryReportRepository',
  ],
})
export class RepositoryModule {
  // This module provides repository implementations with proper dependency injection
  // All repositories are configured with factory providers to ensure proper database connection
}
