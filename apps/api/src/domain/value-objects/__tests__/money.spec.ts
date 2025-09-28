import { Money } from '../money';

describe('Money Value Object', () => {
  describe('constructor', () => {
    it('should create money with valid amount and currency', () => {
      const money = new Money(1500000, 'USD');

      expect(money.getAmount()).toBe(1500000);
      expect(money.getCurrency()).toBe('USD');
    });

    it('should default to USD currency', () => {
      const money = new Money(1000);

      expect(money.getCurrency()).toBe('USD');
    });

    it('should round to 2 decimal places', () => {
      const money = new Money(1500000.999, 'USD');

      expect(money.getAmount()).toBe(1500001);
    });

    it('should handle negative amounts', () => {
      const money = new Money(-1000, 'USD');

      expect(money.getAmount()).toBe(-1000);
      expect(money.isNegative()).toBe(true);
    });

    it('should handle zero amount', () => {
      const money = new Money(0, 'USD');

      expect(money.getAmount()).toBe(0);
      expect(money.isZero()).toBe(true);
    });
  });

  describe('validation', () => {
    it('should reject invalid amount types', () => {
      expect(() => new Money(NaN, 'USD')).toThrow(
        'Amount must be a valid number',
      );
      expect(() => new Money(Infinity, 'USD')).toThrow('Amount must be finite');
    });

    it('should reject amounts exceeding maximum', () => {
      expect(() => new Money(2_000_000_000_000, 'USD')).toThrow(
        'Amount exceeds maximum allowed value',
      );
    });

    it('should reject invalid currency', () => {
      expect(() => new Money(1000, '')).toThrow(
        'Currency must be a valid string',
      );
      expect(() => new Money(1000, 'INVALID')).toThrow(
        'Currency must be a 3-letter ISO code',
      );
    });

    it('should warn for uncommon currencies', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Constructor called for side effect (testing warning)
      new Money(1000, 'XYZ'); // eslint-disable-line sonarjs/constructor-for-side-effects

      expect(consoleSpy).toHaveBeenCalledWith('Uncommon currency code: XYZ');
      consoleSpy.mockRestore();
    });
  });

  describe('arithmetic operations', () => {
    const money1 = new Money(1000, 'USD');
    const money2 = new Money(500, 'USD');

    it('should add money amounts', () => {
      const result = money1.add(money2);

      expect(result.getAmount()).toBe(1500);
      expect(result.getCurrency()).toBe('USD');
    });

    it('should subtract money amounts', () => {
      const result = money1.subtract(money2);

      expect(result.getAmount()).toBe(500);
      expect(result.getCurrency()).toBe('USD');
    });

    it('should multiply by factor', () => {
      const result = money1.multiply(2.5);

      expect(result.getAmount()).toBe(2500);
      expect(result.getCurrency()).toBe('USD');
    });

    it('should divide by divisor', () => {
      const result = money1.divide(2);

      expect(result.getAmount()).toBe(500);
      expect(result.getCurrency()).toBe('USD');
    });

    it('should calculate percentage', () => {
      const result = money1.percentage(25);

      expect(result.getAmount()).toBe(250);
      expect(result.getCurrency()).toBe('USD');
    });

    it('should reject operations with different currencies', () => {
      const eurMoney = new Money(1000, 'EUR');

      expect(() => money1.add(eurMoney)).toThrow(
        'Cannot perform operation on different currencies: USD and EUR',
      );
    });

    it('should reject division by zero', () => {
      expect(() => money1.divide(0)).toThrow(
        'Division divisor must be a valid non-zero number',
      );
    });

    it('should reject invalid multiplication factors', () => {
      expect(() => money1.multiply(NaN)).toThrow(
        'Multiplication factor must be a valid number',
      );
    });
  });

  describe('comparison operations', () => {
    const money1 = new Money(1000, 'USD');
    const money2 = new Money(500, 'USD');
    const money3 = new Money(1000, 'USD');

    it('should compare greater than', () => {
      expect(money1.isGreaterThan(money2)).toBe(true);
      expect(money2.isGreaterThan(money1)).toBe(false);
    });

    it('should compare less than', () => {
      expect(money2.isLessThan(money1)).toBe(true);
      expect(money1.isLessThan(money2)).toBe(false);
    });

    it('should check equality', () => {
      expect(money1.equals(money3)).toBe(true);
      expect(money1.equals(money2)).toBe(false);
    });

    it('should check if positive', () => {
      expect(money1.isPositive()).toBe(true);
      expect(new Money(0).isPositive()).toBe(false);
      expect(new Money(-100).isPositive()).toBe(false);
    });

    it('should check if negative', () => {
      expect(new Money(-100).isNegative()).toBe(true);
      expect(money1.isNegative()).toBe(false);
      expect(new Money(0).isNegative()).toBe(false);
    });

    it('should check if zero', () => {
      expect(new Money(0).isZero()).toBe(true);
      expect(money1.isZero()).toBe(false);
    });
  });

  describe('utility methods', () => {
    const money = new Money(1500000.5, 'USD');

    it('should get absolute value', () => {
      const negativeMoney = new Money(-1000, 'USD');
      const result = negativeMoney.abs();

      expect(result.getAmount()).toBe(1000);
      expect(result.getCurrency()).toBe('USD');
    });

    it('should format as currency', () => {
      const formatted = money.format('en-US');

      expect(formatted).toBe('$1,500,000.50');
    });

    it('should convert to string', () => {
      const str = money.toString();

      expect(str).toBe('1500000.50 USD');
    });

    it('should convert to JSON', () => {
      const json = money.toJSON();

      expect(json).toEqual({
        amount: 1500000.5,
        currency: 'USD',
      });
    });

    it('should convert to cents', () => {
      const cents = money.toCents();

      expect(cents).toBe(150000050);
    });
  });

  describe('factory methods', () => {
    it('should create from string', () => {
      const money = Money.fromString('1,500,000.50', 'USD');

      expect(money.getAmount()).toBe(1500000.5);
      expect(money.getCurrency()).toBe('USD');
    });

    it('should create from string with currency symbols', () => {
      const money = Money.fromString('$1,500,000.50');

      expect(money.getAmount()).toBe(1500000.5);
    });

    it('should create zero money', () => {
      const money = Money.zero('EUR');

      expect(money.getAmount()).toBe(0);
      expect(money.getCurrency()).toBe('EUR');
      expect(money.isZero()).toBe(true);
    });

    it('should create from cents', () => {
      const money = Money.fromCents(150000050, 'USD');

      expect(money.getAmount()).toBe(1500000.5);
      expect(money.getCurrency()).toBe('USD');
    });

    it('should reject invalid string values', () => {
      expect(() => Money.fromString('invalid')).toThrow(
        'Cannot parse amount from string: invalid',
      );
    });
  });

  describe('precision handling', () => {
    it('should handle floating point precision correctly', () => {
      const money1 = new Money(0.1, 'USD');
      const money2 = new Money(0.2, 'USD');
      const result = money1.add(money2);

      expect(result.getAmount()).toBe(0.3);
    });

    it('should maintain precision in calculations', () => {
      const money = new Money(100.33, 'USD');
      const result = money.multiply(3);

      expect(result.getAmount()).toBe(300.99);
    });
  });
});
