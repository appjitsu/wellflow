import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';
import { RegulatoryReportingController } from '../regulatory-reporting.controller';
import { TenantRlsService } from '../../common/tenant/tenant-rls.service';
import { SetTenantContextUseCase } from '../../application/use-cases/set-tenant-context.use-case';
import { AbilitiesFactory } from '../../authorization/abilities.factory';

describe('RegulatoryReportingController', () => {
  let controller: RegulatoryReportingController;

  const mockAbilitiesFactory = {
    createForUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegulatoryReportingController],
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
          provide: 'ReportInstanceRepository',
          useValue: {
            getFormData: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: { get: jest.fn() },
        },
        {
          provide: TenantRlsService,
          useValue: {
            setTenantContext: jest.fn(),
            clearTenantContext: jest.fn(),
          },
        },
        {
          provide: SetTenantContextUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: AbilitiesFactory,
          useValue: mockAbilitiesFactory,
        },
      ],
    })
      .overrideGuard('JwtAuthGuard')
      .useValue({ canActivate: () => true })
      .overrideGuard('TenantGuard')
      .useValue({ canActivate: () => true })
      .overrideGuard('AbilitiesGuard')
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RegulatoryReportingController>(
      RegulatoryReportingController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
