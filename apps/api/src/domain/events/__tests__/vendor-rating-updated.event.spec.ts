import { Test, TestingModule } from '@nestjs/testing';

describe('VendorRatingUpdatedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<VendorRatingUpdatedEvent>(/* VendorRatingUpdatedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
