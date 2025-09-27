import { Test, TestingModule } from '@nestjs/testing';

describe('CircuitBreakerHealthIndicator', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service =
      module.get<CircuitBreakerHealthIndicator>(/* CircuitBreakerHealthIndicator */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
