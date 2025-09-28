import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import { TitleManagementController } from '../title-management.controller';
import { AbilitiesFactory } from '../../../authorization/abilities.factory';
import { TenantRlsService } from '../../../common/tenant/tenant-rls.service';
import { SetTenantContextUseCase } from '../../../application/use-cases/set-tenant-context.use-case';

describe('TitleManagementController', () => {
  let controller: TitleManagementController;

  const mockCommandBus = {
    execute: jest.fn(),
  };

  const mockQueryBus = {
    execute: jest.fn(),
  };

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

  const mockTenantRlsService = {
    setTenantContext: jest.fn(),
    getCurrentTenant: jest.fn(),
  };

  const mockSetTenantContextUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TitleManagementController],
      providers: [
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: AbilitiesFactory,
          useValue: mockAbilitiesFactory,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: TenantRlsService,
          useValue: mockTenantRlsService,
        },
        {
          provide: SetTenantContextUseCase,
          useValue: mockSetTenantContextUseCase,
        },
      ],
    }).compile();

    controller = module.get<TitleManagementController>(
      TitleManagementController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
