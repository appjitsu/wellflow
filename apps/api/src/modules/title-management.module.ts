import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../database/database.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { RepositoryModule } from '../infrastructure/repositories/repository.module';
import { TitleManagementController } from '../presentation/controllers/title-management.controller';

// Handlers
import { CreateTitleOpinionHandler } from '../application/handlers/create-title-opinion.handler';
import { CreateCurativeItemHandler } from '../application/handlers/create-curative-item.handler';
import { AddChainOfTitleEntryHandler } from '../application/handlers/add-chain-of-title-entry.handler';
import { LinkTitleOpinionDocumentHandler } from '../application/handlers/link-title-opinion-document.handler';
import { GetTitleOpinionByIdHandler } from '../application/handlers/get-title-opinion-by-id.handler';
import { GetCurativeItemsByTitleOpinionHandler } from '../application/handlers/get-curative-items-by-title-opinion.handler';
import { GetChainOfTitleByLeaseHandler } from '../application/handlers/get-chain-of-title-by-lease.handler';
import { GetCurativeItemDocumentsHandler } from '../application/handlers/get-curative-item-documents.handler';
import { GetTitleOpinionDocumentsHandler } from '../application/handlers/get-title-opinion-documents.handler';

const CommandHandlers = [
  CreateTitleOpinionHandler,
  CreateCurativeItemHandler,
  AddChainOfTitleEntryHandler,
  LinkTitleOpinionDocumentHandler,
];

const QueryHandlers = [
  GetTitleOpinionByIdHandler,
  GetCurativeItemsByTitleOpinionHandler,
  GetChainOfTitleByLeaseHandler,
  GetCurativeItemDocumentsHandler,
  GetTitleOpinionDocumentsHandler,
];

@Module({
  imports: [CqrsModule, DatabaseModule, AuthorizationModule, RepositoryModule],
  controllers: [TitleManagementController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class TitleManagementModule {}
