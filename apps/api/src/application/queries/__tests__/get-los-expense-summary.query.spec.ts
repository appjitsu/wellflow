import { Test, TestingModule } from '@nestjs/testing';

describe('GetLosExpenseSummaryQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetLosExpenseSummaryQuery>(/* GetLosExpenseSummaryQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
