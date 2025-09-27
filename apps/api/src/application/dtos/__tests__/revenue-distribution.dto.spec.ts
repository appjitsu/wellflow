import { Test, TestingModule } from '@nestjs/testing';

describe('RevenueDistributionDto', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<RevenueDistributionDto>(/* RevenueDistributionDto */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
