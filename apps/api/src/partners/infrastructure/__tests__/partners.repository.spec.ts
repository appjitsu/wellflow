import { Test, TestingModule } from '@nestjs/testing';
import { PartnersRepositoryImpl } from '../partners.repository';
import { DatabaseService } from '../../../database/database.service';

describe('PartnersRepositoryImpl', () => {
  let service: PartnersRepositoryImpl;

  beforeEach(async () => {
    const mockDatabaseService = {
      getDb: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartnersRepositoryImpl,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<PartnersRepositoryImpl>(PartnersRepositoryImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
