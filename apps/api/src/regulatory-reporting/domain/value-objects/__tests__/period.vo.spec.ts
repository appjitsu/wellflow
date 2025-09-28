import { Period } from '../period.vo';

describe('Period', () => {
  it('should create a valid period', () => {
    const period = new Period('2023-01');
    expect(period).toBeDefined();
    expect(period.toString()).toBe('2023-01');
  });

  it('should throw error for invalid format', () => {
    expect(() => new Period('invalid')).toThrow(
      'Invalid period format, expected YYYY-MM',
    );
  });
});
