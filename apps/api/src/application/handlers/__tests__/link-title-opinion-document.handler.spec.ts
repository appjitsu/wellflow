import { Test, TestingModule } from '@nestjs/testing';
import { LinkTitleOpinionDocumentHandler } from '../link-title-opinion-document.handler';

describe('LinkTitleOpinionDocumentHandler', () => {
  let service: LinkTitleOpinionDocumentHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkTitleOpinionDocumentHandler,
        {
          provide: 'TitleOpinionDocumentRepository',
          useValue: {
            linkDocument: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LinkTitleOpinionDocumentHandler>(
      LinkTitleOpinionDocumentHandler,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
