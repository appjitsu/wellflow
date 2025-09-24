import { DecimalInterest } from './decimal-interest';

describe('DecimalInterest Value Object', () => {
  describe('constructor', () => {
    it('should create decimal interest with valid value', () => {
      const interest = new DecimalInterest(0.125);

      expect(interest.getValue()).toBe(0.125);
      expect(interest.getPercentage()).toBe(12.5);
    });

    it('should round to 8 decimal places', () => {
      const interest = new DecimalInterest(0.123456789);

      expect(interest.getValue()).toBe(0.12345679);
    });

    it('should throw error for negative values', () => {
      expect(() => new DecimalInterest(-0.1)).toThrow(
        'Decimal interest cannot be negative',
      );
    });

    it('should throw error for values greater than 1', () => {
      expect(() => new DecimalInterest(1.1)).toThrow(
        'Decimal interest cannot exceed 1.0 (100%)',
      );
    });

    it('should throw error for invalid number', () => {
      expect(() => new DecimalInterest(NaN)).toThrow(
        'Decimal interest must be a valid number',
      );
    });

    it('should allow zero value', () => {
      const interest = new DecimalInterest(0);
      expect(interest.getValue()).toBe(0);
      expect(interest.isZero()).toBe(true);
    });

    it('should allow full interest (1.0)', () => {
      const interest = new DecimalInterest(1.0);
      expect(interest.getValue()).toBe(1.0);
      expect(interest.getPercentage()).toBe(100);
    });
  });

  describe('formatting methods', () => {
    it('should format percentage correctly', () => {
      const interest = new DecimalInterest(0.125);
      expect(interest.getFormattedPercentage()).toBe('12.500000%');
    });

    it('should format decimal correctly', () => {
      const interest = new DecimalInterest(0.125);
      expect(interest.getFormattedDecimal()).toBe('0.12500000');
    });

    it('should convert to string', () => {
      const interest = new DecimalInterest(0.125);
      expect(interest.toString()).toBe('0.12500000');
    });
  });

  describe('comparison methods', () => {
    it('should check equality correctly', () => {
      const interest1 = new DecimalInterest(0.125);
      const interest2 = new DecimalInterest(0.125);
      const interest3 = new DecimalInterest(0.126);

      expect(interest1.equals(interest2)).toBe(true);
      expect(interest1.equals(interest3)).toBe(false);
    });

    it('should compare greater than correctly', () => {
      const interest1 = new DecimalInterest(0.125);
      const interest2 = new DecimalInterest(0.1);

      expect(interest1.isGreaterThan(interest2)).toBe(true);
      expect(interest2.isGreaterThan(interest1)).toBe(false);
    });

    it('should compare less than correctly', () => {
      const interest1 = new DecimalInterest(0.1);
      const interest2 = new DecimalInterest(0.125);

      expect(interest1.isLessThan(interest2)).toBe(true);
      expect(interest2.isLessThan(interest1)).toBe(false);
    });
  });

  describe('arithmetic operations', () => {
    it('should add decimal interests', () => {
      const interest1 = new DecimalInterest(0.125);
      const interest2 = new DecimalInterest(0.25);
      const result = interest1.add(interest2);

      expect(result.getValue()).toBe(0.375);
    });

    it('should subtract decimal interests', () => {
      const interest1 = new DecimalInterest(0.25);
      const interest2 = new DecimalInterest(0.125);
      const result = interest1.subtract(interest2);

      expect(result.getValue()).toBe(0.125);
    });

    it('should multiply decimal interest', () => {
      const interest = new DecimalInterest(0.125);
      const result = interest.multiply(2);

      expect(result.getValue()).toBe(0.25);
    });
  });

  describe('static factory methods', () => {
    it('should create from percentage', () => {
      const interest = DecimalInterest.fromPercentage(12.5);
      expect(interest.getValue()).toBe(0.125);
    });

    it('should create from string', () => {
      const interest = DecimalInterest.fromString('0.125');
      expect(interest.getValue()).toBe(0.125);
    });

    it('should create zero interest', () => {
      const interest = DecimalInterest.zero();
      expect(interest.getValue()).toBe(0);
      expect(interest.isZero()).toBe(true);
    });

    it('should create full interest', () => {
      const interest = DecimalInterest.full();
      expect(interest.getValue()).toBe(1);
    });

    it('should throw error for invalid string', () => {
      expect(() => DecimalInterest.fromString('invalid')).toThrow(
        'Invalid decimal interest string format',
      );
    });
  });

  describe('validation methods', () => {
    it('should validate sum correctly', () => {
      const interests = [
        new DecimalInterest(0.25),
        new DecimalInterest(0.25),
        new DecimalInterest(0.5),
      ];

      expect(DecimalInterest.validateSum(interests)).toBe(true);
    });

    it('should detect invalid sum', () => {
      const interests = [
        new DecimalInterest(0.25),
        new DecimalInterest(0.25),
        new DecimalInterest(0.4),
      ];

      expect(DecimalInterest.validateSum(interests)).toBe(false);
    });

    it('should calculate sum correctly', () => {
      const interests = [
        new DecimalInterest(0.25),
        new DecimalInterest(0.25),
        new DecimalInterest(0.25),
      ];

      const sum = DecimalInterest.sum(interests);
      expect(sum.getValue()).toBe(0.75);
    });
  });

  describe('database methods', () => {
    it('should convert to database decimal', () => {
      const interest = new DecimalInterest(0.125);
      expect(interest.toDatabaseDecimal()).toBe('0.12500000');
    });

    it('should create from database decimal string', () => {
      const interest = DecimalInterest.fromDatabaseDecimal('0.12500000');
      expect(interest.getValue()).toBe(0.125);
    });

    it('should create from database decimal number', () => {
      const interest = DecimalInterest.fromDatabaseDecimal(0.125);
      expect(interest.getValue()).toBe(0.125);
    });
  });
});
