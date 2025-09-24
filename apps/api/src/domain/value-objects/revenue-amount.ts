import { Money } from './money';

/**
 * Revenue Amount Value Object
 * Represents revenue amounts with detailed breakdown for oil & gas operations
 * Extends Money with specific revenue calculation capabilities
 */
export class RevenueAmount {
  private readonly grossRevenue: Money;
  private readonly deductions: Money;
  private readonly netRevenue: Money;

  constructor(grossRevenue: Money, deductions: Money) {
    this.validateInputs(grossRevenue, deductions);
    this.grossRevenue = grossRevenue;
    this.deductions = deductions;
    this.netRevenue = grossRevenue.subtract(deductions);
  }

  /**
   * Get gross revenue before deductions
   */
  getGrossRevenue(): Money {
    return this.grossRevenue;
  }

  /**
   * Get total deductions
   */
  getDeductions(): Money {
    return this.deductions;
  }

  /**
   * Get net revenue after deductions
   */
  getNetRevenue(): Money {
    return this.netRevenue;
  }

  /**
   * Get deduction percentage of gross revenue
   */
  getDeductionPercentage(): number {
    if (this.grossRevenue.isZero()) {
      return 0;
    }
    return (this.deductions.getAmount() / this.grossRevenue.getAmount()) * 100;
  }

  /**
   * Get net percentage of gross revenue
   */
  getNetPercentage(): number {
    if (this.grossRevenue.isZero()) {
      return 0;
    }
    return (this.netRevenue.getAmount() / this.grossRevenue.getAmount()) * 100;
  }

  /**
   * Check if revenue is positive
   */
  isPositive(): boolean {
    return this.netRevenue.isPositive();
  }

  /**
   * Check if revenue is negative
   */
  isNegative(): boolean {
    return this.netRevenue.isNegative();
  }

  /**
   * Check if revenue is zero
   */
  isZero(): boolean {
    return this.netRevenue.isZero();
  }

  /**
   * Add another revenue amount
   */
  add(other: RevenueAmount): RevenueAmount {
    const newGrossRevenue = this.grossRevenue.add(other.grossRevenue);
    const newDeductions = this.deductions.add(other.deductions);
    return new RevenueAmount(newGrossRevenue, newDeductions);
  }

  /**
   * Subtract another revenue amount
   */
  subtract(other: RevenueAmount): RevenueAmount {
    const newGrossRevenue = this.grossRevenue.subtract(other.grossRevenue);
    const newDeductions = this.deductions.subtract(other.deductions);
    return new RevenueAmount(newGrossRevenue, newDeductions);
  }

  /**
   * Multiply revenue by a factor (for decimal interest calculations)
   */
  multiply(factor: number): RevenueAmount {
    const newGrossRevenue = this.grossRevenue.multiply(factor);
    const newDeductions = this.deductions.multiply(factor);
    return new RevenueAmount(newGrossRevenue, newDeductions);
  }

  /**
   * Apply decimal interest to calculate owner's share
   */
  applyDecimalInterest(decimalInterest: number): RevenueAmount {
    if (decimalInterest < 0 || decimalInterest > 1) {
      throw new Error('Decimal interest must be between 0 and 1');
    }
    return this.multiply(decimalInterest);
  }

  /**
   * Get formatted revenue summary
   */
  getFormattedSummary(): string {
    return [
      `Gross Revenue: ${this.grossRevenue.getFormattedAmount()}`,
      `Deductions: ${this.deductions.getFormattedAmount()}`,
      `Net Revenue: ${this.netRevenue.getFormattedAmount()}`,
    ].join('\n');
  }

  /**
   * Check if equals another revenue amount
   */
  equals(other: RevenueAmount): boolean {
    return (
      this.grossRevenue.equals(other.grossRevenue) &&
      this.deductions.equals(other.deductions)
    );
  }

  toString(): string {
    return `Revenue(Gross: ${this.grossRevenue.getFormattedAmount()}, Net: ${this.netRevenue.getFormattedAmount()})`;
  }

  private validateInputs(grossRevenue: Money, deductions: Money): void {
    if (!grossRevenue || !deductions) {
      throw new Error('Gross revenue and deductions are required');
    }

    if (!grossRevenue.getCurrency() || !deductions.getCurrency()) {
      throw new Error('Revenue amounts must have valid currencies');
    }

    if (grossRevenue.getCurrency() !== deductions.getCurrency()) {
      throw new Error(
        'Gross revenue and deductions must have the same currency',
      );
    }

    if (deductions.isNegative()) {
      throw new Error('Deductions cannot be negative');
    }

    if (deductions.isGreaterThan(grossRevenue)) {
      throw new Error('Deductions cannot exceed gross revenue');
    }
  }

  /**
   * Create from gross revenue only (zero deductions)
   */
  static fromGrossRevenue(grossRevenue: Money): RevenueAmount {
    const zeroDeductions = new Money(0, grossRevenue.getCurrency());
    return new RevenueAmount(grossRevenue, zeroDeductions);
  }

  /**
   * Create zero revenue amount
   */
  static zero(currency: string = 'USD'): RevenueAmount {
    const zeroMoney = new Money(0, currency);
    return new RevenueAmount(zeroMoney, zeroMoney);
  }

  /**
   * Create from separate amounts
   */
  static fromAmounts(
    grossAmount: number,
    deductionAmount: number,
    currency: string = 'USD',
  ): RevenueAmount {
    const grossRevenue = new Money(grossAmount, currency);
    const deductions = new Money(deductionAmount, currency);
    return new RevenueAmount(grossRevenue, deductions);
  }

  /**
   * Create from database values
   */
  static fromDatabaseValues(
    grossRevenue: string | number,
    deductions: string | number,
    currency: string = 'USD',
  ): RevenueAmount {
    const grossAmount =
      typeof grossRevenue === 'string'
        ? parseFloat(grossRevenue)
        : grossRevenue;
    const deductionAmount =
      typeof deductions === 'string' ? parseFloat(deductions) : deductions;

    return RevenueAmount.fromAmounts(grossAmount, deductionAmount, currency);
  }

  /**
   * Convert to database format
   */
  toDatabaseFormat(): {
    grossRevenue: number;
    deductions: number;
    netRevenue: number;
    currency: string;
  } {
    return {
      grossRevenue: this.grossRevenue.getAmount(),
      deductions: this.deductions.getAmount(),
      netRevenue: this.netRevenue.getAmount(),
      currency: this.grossRevenue.getCurrency(),
    };
  }
}
