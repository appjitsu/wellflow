import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { WellsV2Controller } from '../wells-v2.controller';
import { AbilitiesFactory } from '../../../../authorization/abilities.factory';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

describe('WellsV2Controller', () => {
  let controller: WellsV2Controller;

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

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WellsV2Controller],
      providers: [
        {
          provide: AbilitiesFactory,
          useValue: mockAbilitiesFactory,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: JwtAuthGuard,
          useValue: mockJwtAuthGuard,
        },
      ],
    }).compile();

    controller = module.get<WellsV2Controller>(WellsV2Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
