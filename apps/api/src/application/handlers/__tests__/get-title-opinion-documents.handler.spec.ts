import { Test, TestingModule } from '@nestjs/testing';
import { GetTitleOpinionDocumentsHandler } from '../get-title-opinion-documents.handler';

describe('GetTitleOpinionDocumentsHandler', () => {
  let service: GetTitleOpinionDocumentsHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTitleOpinionDocumentsHandler,
        {
          provide: 'TitleOpinionDocumentRepository',
          useValue: {
            listByTitleOpinionId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GetTitleOpinionDocumentsHandler>(
      GetTitleOpinionDocumentsHandler,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
