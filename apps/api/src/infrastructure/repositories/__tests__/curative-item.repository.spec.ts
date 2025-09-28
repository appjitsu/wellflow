import { Test, TestingModule } from '@nestjs/testing';
import { CurativeItemRepositoryImpl } from '../curative-item.repository';
import { DatabaseService } from '../../../database/database.service';

describe('CurativeItemRepositoryImpl', () => {
  let service: CurativeItemRepositoryImpl;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurativeItemRepositoryImpl,
        {
          provide: DatabaseService,
          useValue: {
            getDb: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CurativeItemRepositoryImpl>(
      CurativeItemRepositoryImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
