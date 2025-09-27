import { Test, TestingModule } from '@nestjs/testing';

describe('VendorQualificationUpdatedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<VendorQualificationUpdatedEvent>(/* VendorQualificationUpdatedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
