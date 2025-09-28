import { Test, TestingModule } from '@nestjs/testing';
import { ExponentialBackoffRetryStrategy } from '../resilience-retry.service';

describe('ExponentialBackoffRetryStrategy', () => {
  let service: ExponentialBackoffRetryStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExponentialBackoffRetryStrategy],
    }).compile();

    service = module.get<ExponentialBackoffRetryStrategy>(
      ExponentialBackoffRetryStrategy,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
