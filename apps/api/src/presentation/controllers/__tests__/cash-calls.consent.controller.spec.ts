import { Test, TestingModule } from '@nestjs/testing';
import { CashCallsController } from '../cash-calls.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RecordCashCallConsentDto } from '../../dtos/record-cash-call-consent.dto';

class CommandBusMock {
  execute = jest.fn(() => Promise.resolve('consented-id'));
}
class QueryBusMock {
  execute = jest.fn(() => Promise.resolve({}));
}

describe('CashCallsController consent', () => {
  let controller: CashCallsController;
  let commandBus: CommandBusMock;
  let queryBus: QueryBusMock;

  beforeEach(async () => {
    commandBus = new CommandBusMock();
    queryBus = new QueryBusMock();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CashCallsController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    controller = module.get<CashCallsController>(CashCallsController);
  });

  it('records consent', async () => {
    const dto: RecordCashCallConsentDto = {
      organizationId: 'org-1',
      status: 'RECEIVED',
      receivedAt: '2025-01-15',
    };
    const res = await controller.recordConsent('id-1', dto);
    expect(res.id).toBe('consented-id');
    expect(commandBus.execute).toHaveBeenCalled();
  });
});
