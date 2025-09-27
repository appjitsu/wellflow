import { Test, TestingModule } from '@nestjs/testing';

describe('ResilienceBulkhead', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<ResilienceBulkhead>(/* ResilienceBulkhead */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
