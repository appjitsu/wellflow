import { Test, TestingModule } from '@nestjs/testing';

describe('VendorCreatedHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<VendorCreatedHandler>(/* VendorCreatedHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
