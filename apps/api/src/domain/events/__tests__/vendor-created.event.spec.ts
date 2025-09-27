import { Test, TestingModule } from '@nestjs/testing';

describe('VendorCreatedEvent', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<VendorCreatedEvent>(/* VendorCreatedEvent */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
