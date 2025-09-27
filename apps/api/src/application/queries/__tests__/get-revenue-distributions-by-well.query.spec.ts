import { Test, TestingModule } from '@nestjs/testing';

describe('GetRevenueDistributionsByWellQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetRevenueDistributionsByWellQuery>(/* GetRevenueDistributionsByWellQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
