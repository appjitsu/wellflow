import { Test, TestingModule } from '@nestjs/testing';
import { JoasController } from '../joas.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateJoaDto } from '../../dtos/create-joa.dto';

class CommandBusMock {
  execute = jest.fn(() => Promise.resolve('new-joa-id'));
}
class QueryBusMock {
  execute = jest.fn(() =>
    Promise.resolve({
      id: 'id-1',
      organizationId: 'org-1',
      agreementNumber: 'AG-100',
      effectiveDate: '2025-01-01',
      status: 'ACTIVE',
    }),
  );
}

describe('JoasController', () => {
  let controller: JoasController;
  let commandBus: CommandBusMock;
  let queryBus: QueryBusMock;

  beforeEach(async () => {
    commandBus = new CommandBusMock();
    queryBus = new QueryBusMock();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JoasController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    controller = module.get<JoasController>(JoasController);
  });

  it('creates joa', async () => {
    const dto: CreateJoaDto = {
      organizationId: 'org-1',
      agreementNumber: 'AG-100',
      effectiveDate: '2025-01-01',
      votingThresholdPercent: '66.67',
    } as CreateJoaDto;
    const res = await controller.create(dto);
    expect(res.id).toBe('new-joa-id');
    expect(commandBus.execute).toHaveBeenCalled();
  });

  it('gets by id', async () => {
    const res = await controller.getById('id-1', 'org-1');
    expect(res.id).toBe('id-1');
    expect(queryBus.execute).toHaveBeenCalled();
  });
});
