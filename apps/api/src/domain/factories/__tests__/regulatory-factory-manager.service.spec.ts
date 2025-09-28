import { Test, TestingModule } from '@nestjs/testing';
import { ModuleRef } from '@nestjs/core';
import { RegulatoryFactoryManagerService } from '../regulatory-factory-manager.service';

describe('RegulatoryFactoryManagerService', () => {
  let service: RegulatoryFactoryManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegulatoryFactoryManagerService,
        {
          provide: ModuleRef,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RegulatoryFactoryManagerService>(
      RegulatoryFactoryManagerService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
