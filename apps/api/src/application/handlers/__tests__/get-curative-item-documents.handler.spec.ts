import { Test, TestingModule } from '@nestjs/testing';
import { GetCurativeItemDocumentsHandler } from '../get-curative-item-documents.handler';

describe('GetCurativeItemDocumentsHandler', () => {
  let handler: GetCurativeItemDocumentsHandler;

  const mockCurativeItemDocumentRepository = {
    listByCurativeItemId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCurativeItemDocumentsHandler,
        {
          provide: 'CurativeItemDocumentRepository',
          useValue: mockCurativeItemDocumentRepository,
        },
      ],
    }).compile();

    handler = module.get<GetCurativeItemDocumentsHandler>(
      GetCurativeItemDocumentsHandler,
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
