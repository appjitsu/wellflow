import { Test, TestingModule } from '@nestjs/testing';

describe('LinkTitleOpinionDocumentHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<LinkTitleOpinionDocumentHandler>(/* LinkTitleOpinionDocumentHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
