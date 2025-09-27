import { Test, TestingModule } from '@nestjs/testing';

describe('GetCurativeItemDocumentsHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetCurativeItemDocumentsHandler>(/* GetCurativeItemDocumentsHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
