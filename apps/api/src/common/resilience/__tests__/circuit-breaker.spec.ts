import { CircuitBreaker, CircuitBreakerConfig } from '../circuit-breaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  const config: CircuitBreakerConfig = {
    failureThreshold: 5,
    recoveryTimeoutMs: 60000,
    halfOpenMaxCalls: 3,
  };

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker(config);
  });

  it('should be defined', () => {
    expect(circuitBreaker).toBeDefined();
  });
});
