import {
  createThrottlerConfig,
  RATE_LIMIT_TIERS,
  RATE_LIMIT_MESSAGES,
} from '../index';

describe('throttler index', () => {
  it('should export createThrottlerConfig', () => {
    expect(createThrottlerConfig).toBeDefined();
  });

  it('should export RATE_LIMIT_TIERS', () => {
    expect(RATE_LIMIT_TIERS).toBeDefined();
  });

  it('should export RATE_LIMIT_MESSAGES', () => {
    expect(RATE_LIMIT_MESSAGES).toBeDefined();
  });
});
