import { Test, TestingModule } from '@nestjs/testing';

describe('VendorQualificationUpdatedHandler', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<VendorQualificationUpdatedHandler>(/* VendorQualificationUpdatedHandler */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
