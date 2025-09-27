import { Test, TestingModule } from '@nestjs/testing';

describe('GetVendorsWithExpiringQualificationsHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<GetVendorsWithExpiringQualificationsHandler>(/* GetVendorsWithExpiringQualificationsHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
