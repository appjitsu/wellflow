import { Test, TestingModule } from '@nestjs/testing';
import { TitleOpinionDocumentRepositoryImpl } from '../title-opinion-document.repository';
import { DatabaseService } from '../../../database/database.service';

describe('TitleOpinionDocumentRepositoryImpl', () => {
  let service: TitleOpinionDocumentRepositoryImpl;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TitleOpinionDocumentRepositoryImpl,
        {
          provide: DatabaseService,
          useValue: {
            getDb: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TitleOpinionDocumentRepositoryImpl>(
      TitleOpinionDocumentRepositoryImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
