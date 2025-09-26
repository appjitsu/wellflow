import { Test, TestingModule } from '@nestjs/testing';
import { JibStatementsController } from '../jib-statements.controller';
import { CommandBus } from '@nestjs/cqrs';
import { UpdateJibLinkDto } from '../../dtos/update-jib-link.dto';

class CommandBusMock {
  execute = jest.fn(() =>
    Promise.resolve({
      jibId: 'jib-1',
      cashCallId: 'cc-1',
      interestAccrued: '1.23',
    }),
  );
}

describe('JibStatementsController', () => {
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

  it('links and accrues interest', async () => {
    const dto: UpdateJibLinkDto = {
      organizationId: 'org-1',
      annualInterestRatePercent: '12.00',
      dayCountBasis: 365,
    };
    const res = await controller.link('jib-1', dto);
    expect(res.jibId).toBe('jib-1');
    expect(commandBus.execute).toHaveBeenCalled();
  });
});
