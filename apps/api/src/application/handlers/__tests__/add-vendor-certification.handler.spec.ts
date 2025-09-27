import { Test, TestingModule } from '@nestjs/testing';

describe('AddVendorCertificationHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<AddVendorCertificationHandler>(/* AddVendorCertificationHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
