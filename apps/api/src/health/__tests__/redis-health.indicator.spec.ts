import { Test, TestingModule } from '@nestjs/testing';
import { RedisHealthIndicator } from '../redis-health.indicator';

describe('RedisHealthIndicator', () => {
  let service: RedisHealthIndicator;

  beforeEach(async () => {
    const mockRedis = {
      ping: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisHealthIndicator,
        {
          provide: 'REDIS_CONNECTION',
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<RedisHealthIndicator>(RedisHealthIndicator);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
