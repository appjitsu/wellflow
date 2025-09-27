import { Test, TestingModule } from '@nestjs/testing';

describe('GetDecimalInterestSummaryHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetDecimalInterestSummaryHandler>(/* GetDecimalInterestSummaryHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
