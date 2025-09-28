import { Test, TestingModule } from '@nestjs/testing';
import { UnitOfWork } from '../unit-of-work';
import { DatabaseService } from '../../../database/database.service';

describe('UnitOfWork', () => {
  let service: UnitOfWork;

  beforeEach(async () => {
    const mockDatabaseService = {
      getDb: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitOfWork,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<UnitOfWork>(UnitOfWork);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
