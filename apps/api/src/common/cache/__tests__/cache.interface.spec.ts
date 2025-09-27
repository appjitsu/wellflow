import { Test, TestingModule } from '@nestjs/testing';

describe('cache.interface', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<cache.interface>(/* cache.interface */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
