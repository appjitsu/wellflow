import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../database/database.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { RepositoryModule } from '../infrastructure/repositories/repository.module';

// Controllers
import { LeaseOperatingStatementsController } from '../presentation/controllers/lease-operating-statements.controller';

// Command Handlers
import { CreateLosHandler } from '../application/handlers/create-los.handler';
import { AddLosExpenseHandler } from '../application/handlers/add-los-expense.handler';
import { FinalizeLosHandler } from '../application/handlers/finalize-los.handler';
import { DistributeLosHandler } from '../application/handlers/distribute-los.handler';

// Query Handlers
import { GetLosByIdHandler } from '../application/handlers/get-los-by-id.handler';
import { GetLosByOrganizationHandler } from '../application/handlers/get-los-by-organization.handler';
import { GetLosByLeaseHandler } from '../application/handlers/get-los-by-lease.handler';
import { GetLosExpenseSummaryHandler } from '../application/handlers/get-los-expense-summary.handler';

const CommandHandlers = [
  CreateLosHandler,
  AddLosExpenseHandler,
  FinalizeLosHandler,
  DistributeLosHandler,
];

const QueryHandlers = [
  GetLosByIdHandler,
  GetLosByOrganizationHandler,
  GetLosByLeaseHandler,
  GetLosExpenseSummaryHandler,
];

/**
 * Lease Operating Statements Module
 * Aggregates all LOS-related functionality including:
 * - LOS creation and expense management
 * - Finalization and distribution workflow
 * - Expense reporting and analytics
 * - Authorization and audit logging
 * - CQRS command/query handling
 */
@Module({
  imports: [CqrsModule, DatabaseModule, AuthorizationModule, RepositoryModule],
  controllers: [LeaseOperatingStatementsController],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [],
})
export class LeaseOperatingStatementsModule {
  // This module handles Lease Operating Statement management functionality
  // for oil & gas operations including monthly expense tracking and reporting
}
