import { Test, TestingModule } from '@nestjs/testing';

describe('VendorModule', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<VendorModule>(/* VendorModule */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
