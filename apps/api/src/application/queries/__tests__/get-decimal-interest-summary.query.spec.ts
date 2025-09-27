import { Test, TestingModule } from '@nestjs/testing';

describe('GetDecimalInterestSummaryQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetDecimalInterestSummaryQuery>(/* GetDecimalInterestSummaryQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
