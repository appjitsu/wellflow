import { Test, TestingModule } from '@nestjs/testing';

describe('GetCurativeItemsByTitleOpinionQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetCurativeItemsByTitleOpinionQuery>(/* GetCurativeItemsByTitleOpinionQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
