import { Test, TestingModule } from '@nestjs/testing';
import { CashCallsController } from '../cash-calls.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

class CommandBusMock {
  execute = jest.fn(() => Promise.resolve('approved-id'));
}
class QueryBusMock {
  execute = jest.fn(() => Promise.resolve({}));
}

describe('CashCallsController approval', () => {
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

  it('approves a cash call', async () => {
    const res = await controller.approve('id-1', 'org-1');
    expect(res.id).toBe('approved-id');
    expect(commandBus.execute).toHaveBeenCalled();
  });
});
