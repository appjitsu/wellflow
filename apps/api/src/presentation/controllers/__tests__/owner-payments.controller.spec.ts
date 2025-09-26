import { Test, TestingModule } from '@nestjs/testing';
import { OwnerPaymentsController } from '../owner-payments.controller';
import { CreateOwnerPaymentDto } from '../../dtos/owner-payments.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

class CommandBusMock {
  execute = jest.fn(() => Promise.resolve('new-id'));
}
class QueryBusMock {
  execute = jest.fn(() => Promise.resolve({ id: 'id-1' }));
}

describe('OwnerPaymentsController', () => {
  let controller: OwnerPaymentsController;
  let commandBus: CommandBusMock;
  let queryBus: QueryBusMock;

  beforeEach(async () => {
    commandBus = new CommandBusMock();
    queryBus = new QueryBusMock();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OwnerPaymentsController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    controller = module.get<OwnerPaymentsController>(OwnerPaymentsController);
  });

  it('creates payment', async () => {
    const dto: CreateOwnerPaymentDto = {
      organizationId: 'org-1',
      partnerId: 'partner-1',
      method: 'CHECK',
      grossAmount: '100.00',
      netAmount: '90.00',
      revenueDistributionId: 'rd-1',
    } as CreateOwnerPaymentDto;
    const res = await controller.create(dto);
    expect(res.id).toBe('new-id');
    expect(commandBus.execute).toHaveBeenCalled();
  });

  it('gets by id', async () => {
    const res = await controller.getById('id-1');
    expect(res.id).toBe('id-1');
    expect(queryBus.execute).toHaveBeenCalled();
  });
});
