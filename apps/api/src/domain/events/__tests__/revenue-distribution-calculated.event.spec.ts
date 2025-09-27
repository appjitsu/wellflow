import { Test, TestingModule } from '@nestjs/testing';

describe('RevenueDistributionCalculatedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<RevenueDistributionCalculatedEvent>(/* RevenueDistributionCalculatedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
