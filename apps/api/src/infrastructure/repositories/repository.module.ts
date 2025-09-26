import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
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
      useClass: OwnerPaymentRepository,
    },
    {
      provide: 'CashCallRepository',
      useClass: CashCallRepository,
    },
    {
      provide: 'JoaRepository',
      useClass: JoaRepository,
    },
    {
      provide: 'JibStatementRepository',
      useClass: JibStatementRepository,
    },
    // Core Repositories
    {
      provide: 'OrganizationRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new OrganizationRepository(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'WellRepository',
      useFactory: (
        databaseConnection: NodePgDatabase<typeof schema>,
        auditLogService: AuditLogService,
      ) => {
        return new WellRepositoryImpl(databaseConnection, auditLogService);
      },
      inject: ['DATABASE_CONNECTION', AuditLogService],
    },
    {
      provide: 'AfeRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new AfeDomainRepository(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'AfeApprovalRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new AfeApprovalDomainRepository(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'ProductionRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new ProductionRepository(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },

    // Additional repositories can be added here as needed
    {
      provide: 'LeaseRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new LeaseRepository(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'PartnersRepository',
      useClass: PartnersRepositoryImpl,
    },

    // Title Management Repositories
    {
      provide: 'TitleOpinionRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new TitleOpinionRepositoryImpl(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'CurativeItemRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new CurativeItemRepositoryImpl(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'ChainOfTitleRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new ChainOfTitleRepositoryImpl(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'TitleOpinionDocumentRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new TitleOpinionDocumentRepositoryImpl(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'CurativeItemDocumentRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new CurativeItemDocumentRepositoryImpl(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'LosRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new LosRepository(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    // Operational Entities Repositories
    {
      provide: 'DrillingProgramRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new DrillingProgramRepository(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'WorkoverRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new WorkoverRepository(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'DailyDrillingReportRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new DailyDrillingReportRepository(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'MaintenanceScheduleRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new MaintenanceScheduleRepository(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },

    // Regulatory Repositories
    {
      // eslint-disable-next-line no-secrets/no-secrets
      provide: 'RegulatoryUnitOfWork',
      useFactory: (
        databaseConnection: NodePgDatabase<typeof schema>,
        eventPublisher: RegulatoryDomainEventPublisher,
      ) => {
        return new RegulatoryUnitOfWork(databaseConnection, eventPublisher);
      },
      inject: ['DATABASE_CONNECTION', RegulatoryDomainEventPublisher],
    },
    {
      provide: 'HSEIncidentRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new HSEIncidentRepositoryImpl(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'EnvironmentalMonitoringRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new EnvironmentalMonitoringRepositoryImpl(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
    },
    {
      provide: 'RegulatoryReportRepository',
      useFactory: (databaseConnection: NodePgDatabase<typeof schema>) => {
        return new RegulatoryReportRepositoryImpl(databaseConnection);
      },
      inject: ['DATABASE_CONNECTION'],
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
