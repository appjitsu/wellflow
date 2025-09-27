import { Test, TestingModule } from '@nestjs/testing';

describe('GetCurativeItemsByTitleOpinionHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetCurativeItemsByTitleOpinionHandler>(/* GetCurativeItemsByTitleOpinionHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
