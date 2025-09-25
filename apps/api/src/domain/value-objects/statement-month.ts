/**
 * Statement Month Value Object
 * Represents a specific month and year for lease operating statements
 * Ensures proper validation and formatting for monthly reporting periods
 */
export class StatementMonth {
  private readonly year: number;
  private readonly month: number; // 1-12

  constructor(year: number, month: number) {
    this.validateYear(year);
    this.validateMonth(month);

    this.year = year;
    this.month = month;
  }

  getYear(): number {
    return this.year;
  }

  getMonth(): number {
    return this.month;
  }

  /**
   * Get the first day of the statement month
   */
  getStartDate(): Date {
    return new Date(this.year, this.month - 1, 1);
  }

  /**
   * Get the last day of the statement month
   */
  getEndDate(): Date {
    return new Date(this.year, this.month, 0);
  }

  /**
   * Get the first day of the statement month (alias for getStartDate)
   */
  getFirstDayOfMonth(): Date {
    return this.getStartDate();
  }

  /**
   * Get the last day of the statement month (alias for getEndDate)
   */
  getLastDayOfMonth(): Date {
    return this.getEndDate();
  }

  /**
   * Format as YYYY-MM string
   */
  toString(): string {
    return `${this.year}-${this.month.toString().padStart(2, '0')}`;
  }

  /**
   * Format as human-readable string (e.g., "January 2024")
   */
  toDisplayString(): string {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return `${monthNames[this.month - 1]} ${this.year}`;
  }

  /**
   * Format as short human-readable string (e.g., "Mar 2024")
   */
  toShortDisplayString(): string {
    const shortMonthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return `${shortMonthNames[this.month - 1]} ${this.year}`;
  }

  /**
   * Check if this statement month equals another
   */
  equals(other: StatementMonth): boolean {
    return this.year === other.year && this.month === other.month;
  }

  /**
   * Check if this statement month is before another
   */
  isBefore(other: StatementMonth): boolean {
    if (this.year !== other.year) {
      return this.year < other.year;
    }
    return this.month < other.month;
  }

  /**
   * Check if this statement month is after another
   */
  isAfter(other: StatementMonth): boolean {
    if (this.year !== other.year) {
      return this.year > other.year;
    }
    return this.month > other.month;
  }

  /**
   * Get the next month
   */
  getNextMonth(): StatementMonth {
    if (this.month === 12) {
      return new StatementMonth(this.year + 1, 1);
    }
    return new StatementMonth(this.year, this.month + 1);
  }

  /**
   * Get the previous month
   */
  getPreviousMonth(): StatementMonth {
    if (this.month === 1) {
      return new StatementMonth(this.year - 1, 12);
    }
    return new StatementMonth(this.year, this.month - 1);
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): {
    year: number;
    month: number;
    displayString: string;
    isoString: string;
  } {
    return {
      year: this.year,
      month: this.month,
      displayString: this.toDisplayString(),
      isoString: this.toString(),
    };
  }

  private validateYear(year: number): void {
    if (typeof year !== 'number' || !Number.isInteger(year)) {
      throw new Error('Year must be a valid integer');
    }

    if (year < 2000 || year > 2100) {
      throw new Error('Year must be between 2000 and 2100');
    }
  }

  private validateMonth(month: number): void {
    if (typeof month !== 'number' || !Number.isInteger(month)) {
      throw new Error('Month must be a valid integer');
    }

    if (month < 1 || month > 12) {
      throw new Error('Month must be between 1 and 12');
    }
  }

  /**
   * Factory method to create StatementMonth from string (YYYY-MM format)
   */
  static fromString(value: string): StatementMonth {
    if (!value || typeof value !== 'string') {
      throw new Error('Value must be a valid string');
    }

    const regex = /^(\d{4})-(\d{2})$/;
    const match = regex.exec(value);
    if (!match) {
      throw new Error('Invalid date string format');
    }

    const year = parseInt(match[1] as string, 10);
    const month = parseInt(match[2] as string, 10);

    return new StatementMonth(year, month);
  }

  /**
   * Factory method to create StatementMonth from Date
   */
  static fromDate(date: Date): StatementMonth {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error('Date must be a valid Date object');
    }

    return new StatementMonth(date.getFullYear(), date.getMonth() + 1);
  }

  /**
   * Factory method to create StatementMonth for current month
   */
  static current(): StatementMonth {
    const now = new Date();
    return new StatementMonth(now.getFullYear(), now.getMonth() + 1);
  }

  /**
   * Factory method to create StatementMonth for previous month
   */
  static previousMonth(): StatementMonth {
    return StatementMonth.current().getPreviousMonth();
  }
}
