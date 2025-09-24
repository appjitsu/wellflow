import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../database/database.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { RepositoryModule } from '../infrastructure/repositories/repository.module';

// Controllers
import { AfesController } from '../presentation/controllers/afes.controller';

// Command Handlers
import { CreateAfeHandler } from '../application/handlers/create-afe.handler';
import { SubmitAfeHandler } from '../application/handlers/submit-afe.handler';
import { ApproveAfeHandler } from '../application/handlers/approve-afe.handler';
import { CreateAfeApprovalHandler } from '../application/handlers/create-afe-approval.handler';

// Query Handlers
import { GetAfeByIdHandler } from '../application/handlers/get-afe-by-id.handler';
import { GetAfesByOrganizationHandler } from '../application/handlers/get-afes-by-organization.handler';
import { GetAfesRequiringApprovalHandler } from '../application/handlers/get-afes-requiring-approval.handler';

// Domain Services
import { AfeApprovalWorkflowService } from '../domain/services/afe-approval-workflow.service';

// Repository Implementations (would be created in infrastructure layer)
// For now, we'll use placeholder implementations
const CommandHandlers = [
  CreateAfeHandler,
  SubmitAfeHandler,
  ApproveAfeHandler,
  CreateAfeApprovalHandler,
];

const QueryHandlers = [
  GetAfeByIdHandler,
  GetAfesByOrganizationHandler,
  GetAfesRequiringApprovalHandler,
];

const DomainServices = [AfeApprovalWorkflowService];

// Repositories are now provided by RepositoryModule

/**
 * AFEs Module
 * Aggregates all AFE-related functionality including:
 * - AFE creation, submission, approval workflow
 * - Partner approval management
 * - Authorization and audit logging
 * - CQRS command/query handling
 */
@Module({
  imports: [CqrsModule, DatabaseModule, AuthorizationModule, RepositoryModule],
  controllers: [AfesController],
  providers: [...CommandHandlers, ...QueryHandlers, ...DomainServices],
  exports: [...DomainServices],
})
export class AfesModule {
  // This module handles AFE management functionality for oil & gas operations
  // including partner approval workflows and regulatory compliance
}
