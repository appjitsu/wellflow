import { Money } from '../money';
import { RevenueAmount } from '../revenue-amount';

describe('RevenueAmount', () => {
  describe('creation', () => {
    it('should create revenue amount with gross and deductions', () => {
      const grossRevenue = new Money(1000, 'USD');
      const deductions = new Money(100, 'USD');

      const revenue = new RevenueAmount(grossRevenue, deductions);

      expect(revenue.getGrossRevenue()).toEqual(grossRevenue);
      expect(revenue.getDeductions()).toEqual(deductions);
      expect(revenue.getNetRevenue().getAmount()).toBe(900);
    });

    it('should create from gross revenue only', () => {
      const grossRevenue = new Money(1000, 'USD');

      const revenue = RevenueAmount.fromGrossRevenue(grossRevenue);

      expect(revenue.getGrossRevenue()).toEqual(grossRevenue);
      expect(revenue.getDeductions().getAmount()).toBe(0);
      expect(revenue.getNetRevenue()).toEqual(grossRevenue);
    });

    it('should create zero revenue amount', () => {
      const revenue = RevenueAmount.zero('USD');

      expect(revenue.getGrossRevenue().getAmount()).toBe(0);
      expect(revenue.getDeductions().getAmount()).toBe(0);
      expect(revenue.getNetRevenue().getAmount()).toBe(0);
    });

    it('should create from amounts', () => {
      const revenue = RevenueAmount.fromAmounts(1000, 100, 'USD');

      expect(revenue.getGrossRevenue().getAmount()).toBe(1000);
      expect(revenue.getDeductions().getAmount()).toBe(100);
      expect(revenue.getNetRevenue().getAmount()).toBe(900);
    });
  });

  describe('validation', () => {
    it('should reject negative deductions', () => {
      const grossRevenue = new Money(1000, 'USD');
      const deductions = new Money(-100, 'USD');

      expect(() => new RevenueAmount(grossRevenue, deductions)).toThrow(
        'Deductions cannot be negative',
      );
    });

    it('should reject deductions exceeding gross revenue', () => {
      const grossRevenue = new Money(100, 'USD');
      const deductions = new Money(200, 'USD');

      expect(() => new RevenueAmount(grossRevenue, deductions)).toThrow(
        'Deductions cannot exceed gross revenue',
      );
    });

    it('should reject mismatched currencies', () => {
      const grossRevenue = new Money(1000, 'USD');
      const deductions = new Money(100, 'EUR');

      expect(() => new RevenueAmount(grossRevenue, deductions)).toThrow(
        'Gross revenue and deductions must have the same currency',
      );
    });
  });

  describe('calculations', () => {
    let revenue: RevenueAmount;

    beforeEach(() => {
      revenue = RevenueAmount.fromAmounts(1000, 100, 'USD');
    });

    it('should calculate deduction percentage', () => {
      expect(revenue.getDeductionPercentage()).toBe(10);
    });

    it('should calculate net percentage', () => {
      expect(revenue.getNetPercentage()).toBe(90);
    });

    it('should check if positive', () => {
      expect(revenue.isPositive()).toBe(true);
      expect(RevenueAmount.zero().isPositive()).toBe(false);
    });

    it('should check if negative', () => {
      // Note: RevenueAmount prevents creation with deductions > gross revenue
      // So we test with a revenue that has positive but small net revenue
      const smallRevenue = RevenueAmount.fromAmounts(100, 50, 'USD');
      expect(smallRevenue.isNegative()).toBe(false);
      expect(revenue.isNegative()).toBe(false);
    });

    it('should check if zero', () => {
      expect(RevenueAmount.zero().isZero()).toBe(true);
      expect(revenue.isZero()).toBe(false);
    });
  });

  describe('operations', () => {
    let revenue1: RevenueAmount;
    let revenue2: RevenueAmount;

    beforeEach(() => {
      revenue1 = RevenueAmount.fromAmounts(1000, 100, 'USD');
      revenue2 = RevenueAmount.fromAmounts(500, 50, 'USD');
    });

    it('should add revenue amounts', () => {
      const result = revenue1.add(revenue2);

      expect(result.getGrossRevenue().getAmount()).toBe(1500);
      expect(result.getDeductions().getAmount()).toBe(150);
      expect(result.getNetRevenue().getAmount()).toBe(1350);
    });

    it('should subtract revenue amounts', () => {
      const result = revenue1.subtract(revenue2);

      expect(result.getGrossRevenue().getAmount()).toBe(500);
      expect(result.getDeductions().getAmount()).toBe(50);
      expect(result.getNetRevenue().getAmount()).toBe(450);
    });

    it('should multiply by factor', () => {
      const result = revenue1.multiply(0.5);

      expect(result.getGrossRevenue().getAmount()).toBe(500);
      expect(result.getDeductions().getAmount()).toBe(50);
      expect(result.getNetRevenue().getAmount()).toBe(450);
    });

    it('should apply decimal interest', () => {
      const result = revenue1.applyDecimalInterest(0.75);

      expect(result.getGrossRevenue().getAmount()).toBe(750);
      expect(result.getDeductions().getAmount()).toBe(75);
      expect(result.getNetRevenue().getAmount()).toBe(675);
    });

    it('should reject invalid decimal interest', () => {
      expect(() => revenue1.applyDecimalInterest(1.5)).toThrow(
        'Decimal interest must be between 0 and 1',
      );
      expect(() => revenue1.applyDecimalInterest(-0.1)).toThrow(
        'Decimal interest must be between 0 and 1',
      );
    });
  });

  describe('equality', () => {
    it('should be equal for same values', () => {
      const revenue1 = RevenueAmount.fromAmounts(1000, 100, 'USD');
      const revenue2 = RevenueAmount.fromAmounts(1000, 100, 'USD');

      expect(revenue1.equals(revenue2)).toBe(true);
    });

    it('should not be equal for different values', () => {
      const revenue1 = RevenueAmount.fromAmounts(1000, 100, 'USD');
      const revenue2 = RevenueAmount.fromAmounts(1000, 200, 'USD');

      expect(revenue1.equals(revenue2)).toBe(false);
    });
  });

  describe('formatting', () => {
    it('should format summary', () => {
      const revenue = RevenueAmount.fromAmounts(1000, 100, 'USD');
      const summary = revenue.getFormattedSummary();

      expect(summary).toContain('Gross Revenue: $1,000.00');
      expect(summary).toContain('Deductions: $100.00');
      expect(summary).toContain('Net Revenue: $900.00');
    });

    it('should convert to string', () => {
      const revenue = RevenueAmount.fromAmounts(1000, 100, 'USD');
      const str = revenue.toString();

      expect(str).toContain('Revenue(Gross: $1,000.00');
      expect(str).toContain('Net: $900.00');
    });
  });

  describe('database operations', () => {
    it('should create from database values', () => {
      const revenue = RevenueAmount.fromDatabaseValues(
        '1000.50',
        '100.25',
        'USD',
      );

      expect(revenue.getGrossRevenue().getAmount()).toBe(1000.5);
      expect(revenue.getDeductions().getAmount()).toBe(100.25);
    });

    it('should convert to database format', () => {
      const revenue = RevenueAmount.fromAmounts(1000, 100, 'USD');
      const dbFormat = revenue.toDatabaseFormat();

      expect(dbFormat).toEqual({
        grossRevenue: 1000,
        deductions: 100,
        netRevenue: 900,
        currency: 'USD',
      });
    });
  });
});
