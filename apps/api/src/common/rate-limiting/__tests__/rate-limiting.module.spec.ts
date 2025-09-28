import { RateLimitingModule } from '../rate-limiting.module';

describe('RateLimitingModule', () => {
  it('should be defined', () => {
    expect(RateLimitingModule).toBeDefined();
  });

  it('should be a class', () => {
    expect(typeof RateLimitingModule).toBe('function');
  });

  it('should have a prototype', () => {
    expect(RateLimitingModule.prototype).toBeDefined();
  });
});
