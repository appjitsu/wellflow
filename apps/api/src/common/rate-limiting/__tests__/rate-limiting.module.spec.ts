import { Test, TestingModule } from '@nestjs/testing';

describe('RateLimitingModule', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<RateLimitingModule>(/* RateLimitingModule */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
