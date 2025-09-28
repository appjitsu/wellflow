import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseConnectionService } from '../database-connection.service';
import { ConfigService } from '@nestjs/config';
import { ConnectionPoolConfigService } from '../../database/connection-pool-config.service';

describe('DatabaseConnectionService', () => {
  let service: DatabaseConnectionService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };
    const mockPoolConfigService = {
      getOptimizedPoolConfig: jest.fn(),
      validatePoolConfig: jest.fn(),
      getCurrentStrategyName: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseConnectionService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: ConnectionPoolConfigService,
          useValue: mockPoolConfigService,
        },
      ],
    }).compile();

    service = module.get<DatabaseConnectionService>(DatabaseConnectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
