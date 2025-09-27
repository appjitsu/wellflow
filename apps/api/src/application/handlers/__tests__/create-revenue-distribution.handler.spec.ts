import { Test, TestingModule } from '@nestjs/testing';

describe('CreateRevenueDistributionHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<CreateRevenueDistributionHandler>(/* CreateRevenueDistributionHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
