import { Test, TestingModule } from '@nestjs/testing';

describe('GetRevenueDistributionByIdQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetRevenueDistributionByIdQuery>(/* GetRevenueDistributionByIdQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
