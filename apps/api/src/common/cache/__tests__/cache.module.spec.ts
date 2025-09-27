import { Test, TestingModule } from '@nestjs/testing';

describe('CacheModule', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<CacheModule>(/* CacheModule */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
