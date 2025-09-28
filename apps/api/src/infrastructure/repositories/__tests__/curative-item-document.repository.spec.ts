import { Test, TestingModule } from '@nestjs/testing';
import { CurativeItemDocumentRepositoryImpl } from '../curative-item-document.repository';
import { DatabaseService } from '../../../database/database.service';

describe('CurativeItemDocumentRepositoryImpl', () => {
  let service: CurativeItemDocumentRepositoryImpl;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurativeItemDocumentRepositoryImpl,
        {
          provide: DatabaseService,
          useValue: {
            getDb: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CurativeItemDocumentRepositoryImpl>(
      CurativeItemDocumentRepositoryImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
