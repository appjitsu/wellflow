import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import { DrillingProgramsController } from '../drilling-programs.controller';
import { AbilitiesFactory } from '../../../authorization/abilities.factory';

describe('DrillingProgramsController', () => {
  let controller: DrillingProgramsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DrillingProgramsController],
      providers: [
        {
          provide: CommandBus,
          useValue: { execute: jest.fn() },
        },
        {
          provide: QueryBus,
          useValue: { execute: jest.fn() },
        },
        {
          provide: Reflector,
          useValue: { get: jest.fn() },
        },
        {
          provide: AbilitiesFactory,
          useValue: {
            createForUser: jest.fn(),
            createForWellOperation: jest.fn(),
            createForGuest: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard('JwtAuthGuard')
      .useValue({ canActivate: () => true })
      .overrideGuard('AbilitiesGuard')
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DrillingProgramsController>(
      DrillingProgramsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
