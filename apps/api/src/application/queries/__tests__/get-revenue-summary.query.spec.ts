import { Test, TestingModule } from '@nestjs/testing';

describe('GetRevenueSummaryQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<GetRevenueSummaryQuery>(/* GetRevenueSummaryQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
