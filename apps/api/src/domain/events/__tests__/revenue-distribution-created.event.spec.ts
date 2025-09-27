import { Test, TestingModule } from '@nestjs/testing';

describe('RevenueDistributionCreatedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<RevenueDistributionCreatedEvent>(/* RevenueDistributionCreatedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
