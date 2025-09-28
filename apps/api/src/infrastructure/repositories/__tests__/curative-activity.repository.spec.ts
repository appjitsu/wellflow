import { Test, TestingModule } from '@nestjs/testing';
import { CurativeActivityRepositoryImpl } from '../curative-activity.repository';

describe('CurativeActivityRepositoryImpl', () => {
  let repository: CurativeActivityRepositoryImpl;

  const mockDb = {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurativeActivityRepositoryImpl,
        {
          provide: 'DATABASE_CONNECTION',
          useValue: mockDb,
        },
      ],
    }).compile();

    repository = module.get<CurativeActivityRepositoryImpl>(
      CurativeActivityRepositoryImpl,
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
});
