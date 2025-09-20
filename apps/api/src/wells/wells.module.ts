import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { WellsController } from '../presentation/controllers/wells.controller';
import { CreateWellHandler } from '../application/handlers/create-well.handler';
import { UpdateWellStatusHandler } from '../application/handlers/update-well-status.handler';
import { GetWellByIdHandler } from '../application/handlers/get-well-by-id.handler';
import { GetWellsByOperatorHandler } from '../application/handlers/get-wells-by-operator.handler';
import { WellRepositoryImpl } from '../infrastructure/repositories/well.repository';
import { DatabaseModule } from '../database/database.module';
import { AuthorizationModule } from '../authorization/authorization.module';

const CommandHandlers = [CreateWellHandler, UpdateWellStatusHandler];

const QueryHandlers = [GetWellByIdHandler, GetWellsByOperatorHandler];

const Repositories = [
  {
    provide: 'WellRepository',
    useClass: WellRepositoryImpl,
  },
];

/**
 * Wells Module
 * Aggregates all well-related functionality
 */
@Module({
  imports: [CqrsModule, DatabaseModule, AuthorizationModule],
  controllers: [WellsController],
  providers: [...CommandHandlers, ...QueryHandlers, ...Repositories],
  exports: [...Repositories],
})
export class WellsModule {}
