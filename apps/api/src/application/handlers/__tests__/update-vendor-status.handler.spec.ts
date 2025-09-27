import { Test, TestingModule } from '@nestjs/testing';

describe('UpdateVendorStatusHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<UpdateVendorStatusHandler>(/* UpdateVendorStatusHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
