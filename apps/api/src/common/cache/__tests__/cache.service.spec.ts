import { Test, TestingModule } from '@nestjs/testing';

describe('CacheService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<CacheService>(/* CacheService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
