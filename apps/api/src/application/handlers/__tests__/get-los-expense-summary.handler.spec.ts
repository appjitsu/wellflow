import { Test, TestingModule } from '@nestjs/testing';

describe('GetLosExpenseSummaryHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetLosExpenseSummaryHandler>(/* GetLosExpenseSummaryHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
