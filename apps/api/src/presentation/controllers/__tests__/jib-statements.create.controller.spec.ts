import { Test, TestingModule } from '@nestjs/testing';
import { JibStatementsController } from '../jib-statements.controller';
import { CommandBus } from '@nestjs/cqrs';
import { CreateJibStatementDto } from '../../dtos/create-jib-statement.dto';

class CommandBusMock {
  execute = jest.fn(() => Promise.resolve('new-jib'));
}

describe('JibStatementsController create', () => {
  let controller: JibStatementsController;
  let commandBus: CommandBusMock;

  beforeEach(async () => {
    commandBus = new CommandBusMock();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JibStatementsController],
      providers: [{ provide: CommandBus, useValue: commandBus }],
    }).compile();

    controller = module.get<JibStatementsController>(JibStatementsController);
  });

  it('creates a JIB statement', async () => {
    const dto: CreateJibStatementDto = {
      organizationId: 'org-1',
      leaseId: 'lease-1',
      partnerId: 'partner-1',
      statementPeriodStart: '2025-01-01',
      statementPeriodEnd: '2025-01-31',
      dueDate: '2025-02-15',
    };
    const res = await controller.create(dto);
    expect(res.id).toBe('new-jib');
    expect(commandBus.execute).toHaveBeenCalled();
  });
});
