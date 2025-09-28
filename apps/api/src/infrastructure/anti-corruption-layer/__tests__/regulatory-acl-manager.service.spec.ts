import { Test, TestingModule } from '@nestjs/testing';
import { ModuleRef } from '@nestjs/core';
import { RegulatoryACLManagerService } from '../regulatory-acl-manager.service';

describe('RegulatoryACLManagerService', () => {
  let service: RegulatoryACLManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegulatoryACLManagerService,
        {
          provide: ModuleRef,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RegulatoryACLManagerService>(
      RegulatoryACLManagerService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
