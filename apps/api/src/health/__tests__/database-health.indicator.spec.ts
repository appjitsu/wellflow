import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseHealthIndicator } from '../database-health.indicator';
import { DatabaseService } from '../../database/database.service';

describe('DatabaseHealthIndicator', () => {
  let service: DatabaseHealthIndicator;

  beforeEach(async () => {
    const mockDatabaseService = {
      getDb: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseHealthIndicator,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<DatabaseHealthIndicator>(DatabaseHealthIndicator);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
