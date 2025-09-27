import { Test, TestingModule } from '@nestjs/testing';

describe('GetVendorsByOrganizationQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetVendorsByOrganizationQuery>(/* GetVendorsByOrganizationQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
