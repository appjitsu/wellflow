import { Test, TestingModule } from '@nestjs/testing';

describe('CacheInterceptor', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<CacheInterceptor>(/* CacheInterceptor */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
