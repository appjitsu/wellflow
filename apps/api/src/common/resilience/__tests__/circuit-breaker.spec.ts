import { Test, TestingModule } from '@nestjs/testing';

describe('CircuitBreaker', () => {
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [],
    }).compile();

    service = module.get<CircuitBreaker>(/* CircuitBreaker */);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
