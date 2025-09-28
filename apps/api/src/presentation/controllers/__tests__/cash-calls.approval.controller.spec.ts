import { Test, TestingModule } from '@nestjs/testing';
import { CashCallsController } from '../cash-calls.controller';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import { AbilitiesFactory } from '../../../authorization/abilities.factory';
import { AbilitiesGuard } from '../../../authorization/abilities.guard';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

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

  const mockAbilitiesFactory = {
    createForUser: jest.fn(),
    createForWellOperation: jest.fn(),
    createForGuest: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn(),
    getAll: jest.fn(),
    getAllAndOverride: jest.fn(),
    getAllAndMerge: jest.fn(),
  };

  beforeEach(async () => {
    commandBus = new CommandBusMock();
    queryBus = new QueryBusMock();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CashCallsController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: QueryBus, useValue: queryBus },
        {
          provide: AbilitiesFactory,
          useValue: mockAbilitiesFactory,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AbilitiesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CashCallsController>(CashCallsController);
  });

  it('approves a cash call', async () => {
    const res = await controller.approve('id-1', 'org-1');
    expect(res.id).toBe('approved-id');
    expect(commandBus.execute).toHaveBeenCalled();
  });
});
