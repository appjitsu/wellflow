import { Test, TestingModule } from '@nestjs/testing';
import { CashCallsController } from '../cash-calls.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateCashCallDto } from '../../dtos/create-cash-call.dto';

class CommandBusMock {
  execute = jest.fn(() => Promise.resolve('new-cashcall-id'));
}
class QueryBusMock {
  execute = jest.fn(() => Promise.resolve({ id: 'id-1' }));
}

describe('CashCallsController', () => {
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

  it('creates cash call', async () => {
    const dto: CreateCashCallDto = {
      organizationId: 'org-1',
      leaseId: 'lease-1',
      partnerId: 'partner-1',
      billingMonth: '2025-01-01',
      amount: '100.00',
      type: 'MONTHLY',
      dueDate: '2025-01-15',
      interestRatePercent: '12.00',
      consentRequired: true,
    } as CreateCashCallDto;
    const res = await controller.create(dto);
    expect(res.id).toBe('new-cashcall-id');
    expect(commandBus.execute).toHaveBeenCalled();
  });

  it('gets by id', async () => {
    const res = await controller.getById('id-1');
    expect(res.id).toBe('id-1');
    expect(queryBus.execute).toHaveBeenCalled();
  });
});
