import { Test, TestingModule } from '@nestjs/testing';

describe('RedisHealthIndicator', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<RedisHealthIndicator>(/* RedisHealthIndicator */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
