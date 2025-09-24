/**
 * Decimal Interest Value Object
 * Represents ownership interest in oil & gas wells with high precision
 * Used for division orders and revenue distribution calculations
 */
export class DecimalInterest {
  private readonly value: number;

  constructor(value: number) {
    this.validateDecimalInterest(value);
    // Round to 8 decimal places for precision
    this.value = Math.round(value * 100000000) / 100000000;
  }

  getValue(): number {
    return this.value;
  }

  /**
   * Get value as percentage (multiply by 100)
   */
  getPercentage(): number {
    return this.value * 100;
  }

  /**
   * Get formatted percentage string
   */
  getFormattedPercentage(): string {
    return `${(this.value * 100).toFixed(6)}%`;
  }

  /**
   * Get formatted decimal string with 8 decimal places
   */
  getFormattedDecimal(): string {
    return this.value.toFixed(8);
  }

  equals(other: DecimalInterest): boolean {
    return Math.abs(this.value - other.value) < 0.00000001;
  }

  /**
   * Add two decimal interests
   */
  add(other: DecimalInterest): DecimalInterest {
    return new DecimalInterest(this.value + other.value);
  }

  /**
   * Subtract decimal interest
   */
  subtract(other: DecimalInterest): DecimalInterest {
    return new DecimalInterest(this.value - other.value);
  }

  /**
   * Multiply decimal interest by a factor
   */
  multiply(factor: number): DecimalInterest {
    return new DecimalInterest(this.value * factor);
  }

  /**
   * Check if this interest is greater than another
   */
  isGreaterThan(other: DecimalInterest): boolean {
    return this.value > other.value;
  }

  /**
   * Check if this interest is less than another
   */
  isLessThan(other: DecimalInterest): boolean {
    return this.value < other.value;
  }

  /**
   * Check if this interest is zero
   */
  isZero(): boolean {
    return Math.abs(this.value) < 0.00000001;
  }

  toString(): string {
    return this.getFormattedDecimal();
  }

  private validateDecimalInterest(value: number): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('Decimal interest must be a valid number');
    }

    if (value < 0) {
      throw new Error('Decimal interest cannot be negative');
    }

    if (value > 1) {
      throw new Error('Decimal interest cannot exceed 1.0 (100%)');
    }

    // Check for reasonable precision (8 decimal places)
    const rounded = Math.round(value * 100000000) / 100000000;
    if (Math.abs(value - rounded) > 0.000000001) {
      throw new Error(
        'Decimal interest precision cannot exceed 8 decimal places',
      );
    }
  }

  /**
   * Create from percentage value (e.g., 12.5 becomes 0.125)
   */
  static fromPercentage(percentage: number): DecimalInterest {
    if (typeof percentage !== 'number' || isNaN(percentage)) {
      throw new Error('Percentage must be a valid number');
    }
    return new DecimalInterest(percentage / 100);
  }

  /**
   * Create from string representation
   */
  static fromString(value: string): DecimalInterest {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      throw new Error('Invalid decimal interest string format');
    }
    return new DecimalInterest(numericValue);
  }

  /**
   * Create zero decimal interest
   */
  static zero(): DecimalInterest {
    return new DecimalInterest(0);
  }

  /**
   * Create full decimal interest (100%)
   */
  static full(): DecimalInterest {
    return new DecimalInterest(1);
  }

  /**
   * Validate that a collection of decimal interests sum to 1.0
   */
  static validateSum(
    interests: DecimalInterest[],
    tolerance: number = 0.00000001,
  ): boolean {
    const sum = interests.reduce(
      (total, interest) => total + interest.getValue(),
      0,
    );
    return Math.abs(sum - 1.0) <= tolerance;
  }

  /**
   * Calculate the sum of multiple decimal interests
   */
  static sum(interests: DecimalInterest[]): DecimalInterest {
    const total = interests.reduce(
      (sum, interest) => sum + interest.getValue(),
      0,
    );
    return new DecimalInterest(total);
  }

  /**
   * Create from database decimal string (handles PostgreSQL decimal type)
   */
  static fromDatabaseDecimal(dbValue: string | number): DecimalInterest {
    if (typeof dbValue === 'string') {
      return DecimalInterest.fromString(dbValue);
    }
    return new DecimalInterest(dbValue);
  }

  /**
   * Convert to database decimal format
   */
  toDatabaseDecimal(): string {
    return this.value.toFixed(8);
  }
}
