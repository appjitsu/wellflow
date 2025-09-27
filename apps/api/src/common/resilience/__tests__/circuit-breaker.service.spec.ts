import { Test, TestingModule } from '@nestjs/testing';

describe('CircuitBreakerService', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<CircuitBreakerService>(/* CircuitBreakerService */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
