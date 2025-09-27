import { Test, TestingModule } from '@nestjs/testing';

describe('StandardMarketPricingStrategy', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<StandardMarketPricingStrategy>(/* StandardMarketPricingStrategy */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
