import { Test, TestingModule } from '@nestjs/testing';

describe('GetVendorsWithExpiringQualificationsQuery', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetVendorsWithExpiringQualificationsQuery>(/* GetVendorsWithExpiringQualificationsQuery */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
