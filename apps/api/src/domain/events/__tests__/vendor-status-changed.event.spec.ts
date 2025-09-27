import { Test, TestingModule } from '@nestjs/testing';

describe('VendorStatusChangedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<VendorStatusChangedEvent>(/* VendorStatusChangedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
