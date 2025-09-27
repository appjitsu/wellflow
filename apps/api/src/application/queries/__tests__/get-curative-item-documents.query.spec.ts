import { Test, TestingModule } from '@nestjs/testing';

describe('GetCurativeItemDocumentsQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetCurativeItemDocumentsQuery>(/* GetCurativeItemDocumentsQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
