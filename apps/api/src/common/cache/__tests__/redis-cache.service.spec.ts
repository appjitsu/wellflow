import { Test, TestingModule } from '@nestjs/testing';
import { RedisCacheService } from '../redis-cache.service';

describe('RedisCacheService', () => {
  let service: RedisCacheService;

  const mockRedis = {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    info: jest.fn(),
    dbsize: jest.fn(),
    keys: jest.fn(),
    sadd: jest.fn(),
    srem: jest.fn(),
    sismember: jest.fn(),
    expire: jest.fn(),
    flushdb: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisCacheService,
        {
          provide: 'REDIS_CONNECTION',
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<RedisCacheService>(RedisCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
