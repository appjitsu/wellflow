import { Test, TestingModule } from '@nestjs/testing';

describe('MemoryCacheService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<MemoryCacheService>(/* MemoryCacheService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
