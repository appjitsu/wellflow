import { Test, TestingModule } from '@nestjs/testing';

describe('GetVendorsByOrganizationHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetVendorsByOrganizationHandler>(/* GetVendorsByOrganizationHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
