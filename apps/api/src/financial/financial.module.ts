import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../database/database.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { RepositoryModule } from '../infrastructure/repositories/repository.module';
import { OutboxService } from '../infrastructure/events/outbox.service';

// Controllers
import { OwnerPaymentsController } from '../presentation/controllers/owner-payments.controller';
import { CashCallsController } from '../presentation/controllers/cash-calls.controller';
import { JoasController } from '../presentation/controllers/joas.controller';
import { JibStatementsController } from '../presentation/controllers/jib-statements.controller';

// Handlers
import { CreateOwnerPaymentHandler } from '../application/handlers/create-owner-payment.handler';
import { GetOwnerPaymentByIdHandler } from '../application/handlers/get-owner-payment-by-id.handler';
import { CreateCashCallHandler } from '../application/handlers/create-cash-call.handler';
import { GetCashCallByIdHandler } from '../application/handlers/get-cash-call-by-id.handler';
import { ApproveCashCallHandler } from '../application/handlers/approve-cash-call.handler';
import { RecordCashCallConsentHandler } from '../application/handlers/record-cash-call-consent.handler';
import { UpdateJibLinkCashCallHandler } from '../application/handlers/update-jib-link-cash-call.handler';
import { CreateJibStatementHandler } from '../application/handlers/create-jib-statement.handler';
import { CreateJoaHandler } from '../application/handlers/create-joa.handler';
import { GetJoaByIdHandler } from '../application/handlers/get-joa-by-id.handler';

// Services
import { JibBalanceService } from './jib-balance.service';
import { JibLinkingService } from './jib-linking.service';

const CommandHandlers = [
  CreateOwnerPaymentHandler,
  CreateCashCallHandler,
  ApproveCashCallHandler,
  RecordCashCallConsentHandler,
  CreateJoaHandler,
  UpdateJibLinkCashCallHandler,
  CreateJibStatementHandler,
];
const QueryHandlers = [
  GetOwnerPaymentByIdHandler,
  GetCashCallByIdHandler,
  GetJoaByIdHandler,
];

@Module({
  imports: [CqrsModule, DatabaseModule, AuthorizationModule, RepositoryModule],
  controllers: [
    OwnerPaymentsController,
    CashCallsController,
    JoasController,
    JibStatementsController,
  ],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    OutboxService,
    JibBalanceService,
    JibLinkingService,
  ],
})
export class FinancialModule {}
