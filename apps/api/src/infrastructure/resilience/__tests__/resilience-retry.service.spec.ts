import { Test, TestingModule } from '@nestjs/testing';

describe('ExponentialBackoffRetryStrategy', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<ExponentialBackoffRetryStrategy>(/* ExponentialBackoffRetryStrategy */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
