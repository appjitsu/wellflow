import { Test, TestingModule } from '@nestjs/testing';

describe('UpdateVendorPerformanceHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<UpdateVendorPerformanceHandler>(/* UpdateVendorPerformanceHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
