import { Test, TestingModule } from '@nestjs/testing';
import { RlsTenantIsolationStrategy } from '../rls-tenant-isolation.strategy';
import { DatabaseConnectionService } from '../database-connection.service';

describe('RlsTenantIsolationStrategy', () => {
  let service: RlsTenantIsolationStrategy;

  beforeEach(async () => {
    const mockDatabaseConnectionService = {
      getConnectionPool: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RlsTenantIsolationStrategy,
        {
          provide: DatabaseConnectionService,
          useValue: mockDatabaseConnectionService,
        },
      ],
    }).compile();

    service = module.get<RlsTenantIsolationStrategy>(
      RlsTenantIsolationStrategy,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
