import { Test, TestingModule } from '@nestjs/testing';

describe('GetTitleOpinionDocumentsHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetTitleOpinionDocumentsHandler>(/* GetTitleOpinionDocumentsHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
