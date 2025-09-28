import { Test, TestingModule } from '@nestjs/testing';
import { EnhancedRateLimiterService } from '../enhanced-rate-limiter.service';

describe('EnhancedRateLimiterService', () => {
  let service: EnhancedRateLimiterService;

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    mget: jest.fn(),
    mset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnhancedRateLimiterService,
        {
          provide: 'REDIS_CONNECTION',
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<EnhancedRateLimiterService>(
      EnhancedRateLimiterService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
