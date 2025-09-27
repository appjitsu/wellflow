import { Test, TestingModule } from '@nestjs/testing';

describe('GetVendorByIdQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<GetVendorByIdQuery>(/* GetVendorByIdQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
