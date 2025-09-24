/**
 * Money Value Object
 * Represents monetary amounts with currency and precision handling
 * Designed for oil & gas financial operations with high precision requirements
 */
export class Money {
  private readonly amount: number;
  private readonly currency: string;

  constructor(amount: number, currency: string = 'USD') {
    this.validateAmount(amount);
    this.validateCurrency(currency);

    // Round to 2 decimal places to avoid floating point precision issues
    this.amount = Math.round(amount * 100) / 100;
    this.currency = currency.toUpperCase();
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  /**
   * Add two money amounts (must be same currency)
   */
  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  /**
   * Subtract two money amounts (must be same currency)
   */
  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  /**
   * Multiply money by a factor
   */
  multiply(factor: number): Money {
    if (typeof factor !== 'number' || isNaN(factor)) {
      throw new Error('Multiplication factor must be a valid number');
    }
    return new Money(this.amount * factor, this.currency);
  }

  /**
   * Divide money by a divisor
   */
  divide(divisor: number): Money {
    if (typeof divisor !== 'number' || isNaN(divisor) || divisor === 0) {
      throw new Error('Division divisor must be a valid non-zero number');
    }
    return new Money(this.amount / divisor, this.currency);
  }

  /**
   * Calculate percentage of money amount
   */
  percentage(percent: number): Money {
    if (typeof percent !== 'number' || isNaN(percent)) {
      throw new Error('Percentage must be a valid number');
    }
    return new Money((this.amount * percent) / 100, this.currency);
  }

  /**
   * Check if this money amount is greater than another
   */
  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount > other.amount;
  }

  /**
   * Check if this money amount is less than another
   */
  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount < other.amount;
  }

  /**
   * Check if this money amount equals another
   */
  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  /**
   * Check if amount is zero
   */
  isZero(): boolean {
    return this.amount === 0;
  }

  /**
   * Check if amount is positive
   */
  isPositive(): boolean {
    return this.amount > 0;
  }

  /**
   * Check if amount is negative
   */
  isNegative(): boolean {
    return this.amount < 0;
  }

  /**
   * Get absolute value
   */
  abs(): Money {
    return new Money(Math.abs(this.amount), this.currency);
  }

  /**
   * Format as currency string
   */
  format(locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(this.amount);
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    return `${this.amount.toFixed(2)} ${this.currency}`;
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): { amount: number; currency: string } {
    return {
      amount: this.amount,
      currency: this.currency,
    };
  }

  private validateAmount(amount: number): void {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error('Amount must be a valid number');
    }

    if (!isFinite(amount)) {
      throw new Error('Amount must be finite');
    }

    // Check for reasonable limits (up to 1 trillion)
    if (Math.abs(amount) > 1_000_000_000_000) {
      throw new Error('Amount exceeds maximum allowed value');
    }
  }

  private validateCurrency(currency: string): void {
    if (!currency || typeof currency !== 'string') {
      throw new Error('Currency must be a valid string');
    }

    if (currency.length !== 3) {
      throw new Error('Currency must be a 3-letter ISO code');
    }

    // Basic validation for common currencies
    const validCurrencies = ['USD', 'CAD', 'EUR', 'GBP', 'JPY', 'AUD', 'CHF'];
    if (!validCurrencies.includes(currency.toUpperCase())) {
      // Allow but warn for uncommon currencies
      console.warn(`Uncommon currency code: ${currency}`);
    }
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Cannot perform operation on different currencies: ${this.currency} and ${other.currency}`,
      );
    }
  }

  /**
   * Factory method to create Money from string representation
   */
  static fromString(value: string, currency: string = 'USD'): Money {
    if (!value || typeof value !== 'string') {
      throw new Error('Value must be a valid string');
    }

    // Remove currency symbols and commas
    const cleanValue = value.replace(/[$,\s]/g, '');
    const amount = parseFloat(cleanValue);

    if (isNaN(amount)) {
      throw new Error(`Cannot parse amount from string: ${value}`);
    }

    return new Money(amount, currency);
  }

  /**
   * Factory method to create zero money
   */
  static zero(currency: string = 'USD'): Money {
    return new Money(0, currency);
  }

  /**
   * Factory method to create Money from cents (for precise calculations)
   */
  static fromCents(cents: number, currency: string = 'USD'): Money {
    if (typeof cents !== 'number' || isNaN(cents)) {
      throw new Error('Cents must be a valid number');
    }
    return new Money(cents / 100, currency);
  }

  /**
   * Convert to cents (for precise storage)
   */
  toCents(): number {
    return Math.round(this.amount * 100);
  }
}
