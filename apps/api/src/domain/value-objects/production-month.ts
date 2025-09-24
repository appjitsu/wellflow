/**
 * Production Month Value Object
 * Represents a specific month for oil & gas production reporting
 * Ensures consistent date handling for revenue distribution calculations
 */
export class ProductionMonth {
  private readonly date: Date;

  constructor(year: number, month: number) {
    this.validateInputs(year, month);
    // Create date for the first day of the month
    this.date = new Date(year, month - 1, 1);
  }

  /**
   * Get the year
   */
  getYear(): number {
    return this.date.getFullYear();
  }

  /**
   * Get the month (1-12)
   */
  getMonth(): number {
    return this.date.getMonth() + 1;
  }

  /**
   * Get the Date object (first day of the month)
   */
  getDate(): Date {
    return new Date(this.date);
  }

  /**
   * Get formatted string (YYYY-MM)
   */
  getFormattedString(): string {
    const year = this.date.getFullYear();
    const month = (this.date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Get display string (e.g., "January 2024")
   */
  getDisplayString(): string {
    return this.date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  }

  /**
   * Get short display string (e.g., "Jan 2024")
   */
  getShortDisplayString(): string {
    return this.date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  }

  /**
   * Get the last day of the month
   */
  getLastDayOfMonth(): Date {
    return new Date(this.date.getFullYear(), this.date.getMonth() + 1, 0);
  }

  /**
   * Get the number of days in this month
   */
  getDaysInMonth(): number {
    return this.getLastDayOfMonth().getDate();
  }

  /**
   * Check if this is the current month
   */
  isCurrentMonth(): boolean {
    const now = new Date();
    return (
      this.date.getFullYear() === now.getFullYear() &&
      this.date.getMonth() === now.getMonth()
    );
  }

  /**
   * Check if this month is in the past
   */
  isPastMonth(): boolean {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.date < currentMonth;
  }

  /**
   * Check if this month is in the future
   */
  isFutureMonth(): boolean {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.date > currentMonth;
  }

  /**
   * Get the previous month
   */
  getPreviousMonth(): ProductionMonth {
    const prevDate = new Date(this.date);
    prevDate.setMonth(prevDate.getMonth() - 1);
    return new ProductionMonth(prevDate.getFullYear(), prevDate.getMonth() + 1);
  }

  /**
   * Get the next month
   */
  getNextMonth(): ProductionMonth {
    const nextDate = new Date(this.date);
    nextDate.setMonth(nextDate.getMonth() + 1);
    return new ProductionMonth(nextDate.getFullYear(), nextDate.getMonth() + 1);
  }

  /**
   * Check if this month equals another
   */
  equals(other: ProductionMonth): boolean {
    return (
      this.date.getFullYear() === other.date.getFullYear() &&
      this.date.getMonth() === other.date.getMonth()
    );
  }

  /**
   * Check if this month is before another
   */
  isBefore(other: ProductionMonth): boolean {
    return this.date < other.date;
  }

  /**
   * Check if this month is after another
   */
  isAfter(other: ProductionMonth): boolean {
    return this.date > other.date;
  }

  /**
   * Calculate months between this and another month
   */
  monthsBetween(other: ProductionMonth): number {
    const yearDiff = other.date.getFullYear() - this.date.getFullYear();
    const monthDiff = other.date.getMonth() - this.date.getMonth();
    return yearDiff * 12 + monthDiff;
  }

  toString(): string {
    return this.getFormattedString();
  }

  private validateInputs(year: number, month: number): void {
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      throw new Error('Year must be an integer between 1900 and 2100');
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new Error('Month must be an integer between 1 and 12');
    }
  }

  /**
   * Create from Date object
   */
  static fromDate(date: Date): ProductionMonth {
    return new ProductionMonth(date.getFullYear(), date.getMonth() + 1);
  }

  /**
   * Create from string (YYYY-MM format)
   */
  static fromString(dateString: string): ProductionMonth {
    const match = /^(\d{4})-(\d{2})$/.exec(dateString);
    if (!match) {
      throw new Error('Invalid date string format. Expected YYYY-MM');
    }

    const year = parseInt(match[1] as string, 10);
    const month = parseInt(match[2] as string, 10);
    return new ProductionMonth(year, month);
  }

  /**
   * Create current month
   */
  static current(): ProductionMonth {
    const now = new Date();
    return new ProductionMonth(now.getFullYear(), now.getMonth() + 1);
  }

  /**
   * Create previous month
   */
  static previous(): ProductionMonth {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return new ProductionMonth(
      prevMonth.getFullYear(),
      prevMonth.getMonth() + 1,
    );
  }

  /**
   * Generate a range of production months
   */
  static range(
    start: ProductionMonth,
    end: ProductionMonth,
  ): ProductionMonth[] {
    if (start.isAfter(end)) {
      throw new Error('Start month must be before or equal to end month');
    }

    const months: ProductionMonth[] = [];
    let current = start;

    while (!current.isAfter(end)) {
      months.push(current);
      current = current.getNextMonth();
    }

    return months;
  }

  /**
   * Create from database date (handles PostgreSQL date type)
   */
  static fromDatabaseDate(dbDate: Date | string): ProductionMonth {
    if (typeof dbDate === 'string') {
      // Handle string dates like '2024-03-01' by parsing year and month directly
      const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(dbDate);
      if (match) {
        const year = parseInt(match[1] as string, 10);
        const month = parseInt(match[2] as string, 10);
        return new ProductionMonth(year, month);
      }
      // Fallback to Date parsing
      const date = new Date(dbDate);
      return ProductionMonth.fromDate(date);
    }
    return ProductionMonth.fromDate(dbDate);
  }

  /**
   * Convert to database date format (first day of month)
   */
  toDatabaseDate(): Date {
    return new Date(this.date);
  }
}
