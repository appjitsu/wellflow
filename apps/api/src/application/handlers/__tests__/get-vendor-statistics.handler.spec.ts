import { Test, TestingModule } from '@nestjs/testing';

describe('GetVendorStatisticsHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetVendorStatisticsHandler>(/* GetVendorStatisticsHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
