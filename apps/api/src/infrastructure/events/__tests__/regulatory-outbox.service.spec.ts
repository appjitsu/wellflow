import { Test, TestingModule } from '@nestjs/testing';
import { RegulatoryOutboxService } from '../regulatory-outbox.service';
import { DatabaseService } from '../../../database/database.service';
import { ModuleRef } from '@nestjs/core';

describe('RegulatoryOutboxService', () => {
  let service: RegulatoryOutboxService;

  beforeEach(async () => {
    const mockDatabaseService = {
      getDb: jest.fn(),
    };

    const mockModuleRef = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegulatoryOutboxService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: ModuleRef,
          useValue: mockModuleRef,
        },
      ],
    }).compile();

    service = module.get<RegulatoryOutboxService>(RegulatoryOutboxService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
