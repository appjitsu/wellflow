import { Test, TestingModule } from '@nestjs/testing';

describe('RoyaltyPaymentStrategy', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<RoyaltyPaymentStrategy>(/* RoyaltyPaymentStrategy */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
