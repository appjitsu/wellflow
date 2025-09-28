import { Test, TestingModule } from '@nestjs/testing';
import { OutboxService } from '../outbox.service';
import { DatabaseService } from '../../../database/database.service';

describe('OutboxService', () => {
  let service: OutboxService;

  beforeEach(async () => {
    const mockDatabaseService = {
      getDb: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OutboxService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<OutboxService>(OutboxService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
