import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsRepositoryImpl } from '../organizations.repository';
import { DatabaseService } from '../../../database/database.service';

describe('OrganizationsRepositoryImpl', () => {
  let service: OrganizationsRepositoryImpl;

  beforeEach(async () => {
    const mockDatabaseService = {
      getDb: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsRepositoryImpl,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<OrganizationsRepositoryImpl>(
      OrganizationsRepositoryImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
