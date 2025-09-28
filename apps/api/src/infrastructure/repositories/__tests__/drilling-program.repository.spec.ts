import { Test, TestingModule } from '@nestjs/testing';
import { DrillingProgramRepository } from '../drilling-program.repository';
import { DatabaseService } from '../../../database/database.service';

describe('DrillingProgramRepository', () => {
  let repository: DrillingProgramRepository;

  beforeEach(async () => {
    const mockDatabaseService = {} as jest.Mocked<DatabaseService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DrillingProgramRepository,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    repository = module.get<DrillingProgramRepository>(
      DrillingProgramRepository,
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
});
