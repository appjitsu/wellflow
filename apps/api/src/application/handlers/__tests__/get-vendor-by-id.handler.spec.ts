import { Test, TestingModule } from '@nestjs/testing';

describe('GetVendorByIdHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<GetVendorByIdHandler>(/* GetVendorByIdHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
