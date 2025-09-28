import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CacheModule } from '../cache.module';

describe('CacheModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CacheModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn((key: string, defaultValue?: any) => {
          if (key === 'CACHE_MAX_SIZE') return defaultValue || 1000;
          if (key === 'CACHE_DEFAULT_TTL') return defaultValue || 300;
          return defaultValue;
        }),
      })
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});
