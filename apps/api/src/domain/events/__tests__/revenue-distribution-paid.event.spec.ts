import { Test, TestingModule } from '@nestjs/testing';

describe('RevenueDistributionPaidEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<RevenueDistributionPaidEvent>(/* RevenueDistributionPaidEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
