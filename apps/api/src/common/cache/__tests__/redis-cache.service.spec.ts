import { Test, TestingModule } from '@nestjs/testing';

describe('RedisCacheService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<RedisCacheService>(/* RedisCacheService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
