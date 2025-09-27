import { Test, TestingModule } from '@nestjs/testing';

describe('GetVendorStatisticsQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetVendorStatisticsQuery>(/* GetVendorStatisticsQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
