import { Test, TestingModule } from '@nestjs/testing';
import { CircuitBreakerHealthIndicator } from '../circuit-breaker-health.indicator';
import { CircuitBreakerService } from '../../common/resilience/circuit-breaker.service';

describe('CircuitBreakerHealthIndicator', () => {
  let service: CircuitBreakerHealthIndicator;

  const mockCircuitBreakerService = {
    getAllMetrics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CircuitBreakerHealthIndicator,
        {
          provide: CircuitBreakerService,
          useValue: mockCircuitBreakerService,
        },
      ],
    }).compile();

    service = module.get<CircuitBreakerHealthIndicator>(
      CircuitBreakerHealthIndicator,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
