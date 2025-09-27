import { Test, TestingModule } from '@nestjs/testing';

describe('GetUnpaidRevenueDistributionsQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetUnpaidRevenueDistributionsQuery>(/* GetUnpaidRevenueDistributionsQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
