import { Test, TestingModule } from '@nestjs/testing';
import { TitleOpinionRepositoryImpl } from '../title-opinion.repository';
import { DatabaseService } from '../../../database/database.service';

describe('TitleOpinionRepositoryImpl', () => {
  let service: TitleOpinionRepositoryImpl;

  beforeEach(async () => {
    const mockDatabaseService = {
      getDb: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TitleOpinionRepositoryImpl,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<TitleOpinionRepositoryImpl>(
      TitleOpinionRepositoryImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
