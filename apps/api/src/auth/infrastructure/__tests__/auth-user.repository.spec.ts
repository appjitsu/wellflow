import { Test, TestingModule } from '@nestjs/testing';
import { AuthUserRepositoryImpl } from '../auth-user.repository';
import { DatabaseService } from '../../../database/database.service';

describe('AuthUserRepositoryImpl', () => {
  let repository: AuthUserRepositoryImpl;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthUserRepositoryImpl,
        {
          provide: DatabaseService,
          useValue: {
            getDb: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<AuthUserRepositoryImpl>(AuthUserRepositoryImpl);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });
});
